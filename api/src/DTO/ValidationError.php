<?php

declare(strict_types=1);

namespace App\DTO;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\State\ApiResource\Error;

class ValidationError extends Error {
    public function __construct(
        private readonly ?string $title,
        private readonly int $status,
        private readonly ?string $detail,
        private readonly ?string $instance,
        private readonly array $violations = [],
        private readonly string $type = 'about:blank',
    ) {
        parent::__construct(
            title: $this->title,
            detail: $this->detail,
            status: $this->status,
            instance: $this->instance,
            type: $this->type,
        );
    }

    #[ApiProperty]
    public function getViolations(): array {
        return $this->violations;
    }
}
