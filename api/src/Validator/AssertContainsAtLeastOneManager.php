<?php

declare(strict_types=1);

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class AssertContainsAtLeastOneManager extends Constraint {
    public function __construct(
        public readonly string $message = 'must have at least one manager.',
        ?array $groups = null,
        $payload = null
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
