<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Comment;
use App\Entity\User;
use App\State\Util\AbstractPersistProcessor;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * @template-extends AbstractPersistProcessor<Comment>
 */
class CommentCreateProcessor extends AbstractPersistProcessor {
    public function __construct(ProcessorInterface $decorated, private readonly Security $security) {
        parent::__construct($decorated);
    }

    /**
     * @param Comment $data
     */
    #[\Override]
    public function onBefore($data, Operation $operation, array $uriVariables = [], array $context = []): Comment {
        /** @var User $user */
        $user = $this->security->getUser();

        // Set the user as the author of the comment
        $data->author = $user;

        return $data;
    }
}
