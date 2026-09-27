<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Patch;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Profile;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\ClaimInvitationService;
use App\Service\MailService;
use App\State\ProfileUpdateProcessor;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactoryInterface;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;

/**
 * @internal
 */
class ProfileUpdateProcessorTest extends TestCase {
    private ProfileUpdateProcessor $processor;
    private MockObject|PasswordHasherInterface $pwHasher;
    private MailService|MockObject $mailService;
    private Profile $profile;

    /**
     * @throws \ReflectionException
     */
    protected function setUp(): void {
        $this->profile = new Profile();
        $this->profile->user = new User();

        $pwHasherFactory = $this->createMock(PasswordHasherFactoryInterface::class);
        $this->pwHasher = $this->createMock(PasswordHasherInterface::class);
        $this->mailService = $this->createMock(MailService::class);
        $decoratedProcessor = $this->createStub(ProcessorInterface::class);

        $pwHasherFactory->method('getPasswordHasher')->willReturn($this->pwHasher);

        $this->processor = new ProfileUpdateProcessor(
            $decoratedProcessor,
            $pwHasherFactory,
            $this->mailService,
            $this->createStub(Security::class),
            $this->createStub(UserRepository::class),
            $this->createStub(ClaimInvitationService::class),
        );
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testSetNewEmail() {
        // given
        $this->pwHasher->expects(self::once())
            ->method('hash')
            ->willReturnCallback(md5(...))
        ;
        $this->profile->newEmail = 'new@mail.com';

        // when
        $this->processor->onBefore($this->profile, new Patch());

        // then
        $this->assertSame('new@mail.com', $this->profile->untrustedEmail);
        $this->assertNotNull($this->profile->untrustedEmailKey);
        $this->assertNotNull($this->profile->untrustedEmailKeyHash);
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testSendVerificationMail() {
        // given
        $this->profile->untrustedEmailKey = 'abc';
        $this->mailService->expects($this->once())->method('sendEmailVerificationMail');

        // when
        $this->processor->onAfter($this->profile, new Patch());

        // then
        $this->assertNull($this->profile->untrustedEmailKey);
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testChangeEmail() {
        // given
        $this->pwHasher->expects(self::once())
            ->method('verify')
            ->willReturn(true)
        ;
        $this->profile->email = 'old@mail.com';
        $this->profile->untrustedEmail = 'new@mail.com';
        $this->profile->untrustedEmailKey = 'abc';
        $this->profile->untrustedEmailKeyHash = 'abc';

        // when
        $this->processor->onBefore($this->profile, new Patch());

        // then
        $this->assertSame('new@mail.com', $this->profile->email);
        $this->assertNull($this->profile->untrustedEmail);
        $this->assertNull($this->profile->untrustedEmailKey);
        $this->assertNull($this->profile->untrustedEmailKeyHash);
    }
}
