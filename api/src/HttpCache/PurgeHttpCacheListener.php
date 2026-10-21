<?php

/*
 * This file was originally copied from api-platform/core, but modified to implement our own cache tag logic.
 *
 * For original author and license information see upstream file.
 *
 * Upstream file (main branch):               https://github.com/api-platform/core/blob/main/src/Doctrine/EventListener/PurgeHttpCacheListener.php
 * Upstream file (last synchronized version): https://github.com/api-platform/core/blob/d8e2d0c5e9b48c15d60a734086b0102b6ecf95c8/src/Doctrine/EventListener/PurgeHttpCacheListener.php
 * Last synchronized commit:                  2024-03-05 / d8e2d0c5e9b48c15d60a734086b0102b6ecf95c8
 */

declare(strict_types=1);

namespace App\HttpCache;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Exception\InvalidArgumentException;
use ApiPlatform\Metadata\Exception\RuntimeException;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\IriConverterInterface;
use ApiPlatform\Metadata\Link;
use ApiPlatform\Metadata\Resource\Factory\ResourceMetadataCollectionFactoryInterface;
use ApiPlatform\Metadata\ResourceClassResolverInterface;
use ApiPlatform\Metadata\UrlGeneratorInterface;
use ApiPlatform\Metadata\Util\ClassInfoTrait;
use App\Entity\BaseEntity;
use App\Entity\BelongsToCampInterface;
use App\Entity\Camp;
use App\Entity\Category;
use App\Entity\ContentNode;
use App\Entity\ContentType;
use App\Entity\HasId;
use Doctrine\Common\Util\ClassUtils;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Mapping\AssociationMapping;
use Doctrine\ORM\Mapping\ClassMetadata;
use Doctrine\ORM\PersistentCollection;
use FOS\HttpCacheBundle\CacheManager;
use Symfony\Component\PropertyAccess\Exception\NoSuchPropertyException;
use Symfony\Component\PropertyAccess\PropertyAccessorInterface;

/**
 * Purges responses containing modified entities from the proxy cache.
 */
final readonly class PurgeHttpCacheListener {
    use ClassInfoTrait;

    public const string IRI_RELATION_DELIMITER = '#';

    public const string QUERY_TAG = '?';

    public const string CATEGORY_QUERY_TAG = '#categories';

    public function __construct(
        private IriConverterInterface $iriConverter,
        private ResourceClassResolverInterface $resourceClassResolver,
        private PropertyAccessorInterface $propertyAccessor,
        private ResourceMetadataCollectionFactoryInterface $resourceMetadataCollectionFactory,
        private CacheManager $cacheManager,
        private EntityManagerInterface $em,
    ) {}

    /**
     * Collects tags from the previous and the current version of the updated entities to purge related documents.
     */
    public function preUpdate(PreUpdateEventArgs $eventArgs): void {
        $changeSet = $eventArgs->getEntityChangeSet();
        $objectManager = $eventArgs->getObjectManager();
        $associationMappings = $objectManager->getClassMetadata(ClassUtils::getClass($eventArgs->getObject()))->getAssociationMappings();

        foreach ($changeSet as $key => $value) {
            if (!isset($associationMappings[$key])) {
                continue;
            }
            $mappings = $associationMappings[$key];
            $relatedProperty = $mappings['isOwningSide'] ? $mappings['inversedBy'] : $mappings['mappedBy'];
            if (!$relatedProperty) {
                continue;
            }

            $this->addTagsFor($value[0], $relatedProperty);
            $this->addTagsFor($value[1], $relatedProperty);
        }
    }

    /**
     * Collects tags from inserted, updated and deleted entities, including relations.
     */
    public function onFlush(): void {
        $uow = $this->em->getUnitOfWork();
        $queryTags = [];
        // Content nodes deleted as part of a category cascade must not emit the camp-wide
        // ?{campId} query tag: the category deletion itself already purges the affected
        // collection tags, and the cascade would otherwise evict the whole camp.
        $deletedCategoryContentNodeIds = [];
        $scheduledDeletions = $uow->getScheduledEntityDeletions();
        foreach ($scheduledDeletions as $entity) {
            if ($entity instanceof Category) {
                foreach ($entity->getContentNodes() as $contentNode) {
                    $deletedCategoryContentNodeIds[$contentNode->getId()] = true;
                }
            }
        }

        foreach ($uow->getScheduledEntityInsertions() as $entity) {
            $tag = $this->getQueryTag($entity);
            if ($tag) {
                $queryTags[$tag] = true;
            }
            $this->gatherResourceTags($entity);
            $this->gatherRelationTags($entity);
        }

        foreach ($uow->getScheduledEntityUpdates() as $entity) {
            $originalEntity = $this->getOriginalEntity($entity);
            $tag = $this->getQueryTag($entity);
            if ($tag) {
                $queryTags[$tag] = true;
            }
            $tag = $this->getQueryTag($originalEntity);
            if ($tag) {
                $queryTags[$tag] = true;
            }
            $this->addTagForItem($entity);
            $this->gatherResourceTags($entity, $originalEntity);
        }

        foreach ($scheduledDeletions as $entity) {
            $originalEntity = $this->getOriginalEntity($entity);
            $tag = $entity instanceof ContentNode && isset($deletedCategoryContentNodeIds[$entity->getId()])
                ? null
                : $this->getQueryTag($originalEntity);
            if ($tag) {
                $queryTags[$tag] = true;
            }
            $this->addTagForItem($originalEntity);
            $this->gatherResourceTags($originalEntity);
            $this->gatherRelationTags($originalEntity);
        }

        // trigger cache purges for changes on many-to-many relations
        // for some reason, changes to Many-To-Many relations are not included in the preUpdate changeSet
        foreach ($uow->getScheduledCollectionUpdates() as $collection) {
            $this->addTagsForManyToManyRelations($collection, $collection->getInsertDiff());
            $this->addTagsForManyToManyRelations($collection, $collection->getDeleteDiff());
        }
        foreach ($uow->getScheduledCollectionDeletions() as $collection) {
            $this->addTagsForManyToManyRelations($collection, $collection->getDeleteDiff());
        }
        foreach (array_keys($queryTags) as $queryTag) {
            $this->cacheManager->invalidateTags([$queryTag]);
        }
    }

    /**
     * Purges tags collected during this request, and clears the tag list.
     */
    public function postFlush(): void {
        $this->cacheManager->flush();
    }

    private function addTagsForManyToManyRelations($collection, $entities) {
        $associationMapping = $collection->getMapping();

        if (ClassMetadata::MANY_TO_MANY !== $associationMapping['type']) {
            return;
        }

        foreach ($entities as $entity) {
            $relatedProperty = $associationMapping['isOwningSide'] ? $associationMapping['inversedBy'] : $associationMapping['mappedBy'];
            if (!$relatedProperty) {
                continue;
            }

            $this->addTagForItem($entity, $relatedProperty);
        }
    }

    /**
     * Computes the original state of the entity based on the current entity and on the changeset.
     */
    private function getOriginalEntity($entity) {
        $uow = $this->em->getUnitOfWork();
        $changeSet = $uow->getEntityChangeSet($entity);
        $classMetadata = $this->em->getClassMetadata(ClassUtils::getClass($entity));

        $originalEntity = clone $entity;
        $this->em->detach($originalEntity);
        foreach ($changeSet as $key => $value) {
            $classMetadata->setFieldValue($originalEntity, $key, $value[0]);
        }

        return $originalEntity;
    }

    /**
     * Purges all collections (GetCollection operations), in which entity is listed on top level.
     *
     * If oldEntity is provided, purge is only done if the IRI of the collection has changed
     * (e.g. for updating period on a ScheduleEntry and the IRI changes from /periods/1/schedule_entries to /periods/2/schedule_entries)
     */
    private function gatherResourceTags(object $entity, ?object $oldEntity = null): void {
        $entityClass = $this->getObjectClass($entity);
        if (!$this->resourceClassResolver->isResourceClass($entityClass)) {
            return;
        }

        $resourceClass = $this->resourceClassResolver->getResourceClass($entity);
        $this->gatherResourceTagsForClass($resourceClass, $entity, $oldEntity);

        // also purge parent classes (e.g. /content_nodes)
        $classMetadata = $this->em->getClassMetadata(ClassUtils::getClass($entity));
        foreach ($classMetadata->parentClasses as $parentClass) {
            $this->gatherResourceTagsForClass($parentClass, $entity, $oldEntity);
        }
    }

    private function gatherResourceTagsForClass(string $resourceClass, object $entity, ?object $oldEntity = null): void {
        $resourceMetadataCollection = $this->resourceMetadataCollectionFactory->create($resourceClass);
        $resourceIterator = $resourceMetadataCollection->getIterator();
        while ($resourceIterator->valid()) {
            /** @var ApiResource $metadata */
            $metadata = $resourceIterator->current();

            foreach ($metadata->getOperations() ?? [] as $operation) {
                // Category updates must not purge the camp subresource collection
                // '/camps/{campId}/categories': the cached listing carries the id tag of every
                // embedded category, so the item tag invalidated in onFlush() already evicts it.
                // Creates and deletes still purge it, because the listing membership changes.
                if ($operation instanceof GetCollection
                    && !($oldEntity && $entity instanceof Category && Category::CAMP_SUBRESOURCE_URI_TEMPLATE === $operation->getUriTemplate())
                ) {
                    $this->invalidateCollection($operation, $entity, $oldEntity);
                }
            }
            $resourceIterator->next();
        }
    }

    /**
     * Purges a single collection (GetCollection operation).
     *
     * If oldEntity is provided, purge is only done if the IRI of the collection has changed
     * (e.g. for updating period on a ScheduleEntry and the IRI changes from /periods/1/schedule_entries to /periods/2/schedule_entries)
     */
    private function invalidateCollection(GetCollection $operation, object $entity, ?object $oldEntity = null): void {
        $iri = $this->resolveCollectionIri($operation, $entity);
        $oldIri = $oldEntity ? $this->resolveCollectionIri($operation, $oldEntity) : null;

        // Purge the canonical collection IRI and its query-param variant `{iri}?` (added by
        // AddCollectionTagsListener for requests with a query string), so the unfiltered and
        // every filtered entry of the collection are evicted together. The canonical IRI is
        // purged even when it did not change (e.g. a category PATCH), the old IRI only when it
        // differs (e.g. moving a schedule entry to another period).
        if ($iri) {
            $this->cacheManager->invalidateTags([$iri, $iri.self::QUERY_TAG]);
        }
        if ($oldIri && $oldIri !== $iri) {
            $this->cacheManager->invalidateTags([$oldIri, $oldIri.self::QUERY_TAG]);
        }
    }

    /**
     * Resolves the IRI of a collection operation for an entity, or null when it cannot be
     * generated (missing uri variables, or a route whose parameters cannot be derived).
     */
    private function resolveCollectionIri(GetCollection $operation, object $entity): ?string {
        if (!$this->canGenerateIri($operation, $entity)) {
            return null;
        }

        try {
            return $this->iriConverter->getIriFromResource($entity, UrlGeneratorInterface::ABS_PATH, $operation);
        } catch (NoSuchPropertyException $e) { // @phpstan-ignore catch.neverThrown
            // NoSuchPropertyException is thrown for cases where uri parameters cannot determined automatically
            // (for example for the folowing route '/content_node/checklist_nodes/{checklistNodeId}/checklist_items{._format}')
            // if such routes should be cached, custom logic is needed to purge the correct IRIs

            return null;
        }
    }

    /**
     * Invalidate all relation tags of foreign objects ($relatedObject), in which $entity appears.
     *
     * @psalm-suppress UndefinedClass
     */
    private function gatherRelationTags(object $entity): void {
        $associationMappings = $this->em->getClassMetadata(ClassUtils::getClass($entity))->getAssociationMappings();

        foreach ($associationMappings as $property => $associationMapping) {
            if ($associationMapping instanceof AssociationMapping && $associationMapping->targetEntity && !$this->resourceClassResolver->isResourceClass($associationMapping->targetEntity)) {
                return;
            }

            $relatedProperty = $associationMapping['isOwningSide'] ? $associationMapping['inversedBy'] : $associationMapping['mappedBy'];
            if (!$relatedProperty) {
                continue;
            }

            if (!$this->propertyAccessor->isReadable($entity, $property)) {
                continue;
            }
            $relatedObject = $this->propertyAccessor->getValue($entity, $property);
            if ($relatedObject === $entity) {
                continue;
            }

            // Category -> Camp/ContentType must not purge the related collection here:
            // the camp-wide ?{campId}#categories tag from getQueryTag() already evicts every
            // category listing, and purging '/camps?', '/content_types' would evict far more
            // than the category change affects.
            $this->addTagsFor(
                $relatedObject,
                $relatedProperty,
                !(
                    $entity instanceof Category
                    && ($relatedObject instanceof Camp || ContentType::class === $associationMapping['targetEntity'])
                )
            );
        }
    }

    private function addTagsFor(mixed $value, ?string $property = null, bool $purgeCollectionTags = false): void {
        if (!$value || \is_scalar($value)) {
            return;
        }

        if (!is_iterable($value)) {
            $this->addTagForItem($value, $property);
            if ($purgeCollectionTags && is_object($value)) {
                $this->gatherResourceTags($value);
            }

            return;
        }

        if ($value instanceof PersistentCollection) {
            $value = clone $value;
        }

        foreach ($value as $v) {
            $this->addTagForItem($v, $property);
            if ($purgeCollectionTags && is_object($v)) {
                $this->gatherResourceTags($v);
            }
        }
    }

    private function addTagForItem(mixed $value, ?string $property = null): void {
        if (!$this->resourceClassResolver->isResourceClass($this->getObjectClass($value))) {
            return;
        }

        try {
            if ($value instanceof BaseEntity) {
                $iri = $value->getId();
            } else {
                $iri = $this->iriConverter->getIriFromResource($value);
            }
            if ($iri && $property) {
                $iri .= self::IRI_RELATION_DELIMITER.$property;
            }
            if ($iri) {
                $this->cacheManager->invalidateTags([$iri]);
            }
        } catch (InvalidArgumentException|RuntimeException) {
        }
    }

    private function canGenerateIri(GetCollection $operation, object $entity) {
        if (is_iterable($operation->getUriVariables())) {
            // UriVariable is Link, toProperty is set, fromClass is a entity
            foreach ($operation->getUriVariables() as $uriVariable) {
                if (is_a($uriVariable, Link::class)
                    && is_string($uriVariable->getToProperty())
                    && is_a($uriVariable->getFromClass(), HasId::class, true)
                ) {
                    // value of toProperty is NULL; Read of its ID will throw Exception
                    // -> invalid
                    if (null == $entity->{$uriVariable->getToProperty()}) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    private function getQueryTag(object $entity): ?string {
        $camp = $entity instanceof BelongsToCampInterface ? $entity->getCamp() : null;

        // A category change also invalidates the camp category listings: AddCollectionTagsListener
        // adds ?{campId}#categories as soon as the camp is resolved on a queried /categories
        // collection, so category changes must purge that tag too; other entities only need ?{campId}.
        return $camp?->getId()
            ? self::QUERY_TAG.$camp->getId().($entity instanceof Category ? self::CATEGORY_QUERY_TAG : '')
            : null;
    }
}
