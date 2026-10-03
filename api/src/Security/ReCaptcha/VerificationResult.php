<?php

namespace App\Security\ReCaptcha;

readonly class VerificationResult {
    public function __construct(private bool $success) {}

    public function isSuccess(): bool {
        return $this->success;
    }
}
