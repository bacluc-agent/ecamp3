<?php

declare(strict_types=1);

namespace App\Validator\ColumnLayout;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class AssertColumWidthsSumTo12 extends Constraint {
    public function __construct(
        public readonly string $message = 'Expected column widths to sum to 12, but got a sum of {{ sum }}',
        ?array $groups = null,
        $payload = null
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
