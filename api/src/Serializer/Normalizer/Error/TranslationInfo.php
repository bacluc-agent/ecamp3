<?php

declare(strict_types=1);

namespace App\Serializer\Normalizer\Error;

class TranslationInfo {
    public function __construct(public readonly string $key, public readonly array $parameters) {}
}
