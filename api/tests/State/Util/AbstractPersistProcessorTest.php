<?php

namespace App\Tests\State\Util;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\BaseEntity;
use App\State\Util\AbstractPersistProcessor;
use App\State\Util\PropertyChangeListener;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
class AbstractPersistProcessorTest extends TestCase {
    private MockObject|ProcessorInterface $decoratedProcessor;
    private MockableClosure|MockObject $closure;
    private PropertyChangeListener $propertyChangeListener;
    private AbstractPersistProcessor|MockObject $processor;
    private MockableClosure|MockObject $onBefore;
    private MockableClosure|MockObject $onAfter;

    /**
     * @throws WarningException
     * @throws Exception
     * @throws \ReflectionException
     */
    protected function setUp(): void {
        $this->decoratedProcessor = $this->createMock(ProcessorInterface::class);
        $this->decoratedProcessor->method('process')->willReturnArgument(0);

        $this->closure = $this->createMock(MockableClosure::class);

        $this->propertyChangeListener = PropertyChangeListener::of(
            extractProperty: fn ($data) => $data->name,
            beforeAction: $this->closure->call(...),
            afterAction: $this->closure->call(...),
        );

        $this->onBefore = $this->createMock(MockableClosure::class);
        $this->onBefore->method('call')->willReturnArgument(0);

        $this->onAfter = $this->createMock(MockableClosure::class);
        $this->onAfter->method('call');

        $this->processor = new MyEntityPersistProcessor(
            decorated: $this->decoratedProcessor,
            propertyChangeListeners: [$this->propertyChangeListener],
            onBefore: $this->onBefore,
            onAfter: $this->onAfter,
        );

        set_error_handler(
            /**
             * @throws WarningException
             */
            static function (int $errno, string $errstr): never {
                throw new WarningException();
            },
            E_WARNING
        );
    }

    protected function tearDown(): void {
        restore_error_handler();
    }

    /**
     * @throws Exception
     */
    #[AllowMockObjectsWithoutExpectations]
    public function testThrowsIfOnePropertyChangeListenerIsOfWrongType() {
        $this->expectException(\InvalidArgumentException::class);

        new MyEntityPersistProcessor($this->createStub(ProcessorInterface::class), [$this->propertyChangeListener, new \stdClass()], $this->onBefore, $this->onAfter);
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testCallsOnBeforeCreateAndOnAfterCreateOnPost() {
        $toPersist = new MyEntity();

        $this->onBefore->expects(self::once())->method('call')->willReturnArgument(0);
        $this->onAfter->expects(self::once())->method('call');
        $this->decoratedProcessor->expects(self::once())->method('process')->willReturnArgument(0);

        $processResult = $this->processor->process($toPersist, new Post());
        self::assertThat($processResult, self::equalTo($toPersist));
    }

    /**
     * @throws \ReflectionException
     */
    #[AllowMockObjectsWithoutExpectations]
    public function testNotCallPropertyChangeListenerIfDataWasNullBefore() {
        $toPersist = new MyEntity();

        $context = ['previous_data' => null];
        $this->propertyChangeListener = PropertyChangeListener::of(
            extractProperty: fn ($data) => $data->name,
            beforeAction: $this->closure->call(...),
            afterAction: $this->closure->call(...),
        );
        $this->closure->expects(self::never())->method('call');

        $this->processor->process($toPersist, new Patch(), [], $context);
    }

    /**
     * @throws \ReflectionException
     */
    #[AllowMockObjectsWithoutExpectations]
    public function testThrowErrorIfExtractPropertyFails() {
        $toPersist = new MyEmptyEntity();

        $context = ['previous_data' => $toPersist];
        $this->propertyChangeListener = PropertyChangeListener::of(
            extractProperty: fn ($data) => $data->name,
            afterAction: $this->closure->call(...)
        );
        $this->closure->expects(self::never())->method('call');

        $this->expectException(WarningException::class);
        $this->processor->process($toPersist, new Patch(), [], $context);
    }

    /**
     * @throws \ReflectionException
     */
    #[AllowMockObjectsWithoutExpectations]
    public function testNotCallPropertyChangeListenerIfPropertyDidNotChange() {
        $toPersist = new MyEntity();
        $toPersist->name = null;

        $context = ['previous_data' => $toPersist];
        $this->propertyChangeListener = PropertyChangeListener::of(
            extractProperty: fn ($data) => $data->name,
            beforeAction: $this->closure->call(...),
            afterAction: $this->closure->call(...),
        );
        $this->closure->expects(self::never())->method('call');

        $this->processor->process($toPersist, new Patch(), [], $context);
    }

    /**
     * @throws \ReflectionException
     */
    #[AllowMockObjectsWithoutExpectations]
    public function testCallPropertyChangeListenerIfPropertyDidChange() {
        $oldData = new MyEntity();
        $oldData->name = null;
        $newData = new MyEntity();
        $newData->name = 'test';

        $context = ['previous_data' => $oldData];

        $this->propertyChangeListener = PropertyChangeListener::of(
            extractProperty: fn ($data) => $data->name,
            beforeAction: $this->closure->call(...),
            afterAction: $this->closure->call(...),
        );
        $this->decoratedProcessor->expects(self::once())
            ->method('process')
            ->willReturnArgument(0)
        ;
        $this->closure->expects(self::exactly(2))
            ->method('call')
            ->willReturnOnConsecutiveCalls($newData, null)
        ;

        $processResult = $this->processor->process($newData, new Patch(), [], $context);
        self::assertThat($processResult, self::equalTo($newData));
    }
}

class MyEntityPersistProcessor extends AbstractPersistProcessor {
    public function __construct(
        ProcessorInterface $decorated,
        array $propertyChangeListeners = [],
        private readonly ?MockableClosure $onBefore = null,
        private readonly ?MockableClosure $onAfter = null,
    ) {
        parent::__construct($decorated, $propertyChangeListeners);
    }

    #[\Override]
    public function onBefore($data, Operation $operation, array $uriVariables = [], array $context = []) {
        // @noinspection PhpMethodParametersCountMismatchInspection
        return $this->onBefore->call($data, $operation, $uriVariables, $context);
    }

    public function onAfter($data, Operation $operation, array $uriVariables = [], array $context = []): void {
        // @noinspection PhpMethodParametersCountMismatchInspection
        $this->onAfter->call($data, $operation, $uriVariables, $context);
    }
}

class MyEntity extends BaseEntity {
    public ?string $name = 'test';
}

class MyEmptyEntity extends BaseEntity {}

class WarningException extends \Exception {}
