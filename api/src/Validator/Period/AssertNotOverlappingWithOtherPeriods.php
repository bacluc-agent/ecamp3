<?php

declare(strict_types=1);

namespace App\Validator\Period;

use Symfony\Component\Validator\Constraint;

#[\Attribute(\Attribute::TARGET_PROPERTY)]
class AssertNotOverlappingWithOtherPeriods extends Constraint {
    public const DEFAULT_MESSAGE = 'Periods must not overlap.';

    public function __construct(
        public readonly string $message = self::DEFAULT_MESSAGE,
        ?array $groups = null,
        $payload = null
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
