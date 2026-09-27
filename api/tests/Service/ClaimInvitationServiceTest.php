<?php

namespace App\Tests\Service;

use App\Entity\Camp;
use App\Entity\CampCollaboration;
use App\Entity\User;
use App\Repository\CampCollaborationRepository;
use App\Service\ClaimInvitationService;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * @internal
 */
#[AllowMockObjectsWithoutExpectations]
class ClaimInvitationServiceTest extends KernelTestCase {
    private CampCollaborationRepository $campCollaborationRepository;
    private EntityManagerInterface $em;
    private ClaimInvitationService $claimInvitationService;

    private User $user;
    private string $email = 'test@example.com';

    protected function setUp(): void {
        static::bootKernel();

        $this->campCollaborationRepository = $this->createMock(CampCollaborationRepository::class);
        $this->em = $this->createMock(EntityManagerInterface::class);

        $this->user = new User();

        $this->claimInvitationService = new ClaimInvitationService($this->campCollaborationRepository, $this->em);
    }

    public function testDoesNothingWhenNoInvitationPresent() {
        // given
        $this->campCollaborationRepository
            ->expects($this->once())
            ->method('findAllByInviteEmailAndInvited')
            ->with($this->email)
            ->willReturn([])
        ;

        // then
        $this->em->expects($this->never())->method('persist');
        $this->em->expects($this->never())->method('flush');

        // when
        $this->claimInvitationService->claimInvitations($this->user, $this->email);
    }

    public function testClaimsInvitation() {
        // given
        $invitation = new CampCollaboration();
        $invitation->user = null;
        $invitation->inviteEmail = 'new@example.com';
        $invitation->inviteKeyHash = 'asdfasdfasdf';
        $camp = new Camp();
        $invitation->camp = $camp;

        $this->campCollaborationRepository
            ->expects($this->once())
            ->method('findAllByInviteEmailAndInvited')
            ->with($this->email)
            ->willReturn([$invitation])
        ;

        // then
        $this->em->expects($this->once())->method('persist')->with($invitation);
        $this->em->expects($this->once())->method('flush');

        // when
        $this->claimInvitationService->claimInvitations($this->user, $this->email);

        // then
        $this->assertEquals($invitation->user, $this->user);
        $this->assertNull($invitation->inviteEmail);
        $this->assertSame('asdfasdfasdf', $invitation->inviteKeyHash);
        $this->assertEquals($invitation->camp, $camp);
    }

    public function testIgnoresInvitationWhenUserAlreadyPartOfCamp() {
        // given
        $camp = new Camp();

        $invitation = new CampCollaboration();
        $invitation->status = CampCollaboration::STATUS_INVITED;
        $invitation->user = null;
        $invitation->inviteEmail = 'new@example.com';
        $invitation->inviteKeyHash = 'asdfasdfasdf';
        $invitation->camp = $camp;

        $existingCollaboration = new CampCollaboration();
        $existingCollaboration->user = $this->user;
        $existingCollaboration->status = CampCollaboration::STATUS_ESTABLISHED;
        $existingCollaboration->camp = $camp;

        $this->campCollaborationRepository
            ->expects($this->once())
            ->method('findAllByInviteEmailAndInvited')
            ->with($this->email)
            ->willReturn([$invitation])
        ;

        $this->campCollaborationRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['user' => $this->user, 'camp' => $camp])
            ->willReturn($existingCollaboration)
        ;

        // then
        $this->em->expects($this->never())->method('persist');
        $this->em->expects($this->never())->method('flush');

        // when
        $this->claimInvitationService->claimInvitations($this->user, $this->email);

        // then
        $this->assertNull($invitation->user);
        $this->assertSame('new@example.com', $invitation->inviteEmail);
        $this->assertSame('asdfasdfasdf', $invitation->inviteKeyHash);
        $this->assertEquals($invitation->camp, $camp);
    }

    public function testIgnoresInvitationWhenUserWasPreviouslyPartOfCamp() {
        // given
        $camp = new Camp();

        $invitation = new CampCollaboration();
        $invitation->status = CampCollaboration::STATUS_INVITED;
        $invitation->user = null;
        $invitation->inviteEmail = 'new@example.com';
        $invitation->inviteKeyHash = 'asdfasdfasdf';
        $invitation->camp = $camp;

        $existingCollaboration = new CampCollaboration();
        $existingCollaboration->user = $this->user;
        $existingCollaboration->status = CampCollaboration::STATUS_INACTIVE;
        $existingCollaboration->camp = $camp;

        $this->campCollaborationRepository
            ->expects($this->once())
            ->method('findAllByInviteEmailAndInvited')
            ->with($this->email)
            ->willReturn([$invitation])
        ;

        $this->campCollaborationRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['user' => $this->user, 'camp' => $camp])
            ->willReturn($existingCollaboration)
        ;

        // then
        $this->em->expects($this->never())->method('persist');
        $this->em->expects($this->never())->method('flush');

        // when
        $this->claimInvitationService->claimInvitations($this->user, $this->email);

        // then
        $this->assertNull($invitation->user);
        $this->assertSame('new@example.com', $invitation->inviteEmail);
        $this->assertSame('asdfasdfasdf', $invitation->inviteKeyHash);
        $this->assertEquals($invitation->camp, $camp);
    }

    public function testHandlesUniqueConstraintViolationWhenUserAlreadyPartOfCamp() {
        // given
        $invitation = new CampCollaboration();
        $invitation->user = null;
        $invitation->inviteEmail = 'new@example.com';
        $invitation->inviteKeyHash = 'asdfasdfasdf';
        $camp = new Camp();
        $invitation->camp = $camp;

        $invitation2 = new CampCollaboration();
        $invitation2->user = null;
        $invitation2->inviteEmail = 'new@example.com';
        $invitation2->inviteKeyHash = 'asdfasdfasdf';
        $camp = new Camp();
        $invitation2->camp = $camp;

        $this->campCollaborationRepository
            ->expects($this->once())
            ->method('findAllByInviteEmailAndInvited')
            ->with($this->email)
            ->willReturn([$invitation, $invitation2])
        ;

        // then
        $matcher1 = $this->exactly(2);
        $this->em->expects($matcher1)
            ->method('persist')
            ->willReturnCallback(function (CampCollaboration $value) use ($matcher1, $invitation, $invitation2) {
                if (1 === $matcher1->numberOfInvocations()) {
                    $this->assertEquals($invitation, $value);
                } else {
                    $this->assertEquals($invitation2, $value);
                }
            })
        ;
        $matcher2 = $this->exactly(2);
        $this->em->expects($matcher2)
            ->method('flush')
            ->willReturnCallback(function () use ($matcher2) {
                if (1 === $matcher2->numberOfInvocations()) {
                    throw $this->createMock(UniqueConstraintViolationException::class);
                }
            })
        ;
        $this->em->expects($this->once())->method('clear');

        // when
        $this->claimInvitationService->claimInvitations($this->user, $this->email);

        // then
        $this->assertEquals($invitation2->user, $this->user);
        $this->assertNull($invitation2->inviteEmail);
        $this->assertSame('asdfasdfasdf', $invitation2->inviteKeyHash);
        $this->assertEquals($invitation2->camp, $camp);
    }
}
