<?php

declare(strict_types=1);

namespace App\Tests\HttpCache;

use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\IriConverterInterface;
use ApiPlatform\Metadata\Resource\Factory\ResourceMetadataCollectionFactoryInterface;
use App\Entity\Activity;
use App\Entity\Camp;
use App\Entity\Category;
use App\Entity\Period;
use App\Entity\ScheduleEntry;
use App\HttpCache\AddCollectionTagsListener;
use App\HttpCache\ResponseTagger;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;

/**
 * @internal
 */
#[AllowMockObjectsWithoutExpectations]
class AddCollectionTagsListenerTest extends TestCase {
    public function testAddsOnlyCanonicalCollectionTagWithoutQueryString(): void {
        $tags = $this->collectTags('/camps/1/activities', Activity::class);

        self::assertCount(1, $tags);
        self::assertEqualsCanonicalizing(['/camps/1/activities'], $tags);
        foreach ($tags as $tag) {
            self::assertStringNotContainsString('?', $tag);
        }
    }

    public function testAddsCampQueryTagForQueriedCollectionOnCampPath(): void {
        $tags = $this->collectTags('/camps/1/activities?status=active', Activity::class);

        self::assertCount(3, $tags);
        self::assertEqualsCanonicalizing(['/camps/1/activities', '/camps/1/activities?', '?1'], $tags);
    }

    public function testAddsCategoryQueryTagForQueriedCategoryCollectionOnCampPath(): void {
        $tags = $this->collectTags('/camps/1/categories?foo=bar', Category::class);

        self::assertCount(3, $tags);
        self::assertEqualsCanonicalizing(['/camps/1/categories', '/camps/1/categories?', '?1#categories'], $tags);
        self::assertNotContains('?1', $tags);
    }

    public function testResolvesCampFromCampQueryParam(): void {
        $tags = $this->collectTags('/activities?camp=%2Fcamps%2F7&foo=bar', Activity::class);

        self::assertCount(3, $tags);
        self::assertEqualsCanonicalizing(['/activities', '/activities?', '?7'], $tags);
    }

    public function testResolvesCampFromPeriodPath(): void {
        $tags = $this->collectTags(
            '/periods/9/schedule_entries?foo=bar',
            ScheduleEntry::class,
            $this->entityManagerReturningPeriodWithCampId('7'),
        );

        self::assertCount(3, $tags);
        self::assertEqualsCanonicalizing(['/periods/9/schedule_entries', '/periods/9/schedule_entries?', '?7'], $tags);
    }

    public function testResolvesCampFromPeriodQueryParam(): void {
        $tags = $this->collectTags(
            '/activities?period=%2Fperiods%2F9',
            Activity::class,
            $this->entityManagerReturningPeriodWithCampId('7'),
        );

        self::assertCount(3, $tags);
        self::assertEqualsCanonicalizing(['/activities', '/activities?', '?7'], $tags);
    }

    /**
     * @return string[] every tag passed to ResponseTagger::addTags, in call order
     */
    private function collectTags(string $uri, string $resourceClass, ?EntityManagerInterface $em = null): array {
        $addedTags = [];
        $responseTagger = $this->createMock(ResponseTagger::class);
        $responseTagger->method('addTags')->willReturnCallback(function (array $tags) use (&$addedTags): void {
            $addedTags = array_merge($addedTags, $tags);
        });

        $request = Request::create($uri);

        $iriConverter = $this->createStub(IriConverterInterface::class);
        $iriConverter->method('getIriFromResource')->willReturn($request->getPathInfo());

        $listener = new AddCollectionTagsListener(
            $iriConverter,
            $this->createStub(ResourceMetadataCollectionFactoryInterface::class),
            $responseTagger,
            $em ?? $this->createStub(EntityManagerInterface::class),
        );

        $request->attributes->set('_api_resource_class', $resourceClass);
        $request->attributes->set('_api_operation_name', 'get_collection');
        $request->attributes->set('_api_operation', new GetCollection()->withClass($resourceClass));

        $listener->onKernelResponse(new ResponseEvent(
            $this->createStub(HttpKernelInterface::class),
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            new Response(),
        ));

        return $addedTags;
    }

    private function entityManagerReturningPeriodWithCampId(string $campId): EntityManagerInterface {
        $camp = $this->createStub(Camp::class);
        $camp->method('getId')->willReturn($campId);

        $period = new Period();
        $period->camp = $camp;

        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('find')->willReturn($period);

        return $em;
    }
}
