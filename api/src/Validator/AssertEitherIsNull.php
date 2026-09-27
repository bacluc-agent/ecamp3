<?php

declare(strict_types=1);

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class AssertEitherIsNull extends Constraint {
    public function __construct(
        public readonly string $other,
        public readonly string $messageBothNull = 'Either this value or {{ other }} should not be null.',
        public readonly string $messageNoneNull = 'Either this value or {{ other }} should be null.',
        ?array $groups = null,
        $payload = null
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
