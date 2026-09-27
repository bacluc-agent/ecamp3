<?php

namespace App\Tests\State\ContentNodes;

use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\ContentNode\ColumnLayout;
use App\Entity\ContentNode\SingleText;
use App\InputFilter\CleanHTMLFilter;
use App\State\ContentNode\SingleTextPersistProcessor;
use PHPUnit\Framework\MockObject\Exception;
use PHPUnit\Framework\TestCase;

use function PHPUnit\Framework\assertThat;
use function PHPUnit\Framework\equalTo;
use function PHPUnit\Framework\logicalNot;

/**
 * @internal
 */
class SingleTextPersistProcessorTest extends TestCase {
    private SingleTextPersistProcessor $processor;
    private ColumnLayout $root;
    private SingleText $contentNode;

    /**
     * @throws Exception
     */
    protected function setUp(): void {
        $decoratedProcessor = $this->createStub(ProcessorInterface::class);
        $cleanHTMLFilter = $this->createStub(CleanHTMLFilter::class);
        $cleanHTMLFilter->method('applyTo')->willReturnCallback(
            function (array $object, string $property): array {
                $object[$property] = '***sanitizedHTML***';

                return $object;
            }
        );

        $this->contentNode = new SingleText();
        $this->contentNode->data = [
            'html' => 'test',
        ];

        $this->root = new ColumnLayout();
        $this->contentNode->parent = new SingleText();
        $this->contentNode->parent->root = $this->root;

        $this->processor = new SingleTextPersistProcessor($decoratedProcessor, $cleanHTMLFilter);
    }

    public function testSetsRootFromParentOnCreate() {
        $data = $this->processor->onBefore($this->contentNode, new Post());

        assertThat($this->root, equalTo($data->root));
    }

    public function testDoesNotSetRootFromParentOnUpdate() {
        $data = $this->processor->onBefore($this->contentNode, new Patch());

        assertThat($this->root, logicalNot(equalTo($data->root)));
    }

    public function testSanitizeData() {
        $data = $this->processor->onBefore($this->contentNode, new Post());

        assertThat('***sanitizedHTML***', equalTo($data->data['html']));
    }
}
