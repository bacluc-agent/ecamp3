<?php

declare(strict_types=1);

namespace App\Validator\ContentNode;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class AssertAttachedToRoot extends Constraint {
    public function __construct(
        public readonly string $message = 'Must be attached to the root layout.',
        ?array $groups = null,
        $payload = null
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
