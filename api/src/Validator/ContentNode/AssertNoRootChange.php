<?php

declare(strict_types=1);

namespace App\Validator\ContentNode;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class AssertNoRootChange extends Constraint {
    public function __construct(
        public readonly string $message = 'Must belong to the same root.',
        ?array $groups = null,
        $payload = null
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
