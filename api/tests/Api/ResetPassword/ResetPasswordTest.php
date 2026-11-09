<?php

namespace App\Tests\Api\ResetPassword;

use App\Entity\User;
use App\Security\ReCaptcha\ReCaptchaWrapper;
use App\Tests\Api\ECampApiTestCase;
use Psr\Log\LoggerInterface;
use ReCaptcha\ReCaptcha;
use ReCaptcha\RequestMethod;
use Symfony\Contracts\HttpClient\Exception\ClientExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\RedirectionExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\ServerExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;

/**
 * @internal
 */
class ResetPasswordTest extends ECampApiTestCase {
    public function testPostResetPasswordWithoutRecaptchaTokenReturns422() {
        static::getContainer()->set(ReCaptchaWrapper::class, new ReCaptchaWrapper(
            'test-secret',
            new ReCaptcha('test-secret', $this->createStub(RequestMethod::class)),
            $this->createStub(LoggerInterface::class),
        ));

        $this->createBasicClient()->request('POST', '/auth/reset_password', ['json' => []]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testPostResetPasswordResetsPasswordForAnonymousUser() {
        /** @var User $user */
        $user = static::getFixture('user1manager');

        $this->createBasicClient()->request(
            'POST',
            '/auth/reset_password',
            [
                'json' => [
                    'email' => $user->getEmail(),
                ],
            ]
        );

        $this->assertResponseStatusCodeSame(204);
        self::assertEmailCount(1);
        $mailerMessage = self::getMailerMessage();
        self::assertEmailAddressContains($mailerMessage, 'To', $user->getEmail());
        self::assertEmailHeaderSame($mailerMessage, 'subject', '[eCamp v3] Password reset');

        self::assertEmailHtmlBodyContains($mailerMessage, $user->getDisplayName());
        self::assertEmailHtmlBodyContains($mailerMessage, 'http://localhost:3000/reset-password/');
    }

    /**
     * @throws TransportExceptionInterface
     * @throws ServerExceptionInterface
     * @throws RedirectionExceptionInterface
     * @throws ClientExceptionInterface
     */
    public function testPostResetPasswordResetsPasswordForUserLoggedInWithThisEmail() {
        /** @var User $user */
        $user = static::getFixture('user1manager');

        $this->createClientWithCredentials(['email' => $user->getEmail()])
            ->request(
                'POST',
                '/auth/reset_password',
                [
                    'json' => [
                        'email' => $user->getEmail(),
                    ],
                ]
            )
        ;

        $this->assertResponseStatusCodeSame(204);
        self::assertEmailCount(1);
    }

    /**
     * @throws TransportExceptionInterface
     * @throws ServerExceptionInterface
     * @throws RedirectionExceptionInterface
     * @throws ClientExceptionInterface
     */
    public function testPostResetPasswordResetsPasswordForUserLoggedInWithAnotherEmail() {
        /** @var User $user */
        $user = static::getFixture('user1manager');

        $this->createClientWithCredentials(['email' => static::$fixtures['user2member']->getEmail()])
            ->request(
                'POST',
                '/auth/reset_password',
                [
                    'json' => [
                        'email' => $user->getEmail(),
                    ],
                ]
            )
        ;

        $this->assertResponseStatusCodeSame(204);
        self::assertEmailCount(1);
    }

    public function testPostResetPasswordTrimsEmail() {
        /** @var User $user */
        $user = static::getFixture('user1manager');

        $this->createBasicClient()->request(
            'POST',
            '/auth/reset_password',
            [
                'json' => [
                    'email' => " {$user->getEmail()}\t ",
                ],
            ]
        );

        $this->assertResponseStatusCodeSame(204);
        self::assertEmailCount(1);
    }

    public function testPostResetPasswordReturns204ForUnknownEmailButSendsNoEmails() {
        $this->createBasicClient()->request(
            'POST',
            '/auth/reset_password',
            [
                'json' => [
                    'email' => 'a@b.com',
                ],
            ]
        );

        $this->assertResponseStatusCodeSame(204);
        self::assertEmailCount(0);
    }
}
