<?php

declare(strict_types=1);

namespace App\Tests\Doctrine;

use Doctrine\Deprecations\Deprecation;
use Doctrine\ORM\Mapping\ClassMetadata;
use Doctrine\ORM\Mapping\Driver\AttributeDriver;
use Doctrine\Persistence\Mapping\RuntimeReflectionService;
use PHPUnit\Framework\TestCase;

/**
 * Maps every class of App\Entity with a private AttributeDriver and asserts that no
 * #[ORM\OrderBy] string direction sneaks back in. The deprecation counter is read
 * immediately before and after the loop, so unrelated 11313 deprecations triggered
 * earlier in the same process cancel out.
 *
 * @internal
 */
class OrderByDirectionTest extends TestCase {
    public function testEntityOrderByDirectionsDoNotTriggerDeprecation(): void {
        Deprecation::enableTrackingDeprecations();

        $link = 'https://github.com/doctrine/orm/issues/11313';
        $before = Deprecation::getTriggeredDeprecations()[$link] ?? 0;

        $driver = new AttributeDriver([dirname(__DIR__, 2).'/src/Entity']);
        $reflectionService = new RuntimeReflectionService();
        foreach ($driver->getAllClassNames() as $className) {
            $metadata = new ClassMetadata($className);
            $metadata->initializeReflection($reflectionService);
            $driver->loadMetadataForClass($className, $metadata);
        }

        $after = Deprecation::getTriggeredDeprecations()[$link] ?? 0;

        self::assertSame($before, $after, sprintf('Mapping a #[ORM\OrderBy] string direction triggers the deprecation %s; use \SortDirection::Ascending/\SortDirection::Descending instead.', $link));
    }
}
