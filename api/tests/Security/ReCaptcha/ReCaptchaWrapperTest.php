<?php

namespace App\Tests\Security\ReCaptcha;

use App\Security\ReCaptcha\ReCaptchaWrapper;
use App\Security\ReCaptcha\VerificationResult;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use ReCaptcha\ReCaptcha;
use ReCaptcha\RequestMethod;

/**
 * @internal
 */
class ReCaptchaWrapperTest extends TestCase {
    private MockObject $requestMethod;
    private MockObject $logger;
    private ReCaptchaWrapper $wrapper;

    protected function setUp(): void {
        $this->requestMethod = $this->createMock(RequestMethod::class);
        $this->logger = $this->createMock(LoggerInterface::class);
        $this->wrapper = $this->wrapperFor('test-secret');
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testVerifyReturnsSuccessForLoginAction() {
        $this->requestMethod->expects(self::once())
            ->method('submit')
            ->willReturn('{"success":true,"action":"login"}')
        ;
        $this->logger->expects(self::never())->method('warning');

        $result = $this->wrapper->verify('tok');

        self::assertInstanceOf(VerificationResult::class, $result);
        self::assertTrue($result->isSuccess());
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testVerifyFailsWhenActionDoesNotMatch() {
        $this->requestMethod->expects(self::once())
            ->method('submit')
            ->willReturn('{"success":true,"action":"other"}')
        ;
        $this->logger->expects(self::once())
            ->method('warning')
            ->with(
                'ReCaptcha verification failed',
                $this->callback(fn (array $ctx) => in_array('action-mismatch', $ctx['error-codes'] ?? [], true))
            )
        ;

        $result = $this->wrapper->verify('tok');

        self::assertInstanceOf(VerificationResult::class, $result);
        self::assertFalse($result->isSuccess());
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testVerifyPassesThroughErrorCodes() {
        $this->requestMethod->expects(self::once())
            ->method('submit')
            ->willReturn('{"success":false,"error-codes":["bad-response"]}')
        ;
        $this->logger->expects(self::once())
            ->method('warning')
            ->with(
                'ReCaptcha verification failed',
                $this->callback(fn (array $ctx) => in_array('bad-response', $ctx['error-codes'] ?? [], true))
            )
        ;

        $result = $this->wrapper->verify('tok');

        self::assertInstanceOf(VerificationResult::class, $result);
        self::assertFalse($result->isSuccess());
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testEmptyTokenFailsWithoutTransportCall() {
        $this->requestMethod->expects(self::never())->method('submit');
        $this->logger->expects(self::once())
            ->method('warning')
            ->with(
                'ReCaptcha verification failed',
                $this->callback(fn (array $ctx) => in_array('missing-input-response', $ctx['error-codes'] ?? [], true))
            )
        ;

        $result = $this->wrapper->verify('');

        self::assertInstanceOf(VerificationResult::class, $result);
        self::assertFalse($result->isSuccess());
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testNullTokenFailsGracefullyInsteadOfThrowing() {
        $this->requestMethod->expects(self::never())->method('submit');
        $this->logger->expects(self::once())
            ->method('warning')
            ->with(
                'ReCaptcha verification failed',
                $this->callback(fn (array $ctx) => in_array('missing-input-response', $ctx['error-codes'] ?? [], true))
            )
        ;

        $result = $this->wrapper->verify(null);

        self::assertInstanceOf(VerificationResult::class, $result);
        self::assertFalse($result->isSuccess());
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testDisabledSecretBypassesLibrary() {
        $this->requestMethod->expects(self::never())->method('submit');
        $this->logger->expects(self::never())->method('warning');

        $result = $this->wrapperFor('disabled')->verify('tok');

        self::assertInstanceOf(VerificationResult::class, $result);
        self::assertTrue($result->isSuccess());
    }

    private function wrapperFor(string $secret): ReCaptchaWrapper {
        return new ReCaptchaWrapper($secret, new ReCaptcha('test-secret', $this->requestMethod), $this->logger);
    }
}
