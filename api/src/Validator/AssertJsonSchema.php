<?php

declare(strict_types=1);

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class AssertJsonSchema extends Constraint {
    public function __construct(
        public readonly string $message = "Provided JSON doesn't match required schema ({{ schemaError }}).",
        public readonly array $schema = [
            'type' => 'object',
        ],
        ?array $groups = null,
        $payload = null
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
