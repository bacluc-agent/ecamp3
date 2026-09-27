<?php

namespace App\Tests\Doctrine\Filter;

use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\IriConverterInterface;
use App\Doctrine\Filter\MaterialItemPeriodFilter;
use App\Entity\MaterialItem;
use App\Entity\Period;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\EntityRepository;
use Doctrine\ORM\Query\Expr;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
#[AllowMockObjectsWithoutExpectations]
class MaterialItemPeriodFilterTest extends TestCase {
    private ManagerRegistry|MockObject $managerRegistryMock;
    private MockObject|QueryBuilder $queryBuilderMock;
    private MockObject|QueryNameGeneratorInterface $queryNameGeneratorInterfaceMock;
    private IriConverterInterface|MockObject $iriConverterMock;

    public function setUp(): void {
        parent::setUp();
        $this->managerRegistryMock = $this->createStub(ManagerRegistry::class);
        $materialNodeRepositoryMock = $this->createStub(EntityRepository::class);
        $materialNodeQueryBuilderMock = $this->createStub(QueryBuilder::class);
        $this->queryBuilderMock = $this->createMock(QueryBuilder::class);
        $entityManagerMock = $this->createStub(EntityManager::class);
        $this->queryNameGeneratorInterfaceMock = $this->createStub(QueryNameGeneratorInterface::class);
        $this->iriConverterMock = $this->createMock(IriConverterInterface::class);

        $this->managerRegistryMock
            ->method('getRepository')
            ->willReturn($materialNodeRepositoryMock)
        ;

        $materialNodeRepositoryMock
            ->method('createQueryBuilder')
            ->willReturn($materialNodeQueryBuilderMock)
        ;

        $materialNodeQueryBuilderMock
            ->method('select')->willReturnSelf()
        ;

        $materialNodeQueryBuilderMock
            ->method('join')->willReturnSelf()
        ;

        $materialNodeQueryBuilderMock
            ->method('where')->willReturnSelf()
        ;

        $this->queryBuilderMock
            ->method('from')->willReturnSelf()
        ;

        $this->queryBuilderMock
            ->method('join')->willReturnSelf()
        ;

        $this->queryBuilderMock
            ->method('where')->willReturnSelf()
        ;

        $this->queryBuilderMock
            ->method('getRootAliases')
            ->willReturn(['o'])
        ;

        $this->queryBuilderMock
            ->method('getEntityManager')
            ->willReturn($entityManagerMock)
        ;

        $this->queryBuilderMock
            ->method('getParameters')
            ->willReturn(new ArrayCollection())
        ;

        $expr = new Expr();
        $this->queryBuilderMock
            ->method('expr')
            ->willReturn($expr)
        ;

        $entityManagerMock
            ->method('createQueryBuilder')
            ->willReturn($this->queryBuilderMock)
        ;

        $this->queryNameGeneratorInterfaceMock
            ->method('generateParameterName')
            ->willReturnCallback(fn (string $field): string => $field.'_a1')
        ;
        $this->queryNameGeneratorInterfaceMock
            ->method('generateJoinAlias')
            ->willReturnCallback(fn (string $field): string => $field.'_j1')
        ;
    }

    public function testGetDescription() {
        // given
        $filter = new MaterialItemPeriodFilter($this->iriConverterMock, $this->managerRegistryMock);

        // when
        $description = $filter->getDescription('Dummy');

        // then
        $this->assertEquals([
            'period' => [
                'property' => 'period',
                'type' => 'string',
                'required' => false,
            ],
        ], $description);
    }

    public function testFailsForResouceClassOtherThanMaterialItem() {
        // given
        $filter = new MaterialItemPeriodFilter($this->iriConverterMock, $this->managerRegistryMock);

        // then
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('MaterialItemPeriodFilter can only be applied to entities of type MaterialItem (received: DummyClass).');

        // when
        $filter->apply($this->queryBuilderMock, $this->queryNameGeneratorInterfaceMock, 'DummyClass', null, ['filters' => [
            'period' => '/period/123',
        ]]);
    }

    public function testDoesNothingForPropertiesOtherThanPeriod() {
        // given
        $filter = new MaterialItemPeriodFilter($this->iriConverterMock, $this->managerRegistryMock);

        // then
        $this->queryBuilderMock
            ->expects($this->never())
            ->method('getRootAliases')
        ;

        $this->queryBuilderMock
            ->expects($this->never())
            ->method('andWhere')
        ;

        // when
        $filter->apply($this->queryBuilderMock, $this->queryNameGeneratorInterfaceMock, MaterialItem::class, null, ['filters' => [
            'dummyProperty' => 'abc',
        ]]);
    }

    public function testAddsFilterForPeriodProperty() {
        // given
        $filter = new MaterialItemPeriodFilter($this->iriConverterMock, $this->managerRegistryMock);
        $period = new Period();

        // then
        $this->iriConverterMock
            ->expects($this->once())
            ->method('getResourceFromIri')
            ->with('/period/123')
            ->willReturn($period)
        ;

        $this->queryBuilderMock
            ->expects($this->once())
            ->method('andWhere')
        ;

        $this->queryBuilderMock
            ->expects($this->once())
            ->method('setParameter')
            ->with('period_a1', $period)
        ;

        // when
        $filter->apply($this->queryBuilderMock, $this->queryNameGeneratorInterfaceMock, MaterialItem::class, null, ['filters' => [
            'period' => '/period/123',
        ]]);
    }
}
