<?php

namespace App\Tests\State\Util;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\State\Util\AbstractRemoveProcessor;
use PHPUnit\Framework\MockObject\Exception;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
class AbstractRemoveProcessorTest extends TestCase {
    private MockObject|ProcessorInterface $decoratedProcessor;
    private AbstractRemoveProcessor|MockObject $processor;

    private MockableClosure|MockObject $onBefore;
    private MockableClosure|MockObject $onAfter;

    /**
     * @throws Exception
     */
    protected function setUp(): void {
        $this->decoratedProcessor = $this->createMock(ProcessorInterface::class);

        $this->onBefore = $this->createMock(MockableClosure::class);
        $this->onBefore->method('call')->willReturnArgument(0);

        $this->onAfter = $this->createMock(MockableClosure::class);
        $this->onAfter->method('call');

        $this->processor = new MyEntityRemoveProcessor(
            decorated: $this->decoratedProcessor,
            onBefore: $this->onBefore,
            onAfter: $this->onAfter,
        );
    }

    public function testCallsOnBeforeAndOnAfterOnDelete() {
        $this->onBefore->expects(self::once())->method('call');
        $this->onAfter->expects(self::once())->method('call');
        $this->decoratedProcessor->expects(self::once())->method('process');

        $this->processor->process(new \stdClass(), new Delete());
    }
}

class MyEntityRemoveProcessor extends AbstractRemoveProcessor {
    public function __construct(
        ProcessorInterface $decorated,
        private readonly ?MockableClosure $onBefore = null,
        private readonly ?MockableClosure $onAfter = null,
    ) {
        parent::__construct($decorated);
    }

    public function onBefore($data, Operation $operation, array $uriVariables = [], array $context = []): void {
        // @noinspection PhpMethodParametersCountMismatchInspection
        $this->onBefore->call($data, $operation, $uriVariables, $context);
    }

    public function onAfter($data, Operation $operation, array $uriVariables = [], array $context = []): void {
        // @noinspection PhpMethodParametersCountMismatchInspection
        $this->onAfter->call($data, $operation, $uriVariables, $context);
    }
}
