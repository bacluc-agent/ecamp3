<?php

namespace App\Security\ReCaptcha;

use ReCaptcha\ReCaptcha;
use ReCaptcha\Response;

class ReCaptchaWrapper {
    public function __construct(
        private readonly string $reCaptchaSecret,
        private readonly ReCaptcha $reCaptcha,
    ) {}

    public function verify($response, $remoteIp = null) {
        if ('disabled' != strtolower($this->reCaptchaSecret)) {
            return $this->reCaptcha->verify($response, $remoteIp);
        }

        // if no reCaptchaSecret (dev & test) -> auto-success
        return new Response(true);
    }
}
