<?php

declare(strict_types=1);

namespace App\Validator\ContentNode;

use Symfony\Component\Validator\Constraint;

#[\Attribute]
class AssertContentTypeCompatible extends Constraint {
    public function __construct(
        public readonly string $message = 'Selected contentType {{ contentTypeName }} is incompatible with entity of type {{ givenEntityClass }} (it can only be used with entities of type {{ expectedEntityClass }}).',
        ?array $groups = null,
        $payload = null
    ) {
        parent::__construct(null, $groups, $payload);
    }
}
