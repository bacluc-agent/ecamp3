<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Patch;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use App\Service\ClaimInvitationService;
use App\State\UserActivateProcessor;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
class UserActivateProcessorTest extends TestCase {
    private UserActivateProcessor $processor;
    private User $user;

    /**
     * @throws \ReflectionException
     */
    protected function setUp(): void {
        $this->user = new User();

        $decoratedProcessor = $this->createStub(ProcessorInterface::class);
        $this->processor = new UserActivateProcessor(
            $decoratedProcessor,
            $this->createStub(ClaimInvitationService::class),
        );
    }

    public function testThrowsIfActivationKeyIsWrongForOnActivate() {
        $this->user->activationKey = 'activation key';
        $this->user->activationKeyHash = 'wrong hash';

        $this->expectException(\Exception::class);
        $this->processor->onBefore($this->user, new Patch());
    }

    /**
     * @throws \Exception
     */
    public function testActivatesUserIfActivationKeyIsCorrect() {
        $this->user->activationKey = 'activation key';
        $this->user->activationKeyHash = md5($this->user->activationKey);

        $activatedUser = $this->processor->onBefore($this->user, new Patch());
        self::assertThat($activatedUser->state, self::equalTo(User::STATE_ACTIVATED));
        self::assertThat($activatedUser->activationKeyHash, self::isNull());
        self::assertThat($activatedUser->activationKey, self::isNull());
    }
}
