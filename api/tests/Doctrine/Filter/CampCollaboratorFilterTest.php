<?php

namespace App\Tests\Doctrine\Filter;

use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\IriConverterInterface;
use App\Doctrine\Filter\CampCollaboratorFilter;
use App\Entity\ContentNode;
use App\Entity\User;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
#[AllowMockObjectsWithoutExpectations]
class CampCollaboratorFilterTest extends TestCase {
    private ManagerRegistry|MockObject $managerRegistryMock;
    private MockObject|QueryBuilder $queryBuilderMock;
    private MockObject|QueryNameGeneratorInterface $queryNameGeneratorInterfaceMock;
    private IriConverterInterface|MockObject $iriConverterMock;

    public function setUp(): void {
        parent::setUp();
        $this->managerRegistryMock = $this->createStub(ManagerRegistry::class);
        $entityManagerMock = $this->createStub(EntityManager::class);
        $this->queryBuilderMock = $this->createMock(QueryBuilder::class);
        $this->queryNameGeneratorInterfaceMock = $this->createStub(QueryNameGeneratorInterface::class);
        $this->iriConverterMock = $this->createMock(IriConverterInterface::class);

        $entityManagerMock
            ->method('createQueryBuilder')
            ->willReturn($this->queryBuilderMock)
        ;

        $this->queryBuilderMock
            ->method('select')->willReturnSelf()
        ;

        $this->queryBuilderMock
            ->method('from')->willReturnSelf()
        ;

        $this->queryBuilderMock
            ->method('join')->willReturnSelf()
        ;

        $this->queryBuilderMock
            ->method('andWhere')->willReturnSelf()
        ;

        $this->queryBuilderMock
            ->method('getRootAliases')
            ->willReturn(['o'])
        ;

        $this->queryBuilderMock
            ->method('getDQLPart')
            ->willReturn([])
        ;

        $this->queryBuilderMock
            ->method('getEntityManager')
            ->willReturn($entityManagerMock)
        ;

        $this->queryNameGeneratorInterfaceMock
            ->method('generateJoinAlias')
            ->willReturnCallback(fn (string $field): string => $field.'_j1')
        ;
    }

    public function testGetDescription() {
        // given
        $filter = new CampCollaboratorFilter($this->iriConverterMock, $this->managerRegistryMock);

        // when
        $description = $filter->getDescription('Dummy');

        // then
        $this->assertEquals([
            'campCollaborator' => [
                'property' => 'campCollaborator',
                'type' => 'string',
                'required' => false,
            ],
        ], $description);
    }

    public function testFailsForResouceClassNotImplementingBelongsToCampInterface() {
        // given
        $filter = new CampCollaboratorFilter($this->iriConverterMock, $this->managerRegistryMock);

        // then
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('CampCollaboratorFilter can only be applied to entities which implement BelongsToCampInterface (received: App\Entity\User).');

        // when
        $filter->apply($this->queryBuilderMock, $this->queryNameGeneratorInterfaceMock, User::class, null, ['filters' => [
            'campCollaborator' => '/users/123',
        ]]);
    }

    public function testDoesNothingForPropertiesOtherThanCampCollaborator() {
        // given
        $filter = new CampCollaboratorFilter($this->iriConverterMock, $this->managerRegistryMock);

        // then
        $this->queryBuilderMock
            ->expects($this->never())
            ->method('getRootAliases')
        ;

        $this->queryBuilderMock
            ->expects($this->never())
            ->method('join')
        ;

        $this->queryBuilderMock
            ->expects($this->never())
            ->method('andWhere')
        ;

        // when
        $filter->apply($this->queryBuilderMock, $this->queryNameGeneratorInterfaceMock, ContentNode::class, null, ['filters' => [
            'dummyProperty' => 'abc',
        ]]);
    }

    public function testAddsFilterForPeriodProperty() {
        // given
        $filter = new CampCollaboratorFilter($this->iriConverterMock, $this->managerRegistryMock);
        $collaborator = new User();

        // then
        $this->iriConverterMock
            ->expects($this->once())
            ->method('getResourceFromIri')
            ->with('/users/123')
            ->willReturn($collaborator)
        ;

        $this->queryBuilderMock
            ->expects($this->exactly(2))
            ->method('setParameter')
        ;

        // when
        $filter->apply($this->queryBuilderMock, $this->queryNameGeneratorInterfaceMock, ContentNode::class, null, ['filters' => [
            'campCollaborator' => '/users/123',
        ]]);
    }
}
