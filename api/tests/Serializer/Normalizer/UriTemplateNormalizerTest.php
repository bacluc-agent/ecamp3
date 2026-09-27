<?php

namespace App\Tests\Serializer\Normalizer;

use ApiPlatform\Documentation\Entrypoint;
use ApiPlatform\Metadata\Resource\ResourceNameCollection;
use ApiPlatform\Metadata\UrlGeneratorInterface;
use App\Entity\Activity;
use App\Entity\Camp;
use App\Metadata\Resource\Factory\UriTemplateFactory;
use App\Serializer\Normalizer\UriTemplateNormalizer;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\String\Inflector\EnglishInflector;

/**
 * @internal
 */
class UriTemplateNormalizerTest extends TestCase {
    private UriTemplateNormalizer $uriTemplateNormalizer;
    private MockObject|NormalizerInterface $decorated;
    private MockObject|UriTemplateFactory $uriTemplateFactory;
    private array $loginAndOauthLinks;

    protected function setUp(): void {
        $this->decorated = $this->createMock(NormalizerInterface::class);
        $this->uriTemplateFactory = $this->createMock(UriTemplateFactory::class);
        $englishInflector = new EnglishInflector();
        $urlGenerator = $this->createMock(UrlGeneratorInterface::class);
        $urlGenerator->method('generate')->willReturnCallback(function (string $arg): string {
            return match ($arg) {
                'authentication_token' => '/authentication_token',
                'connect_google_start' => '/auth/google',
                'connect_pbsmidata_start' => '/auth/pbsmidata',
                'connect_cevidb_start' => '/auth/cevidb',
                'connect_jubladb_start' => '/auth/jubladb',
                'api_refresh_token' => '/token/refresh',
                '_api_/auth/resend_activation{._format}_post' => '/auth/resend_activation',
                '_api_/auth/reset_password{._format}_post' => '/auth/reset_password',
                default => null,
            };
        });

        $this->uriTemplateNormalizer = new UriTemplateNormalizer(
            $this->decorated,
            $englishInflector,
            $this->uriTemplateFactory,
            $urlGenerator,
        );

        $this->loginAndOauthLinks = [
            'login' => [
                'href' => '/authentication_token',
            ],
            'oauthGoogle' => [
                'href' => '/auth/google{?callback}',
                'templated' => true,
            ],
            'oauthPbsmidata' => [
                'href' => '/auth/pbsmidata{?callback}',
                'templated' => true,
            ],
            'oauthCevidb' => [
                'href' => '/auth/cevidb{?callback}',
                'templated' => true,
            ],
            'oauthJubladb' => [
                'href' => '/auth/jubladb{?callback}',
                'templated' => true,
            ],
            'resendActivation' => [
                'href' => '/auth/resend_activation',
                'templated' => false,
            ],
            'resetPassword' => [
                'href' => '/auth/reset_password{/id}',
                'templated' => true,
            ],
            'refreshToken' => [
                'href' => '/token/refresh',
            ],
        ];
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testCreateNotTemplatedLinkIfNoParameters() {
        // given
        $this->decorated->expects($this->once())->method('normalize')->willReturn(['_links' => [
            'self' => ['href' => '/'],
            'camp' => ['href' => '/camps'],
        ]]);
        $resource = new Entrypoint(new ResourceNameCollection([Camp::class]));
        $this->uriTemplateFactory->expects($this->once())->method('createFromShortname')->willReturn(['/camps', false]);

        // when
        $normalize = $this->uriTemplateNormalizer->normalize($resource);

        // then
        self::assertThat($normalize, self::equalTo(
            [
                '_links' => [
                    'self' => [
                        'href' => '/',
                    ],
                    'camps' => [
                        'href' => '/camps',
                    ],
                    ...$this->loginAndOauthLinks,
                ],
            ]
        ));
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testCreateTemplatedLinkIfPathParameters() {
        // given
        $this->decorated->expects($this->once())->method('normalize')->willReturn(['_links' => [
            'self' => ['href' => '/'],
            'camp' => ['href' => '/camps'],
        ]]);
        $resource = new Entrypoint(new ResourceNameCollection([Camp::class]));
        $this->uriTemplateFactory->expects($this->once())->method('createFromShortname')->willReturn(['/camps{/id}', true]);

        // when
        $normalize = $this->uriTemplateNormalizer->normalize($resource);

        // then
        self::assertThat($normalize, self::equalTo(
            [
                '_links' => [
                    'self' => [
                        'href' => '/',
                    ],
                    'camps' => [
                        'href' => '/camps{/id}',
                        'templated' => true,
                    ],
                    ...$this->loginAndOauthLinks,
                ],
            ]
        ));
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testCreateTemplatedLinkForQueryParameters() {
        // given
        $this->decorated->expects($this->once())->method('normalize')->willReturn(['_links' => [
            'self' => ['href' => '/'],
            'activity' => ['href' => '/activities'],
        ]]);
        $resource = new Entrypoint(new ResourceNameCollection([Activity::class]));
        $this->uriTemplateFactory->expects($this->once())->method('createFromShortname')->willReturn(['/activities{?camp,camp[]}', true]);

        // when
        $normalize = $this->uriTemplateNormalizer->normalize($resource);

        // then
        self::assertThat($normalize, self::equalTo(
            [
                '_links' => [
                    'self' => [
                        'href' => '/',
                    ],
                    'activities' => [
                        'href' => '/activities{?camp,camp[]}',
                        'templated' => true,
                    ],
                    ...$this->loginAndOauthLinks,
                ],
            ]
        ));
    }

    #[AllowMockObjectsWithoutExpectations]
    public function testMergePathAndQueryParameter() {
        // given
        $this->decorated->expects($this->once())->method('normalize')->willReturn(['_links' => [
            'self' => ['href' => '/'],
            'activity' => ['href' => '/activities'],
        ]]);
        $resource = new Entrypoint(new ResourceNameCollection([Activity::class]));
        $this->uriTemplateFactory->expects($this->once())->method('createFromShortname')->willReturn(['/activities{/id}{?camp,camp[]}', true]);

        // when
        $normalize = $this->uriTemplateNormalizer->normalize($resource);

        // then
        self::assertThat($normalize, self::equalTo(
            [
                '_links' => [
                    'self' => [
                        'href' => '/',
                    ],
                    'activities' => [
                        'href' => '/activities{/id}{?camp,camp[]}',
                        'templated' => true,
                    ],
                    ...$this->loginAndOauthLinks,
                ],
            ]
        ));
    }
}
