<?php

declare(strict_types=1);

namespace App\Validator\ColumnLayout;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class AssertNoOrphanChildren extends Constraint {
    public function __construct(
        public readonly string $message = 'The following slots still have child contents and should be present in the columns: {{ slots }}',
        ?array $groups = null,
        $payload = null
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
