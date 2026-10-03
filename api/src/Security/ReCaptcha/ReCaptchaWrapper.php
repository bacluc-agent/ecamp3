<?php

namespace App\Security\ReCaptcha;

use Psr\Log\LoggerInterface;
use ReCaptcha\ReCaptcha;

class ReCaptchaWrapper {
    public function __construct(
        private readonly string $reCaptchaSecret,
        private readonly ReCaptcha $reCaptcha,
        private readonly LoggerInterface $logger,
    ) {}

    public function verify($response, string $action, $remoteIp = null): VerificationResult {
        if ('disabled' != strtolower($this->reCaptchaSecret)) {
            $resp = $this->reCaptcha->withExpectedAction($action)->verify((string) $response, $remoteIp);
            $success = $resp->isSuccess();
            if (!$success) {
                $this->logger->warning('ReCaptcha verification failed', ['error-codes' => $resp->getErrorCodes()]);
            }

            return new VerificationResult($success);
        }

        // if no reCaptchaSecret (dev & test) -> auto-success
        return new VerificationResult(true);
    }
}
