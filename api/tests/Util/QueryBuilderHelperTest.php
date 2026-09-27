<?php

namespace App\Tests\Util;

use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use App\Entity\Day;
use App\Util\QueryBuilderHelper;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * @internal
 */
#[AllowMockObjectsWithoutExpectations]
class QueryBuilderHelperTest extends KernelTestCase {
    private EntityManagerInterface $entityManager;
    private MockObject|QueryNameGeneratorInterface $queryNameGeneratorInterfaceMock;

    protected function setUp(): void {
        static::bootKernel();

        $this->entityManager = self::getContainer()->get(EntityManagerInterface::class);
        $this->queryNameGeneratorInterfaceMock = $this->createMock(QueryNameGeneratorInterface::class);

        $this->queryNameGeneratorInterfaceMock
            ->method('generateJoinAlias')
            ->willReturnCallback(fn (string $field): string => $field.'_alias')
        ;
    }

    public function testAddMissingJoin() {
        // given
        $qb = $this->entityManager->createQueryBuilder();
        $qb->from(Day::class, 'd');

        // when
        $p = QueryBuilderHelper::findOrAddInnerRootJoinAlias($qb, $this->queryNameGeneratorInterfaceMock, 'period');

        // then
        $this->assertEquals('period_alias', $p);

        $joins = $qb->getDQLPart('join');
        $this->assertCount(1, $joins);
        $this->assertArrayHasKey('d', $joins);
        $this->assertEquals('period_alias', $joins['d'][0]->getAlias());
    }

    public function testFindExistingJoin() {
        // given
        $qb = $this->entityManager->createQueryBuilder();
        $qb->from(Day::class, 'd');
        $qb->join('d.period', 'p');

        // when
        $p = QueryBuilderHelper::findOrAddInnerRootJoinAlias($qb, $this->queryNameGeneratorInterfaceMock, 'period');

        // then
        $this->assertEquals('p', $p);

        $joins = $qb->getDQLPart('join');
        $this->assertCount(1, $joins);
        $this->assertArrayHasKey('d', $joins);
        $this->assertEquals('p', $joins['d'][0]->getAlias());
    }

    public function testAddJoinIfExistingIsNotInner() {
        // given
        $qb = $this->entityManager->createQueryBuilder();
        $qb->from(Day::class, 'd');
        $qb->leftJoin('d.period', 'p');

        // when
        $p = QueryBuilderHelper::findOrAddInnerRootJoinAlias($qb, $this->queryNameGeneratorInterfaceMock, 'period');

        // then
        $this->assertEquals('period_alias', $p);

        $joins = $qb->getDQLPart('join');
        $this->assertCount(1, $joins);
        $this->assertArrayHasKey('d', $joins);
        $this->assertCount(2, $joins['d']);
    }
}
