<?php

namespace App\Tests\Util;

use App\Entity\Camp;
use App\Entity\CampCollaboration;
use App\Entity\DayResponsible;
use App\Entity\User;
use App\Util\CamelPascalNamingStrategy;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
class CamelPascalNamingStrategyTest extends TestCase {
    #[DataProvider('getTableNameExamples')]
    public function testClassToTableName(string $className, string $output) {
        // given
        $strategy = new CamelPascalNamingStrategy();

        // when
        $result = $strategy->classToTableName($className);

        // then
        $this->assertSame($output, $result);
    }

    public static function getTableNameExamples(): \Iterator {
        yield ['', ''];

        yield [User::class, 'user'];

        yield [CampCollaboration::class, 'camp_collaboration'];

        yield ['CampCollaboration', 'camp_collaboration'];
    }

    #[DataProvider('getPropertyExamples')]
    public function testPropertyToColumnName(string $input, string $output) {
        // given
        $strategy = new CamelPascalNamingStrategy();

        // when
        $result = $strategy->propertyToColumnName($input, '');

        // then
        $this->assertSame($output, $result);
    }

    public static function getPropertyExamples(): \Iterator {
        yield ['', ''];

        yield ['camp', 'camp'];

        yield ['campCollaboration', 'campCollaboration'];
    }

    #[DataProvider('getEmbeddedFieldExamples')]
    public function testEmbeddedFieldToColumnName(string $propertyName, string $embeddedColumnName, string $output) {
        // given
        $strategy = new CamelPascalNamingStrategy();

        // when
        $result = $strategy->embeddedFieldToColumnName($propertyName, $embeddedColumnName);

        // then
        $this->assertSame($output, $result);
    }

    public static function getEmbeddedFieldExamples(): \Iterator {
        yield ['', '', ''];

        yield ['address', 'street', 'addressStreet'];
    }

    #[DataProvider('getJoinColumnExamples')]
    public function testJoinColumnName(string $propertyName, string $output) {
        // given
        $strategy = new CamelPascalNamingStrategy();

        // when
        $result = $strategy->joinColumnName($propertyName);

        // then
        $this->assertSame($output, $result);
    }

    public static function getJoinColumnExamples(): \Iterator {
        yield ['', 'Id'];

        yield ['camp', 'campId'];

        yield ['campCollaboration', 'campCollaborationId'];
    }

    #[DataProvider('getJoinKeyColumnExamples')]
    public function testJoinKeyColumnName(string $entityName, ?string $referencedColumnName, string $output) {
        // given
        $strategy = new CamelPascalNamingStrategy();

        // when
        $result = $strategy->joinKeyColumnName($entityName, $referencedColumnName);

        // then
        $this->assertSame($output, $result);
    }

    public static function getJoinKeyColumnExamples(): \Iterator {
        yield ['', null, 'Id'];

        yield ['', 'email', 'Email'];

        yield [Camp::class, null, 'campId'];

        yield [CampCollaboration::class, null, 'campCollaborationId'];

        yield [User::class, 'name', 'userName'];

        yield [DayResponsible::class, 'name', 'dayResponsibleName'];
    }
}
