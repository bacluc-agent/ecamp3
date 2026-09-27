<?php

declare(strict_types=1);

namespace App\InputFilter;

class InvalidOptionsException extends \RuntimeException {
    public function __construct(string $message, private readonly array $options) {
        parent::__construct($message);
    }

    public function getOptions() {
        return $this->options;
    }
}
