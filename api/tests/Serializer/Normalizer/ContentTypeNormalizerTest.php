<?php

namespace App\Tests\Serializer\Normalizer;

use ApiPlatform\Metadata\IriConverterInterface;
use App\Entity\ContentType;
use App\Metadata\Resource\Factory\UriTemplateFactory;
use App\Serializer\Normalizer\ContentTypeNormalizer;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Rize\UriTemplate;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * @internal
 */
class ContentTypeNormalizerTest extends TestCase {
    private ContentTypeNormalizer $normalizer;

    private MockObject|NormalizerInterface $decoratedMock;
    private MockObject|UriTemplate $uriTemplate;
    private MockObject|UriTemplateFactory $uriTemplateFactory;

    protected function setUp(): void {
        $this->decoratedMock = $this->createMock(NormalizerInterface::class);

        $iriConverter = $this->createStub(IriConverterInterface::class);
        $this->uriTemplate = $this->createMock(UriTemplate::class);
        $this->uriTemplateFactory = $this->createMock(UriTemplateFactory::class);

        $this->normalizer = new ContentTypeNormalizer(
            $this->decoratedMock,
            $this->uriTemplate,
            $this->uriTemplateFactory,
            $iriConverter,
        );
        $this->normalizer->setSerializer($this->createStub(SerializerInterface::class));
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testDelegatesSupportCheckToDecorated() {
        $this->decoratedMock
            ->expects($this->exactly(2))
            ->method('supportsNormalization')
            ->willReturnOnConsecutiveCalls(true, false)
        ;

        $this->assertTrue($this->normalizer->supportsNormalization([]));
        $this->assertFalse($this->normalizer->supportsNormalization([]));
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testDelegatesNormalizeToDecorated() {
        // given
        $resource = new \stdClass();
        $delegatedResult = [
            'hello' => 'world',
        ];
        $this->decoratedMock->expects($this->once())
            ->method('normalize')
            ->willReturn($delegatedResult)
        ;

        // when
        $result = $this->normalizer->normalize($resource, null, ['resource_class' => \stdClass::class]);

        // then
        $this->assertSame($delegatedResult, $result);
    }

    public function testNormalizeAddsEntityPath() {
        // given
        $contentType = new ContentType();
        $contentType->entityClass = 'App\Entity\ContentNode\DummyContentNode';

        $delegatedResult = [
            'hello' => 'world',
        ];
        $this->decoratedMock->expects($this->once())
            ->method('normalize')
            ->willReturn($delegatedResult)
        ;
        $this->uriTemplateFactory->expects($this->once())
            ->method('createFromResourceClass')
            ->willReturn(['/templatedUri', 'true'])
        ;

        $this->uriTemplate->expects($this->once())
            ->method('expand')
            ->willReturn('/expandedUri')
        ;

        // when
        $result = $this->normalizer->normalize($contentType, null, ['resource_class' => ContentType::class]);

        // then
        $expectedResult = [
            'hello' => 'world',
            '_links' => [
                'contentNodes' => [
                    'href' => '/expandedUri',
                ],
            ],
        ];
        $this->assertSame($expectedResult, $result);
    }
}
