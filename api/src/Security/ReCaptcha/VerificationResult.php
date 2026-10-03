<?php

namespace App\Security\ReCaptcha;

class VerificationResult {
    public function __construct(private readonly bool $success) {}

    public function isSuccess(): bool {
        return $this->success;
    }
}
