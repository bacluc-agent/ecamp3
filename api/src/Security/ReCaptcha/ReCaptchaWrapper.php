<?php

namespace App\Security\ReCaptcha;

use Psr\Log\LoggerInterface;
use ReCaptcha\ReCaptcha;
use ReCaptcha\Response;

class ReCaptchaWrapper {
    private const ACTION = 'login';

    public function __construct(
        private readonly string $reCaptchaSecret,
        private readonly ReCaptcha $reCaptcha,
        private readonly LoggerInterface $logger,
    ) {}

    public function verify($response, $remoteIp = null) {
        if ('disabled' != strtolower($this->reCaptchaSecret)) {
            $resp = $this->reCaptcha->withExpectedAction(self::ACTION)->verify((string) $response, $remoteIp);
            if (!$resp->isSuccess()) {
                $this->logger->warning('ReCaptcha verification failed', ['error-codes' => $resp->getErrorCodes()]);
            }

            return $resp;
        }

        // if no reCaptchaSecret (dev & test) -> auto-success
        return new Response(true);
    }
}
