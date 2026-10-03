<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Patch;
use App\DTO\ResetPassword;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\ReCaptcha\ReCaptchaWrapper;
use App\State\ResetPasswordUpdateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use ReCaptcha\Response;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactory;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;

/**
 * @internal
 */
class ResetPasswordUpdateProcessorTest extends TestCase {
    public const EMAIL = 'a@b.com';
    public const EMAILBASE64 = 'YUBiLmNvbQ==';

    private ResetPassword $resetPassword;
    private MockObject|Response $recaptchaResponse;
    private MockObject|UserRepository $userRepository;
    private MockObject|PasswordHasherInterface $pwHasher;

    private ResetPasswordUpdateProcessor $processor;

    /**
     * @throws \ReflectionException
     */
    protected function setUp(): void {
        $this->resetPassword = new ResetPassword();

        $this->recaptchaResponse = $this->createMock(Response::class);
        $recaptcha = $this->createMock(ReCaptchaWrapper::class);
        $entityManager = $this->createStub(EntityManagerInterface::class);
        $this->userRepository = $this->createMock(UserRepository::class);
        $pwHasherFactory = $this->createMock(PasswordHasherFactory::class);
        $this->pwHasher = $this->createMock(PasswordHasherInterface::class);

        $recaptcha->method('verify')->willReturn($this->recaptchaResponse);
        $pwHasherFactory->method('getPasswordHasher')->willReturn($this->pwHasher);

        $this->processor = new ResetPasswordUpdateProcessor(
            $recaptcha,
            $entityManager,
            $this->userRepository,
            $pwHasherFactory
        );
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testUpdateRequiresReCaptcha() {
        $this->recaptchaResponse->expects(self::once())
            ->method('isSuccess')
            ->willReturn(false)
        ;
        $this->resetPassword->recaptchaToken = 'token';

        $this->expectException(\Exception::class);
        $this->processor->process($this->resetPassword, new Patch());
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testUpdateWithUnknownEmailThrowsException() {
        $this->recaptchaResponse->expects(self::once())
            ->method('isSuccess')
            ->willReturn(true)
        ;
        $this->userRepository->expects(self::once())
            ->method('loadUserByIdentifier')
            ->willReturn(null)
        ;

        $this->resetPassword->id = base64_encode(self::EMAIL.'#');
        $this->resetPassword->recaptchaToken = 'token';

        $this->expectException(\Exception::class);
        $this->processor->process($this->resetPassword, new Patch());
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testUpdateWithUserHasNoResetKeyThrowsException() {
        $this->recaptchaResponse->expects(self::once())
            ->method('isSuccess')
            ->willReturn(true)
        ;
        $user = new User();
        $this->userRepository->expects(self::once())
            ->method('loadUserByIdentifier')
            ->with(self::EMAIL)
            ->willReturn($user)
        ;

        $this->resetPassword->id = base64_encode(self::EMAIL.'#');
        $this->resetPassword->recaptchaToken = 'token';

        $this->expectException(\Exception::class);
        $this->processor->process($this->resetPassword, new Patch());
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testUpdateWithWrongResetKeyThrowsException() {
        $this->recaptchaResponse->expects(self::once())
            ->method('isSuccess')
            ->willReturn(true)
        ;
        $user = new User();
        $user->passwordResetKeyHash = 'resetKey';

        $this->userRepository->expects(self::once())
            ->method('loadUserByIdentifier')
            ->with(self::EMAIL)
            ->willReturn($user)
        ;
        $this->pwHasher->expects(self::once())
            ->method('verify')
            ->willReturn(false)
        ;

        $this->resetPassword->id = base64_encode(self::EMAIL.'#myKey');
        $this->resetPassword->recaptchaToken = 'token';

        $this->expectException(\Exception::class);
        $this->processor->process($this->resetPassword, new Patch());
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testUpdateWithCorrectResetKey() {
        $this->recaptchaResponse->expects(self::once())
            ->method('isSuccess')
            ->willReturn(true)
        ;
        $user = new User();
        $user->passwordResetKeyHash = 'resetKey';
        $user->state = User::STATE_REGISTERED;

        $this->userRepository->expects(self::once())
            ->method('loadUserByIdentifier')
            ->with(self::EMAIL)
            ->willReturn($user)
        ;
        $this->pwHasher->expects(self::once())
            ->method('verify')
            ->willReturn(true)
        ;
        $this->pwHasher->expects(self::once())
            ->method('hash')
            ->willReturnCallback(md5(...))
        ;

        $this->resetPassword->id = base64_encode(self::EMAIL.'#myKey');
        $this->resetPassword->recaptchaToken = 'token';
        $this->resetPassword->password = 'newPassword';

        $this->processor->process($this->resetPassword, new Patch());

        self::assertThat($user->password, self::equalTo(md5('newPassword')));
        self::assertThat($user->passwordResetKeyHash, self::isEmpty());
        self::assertThat($user->state, self::equalTo(User::STATE_ACTIVATED));
    }

    #[AllowMockObjectsWithoutExpectations]
    #[TestWith([User::STATE_DELETED])]
    #[TestWith([User::STATE_ACTIVATED])]
    public function testUpdateWithCorrectResetKeyDoesNotChangeActivatedOrDeletedUsers(string $state) {
        $this->recaptchaResponse->expects(self::once())
            ->method('isSuccess')
            ->willReturn(true)
        ;
        $user = new User();
        $user->passwordResetKeyHash = 'resetKey';
        $user->state = $state;

        $this->userRepository->expects(self::once())
            ->method('loadUserByIdentifier')
            ->with(self::EMAIL)
            ->willReturn($user)
        ;
        $this->pwHasher->expects(self::once())
            ->method('verify')
            ->willReturn(true)
        ;
        $this->pwHasher->expects(self::once())
            ->method('hash')
            ->willReturnCallback(md5(...))
        ;

        $this->resetPassword->id = base64_encode(self::EMAIL.'#myKey');
        $this->resetPassword->recaptchaToken = 'token';
        $this->resetPassword->password = 'newPassword';

        $this->processor->process($this->resetPassword, new Patch());

        self::assertThat($user->password, self::equalTo(md5('newPassword')));
        self::assertThat($user->passwordResetKeyHash, self::isEmpty());
        self::assertThat($user->state, self::equalTo($state));
    }
}
