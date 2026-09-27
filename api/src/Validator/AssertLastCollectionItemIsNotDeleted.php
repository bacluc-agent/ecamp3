<?php

declare(strict_types=1);

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class AssertLastCollectionItemIsNotDeleted extends Constraint {
    public const IS_EMPTY_ERROR = 'IS_EMPTY_ERROR';

    public function __construct(
        public readonly string $message = 'Cannot delete the last entry.',
        ?array $groups = null,
        mixed $payload = null
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
