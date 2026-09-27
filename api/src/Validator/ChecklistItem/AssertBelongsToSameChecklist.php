<?php

declare(strict_types=1);

namespace App\Validator\ChecklistItem;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class AssertBelongsToSameChecklist extends Constraint {
    public function __construct(
        public readonly string $message = 'Must belong to the same checklist.',
        ?array $groups = null,
        $payload = null
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
