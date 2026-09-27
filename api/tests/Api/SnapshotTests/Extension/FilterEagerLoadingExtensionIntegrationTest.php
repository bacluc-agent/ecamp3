<?php

namespace App\Tests\Api\SnapshotTests\Extension;

use ApiPlatform\Doctrine\Orm\Util\QueryNameGenerator;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Operation;
use App\Doctrine\Orm\Extension\FilterEagerLoadingsExtension;
use App\Entity\CampCollaboration;
use App\Repository\CampCollaborationRepository;
use App\Tests\Api\ECampApiTestCase;
use Doctrine\ORM\QueryBuilder;

use function PHPUnit\Framework\assertThat;
use function PHPUnit\Framework\equalTo;

/**
 * @internal
 */
class FilterEagerLoadingExtensionIntegrationTest extends ECampApiTestCase {
    private CampCollaborationRepository $repository;
    private QueryNameGenerator $queryNameGenerator;
    private Operation $operation;
    private array $context = [];
    private FilterEagerLoadingsExtension $filterEagerLoadingExtension;

    #[\Override]
    public function setUp(): void {
        parent::setUp();
        $container = static::getContainer();

        $this->repository = $container->get(CampCollaborationRepository::class);
        $this->queryNameGenerator = new QueryNameGenerator();
        $this->entityClass = CampCollaboration::class;
        $this->operation = new GetCollection();
        $this->filterEagerLoadingExtension = $container->get(FilterEagerLoadingsExtension::class);
    }

    public function testLetQueryAsIsIfNoCondition() {
        $queryBuilder = $this->repository->createQueryBuilder('o');
        $sqlBefore = $this->toSql($queryBuilder);

        $this->applyExtension($queryBuilder);

        assertThat($this->toSql($queryBuilder), equalTo($sqlBefore));
    }

    public function testOptimizeQueryWhenFilterHitsToManyJoin() {
        $activity = static::getFixture('activity1');
        $queryBuilder = $this->repository->createQueryBuilder('o');
        $queryBuilder = $queryBuilder
            ->innerJoin('o.activityResponsibles', 'activityResponsibles_a1')
            ->innerJoin('activityResponsibles_a1.activity', 'a2')
            ->where('a2 = :activity_p1')
            ->orWhere(
                $queryBuilder->expr()->andX(
                    $queryBuilder->expr()->eq('a2.title', ':text'),
                    $queryBuilder->expr()->lte('a2.title', ':text'),
                    $queryBuilder->expr()->orX(
                        $queryBuilder->expr()->in('a2.title', [':text']),
                        $queryBuilder->expr()->eq((string) $queryBuilder->expr()->lower('a2.title'), ':text')
                    )
                )
            )
            ->setParameter('activity_p1', $activity)
            ->setParameter('text', 'text')
        ;

        $this->applyExtension($queryBuilder);

        $this->assertMatchesSnapshot($this->toSql($queryBuilder));
    }

    private function applyExtension($queryBuilder): void {
        $this->filterEagerLoadingExtension->applyToCollection(
            queryBuilder: $queryBuilder,
            queryNameGenerator: $this->queryNameGenerator,
            resourceClass: $this->entityClass,
            operation: $this->operation,
            context: $this->context
        );
    }

    private function toSql(QueryBuilder $queryBuilder): array|string {
        return $queryBuilder->getQuery()->getSQL();
    }
}
