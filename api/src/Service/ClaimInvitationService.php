<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\CampCollaborationRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;

class ClaimInvitationService {
    public function __construct(
        private readonly CampCollaborationRepository $campCollaborationRepository,
        private readonly EntityManagerInterface $em,
    ) {}

    /**
     * Convert all invitations who specifically invited this email address to
     * personal invitations, which the invited user will be able to see and
     * accept / reject in the UI, even without receiving the invitation email.
     * This is done by setting the user field instead of the inviteEmail field.
     */
    public function claimInvitations(User $user, string $email): void {
        $personalInvitationsForNewEmail = $this->campCollaborationRepository->findAllByInviteEmailAndInvited($email);

        foreach ($personalInvitationsForNewEmail as $invitation) {
            if (null !== $this->campCollaborationRepository->findOneBy([
                'user' => $user,
                'camp' => $invitation->camp,
            ])) {
                // If the user is already part of the camp, we skip claiming this invitation,
                // because it would otherwise create a unique constraint violation, or we would
                // need to merge the existing collaboration and the invitation, which would be
                // very complex for an extremely rare use case which can easily be resolved by
                // the camp leaders in the UI.
                // We could also discard the invitation in this case, but previously, when users
                // have had problems with receiving their invitation emails, we have recommended
                // them to send an invitation to another email address and claim that other
                // invitation. So this invitation could still be useful to someone. This way, we
                // also minimize shenanigans with vanishing invitations, which could be
                // confusing for the users.
                continue;
            }

            try {
                $invitation->inviteEmail = null;
                $invitation->user = $user;
                $this->em->persist($invitation);
                $this->em->flush();
            } catch (UniqueConstraintViolationException) {
                // Even though we already handle this case above, it could still happen due
                // to race conditions. Just ignore it.
                $this->em->clear();
            }
        }
    }
}
