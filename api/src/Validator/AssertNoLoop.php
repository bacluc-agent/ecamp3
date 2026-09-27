<?php

declare(strict_types=1);

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class AssertNoLoop extends Constraint {
    public function __construct(
        public readonly string $message = 'Must not form a loop of parent-child relations.',
        ?array $groups = null,
        $payload = null
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
