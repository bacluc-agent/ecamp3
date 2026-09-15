<?php

namespace App\Tests\State;

use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\State\ProviderInterface;
use App\State\RequireCollectionFilterProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * @internal
 */
class RequireCollectionFilterProviderTest extends TestCase {
    public function testRequiresAConfiguredFilterWithAValue(): void {
        $provider = $this->provider('/?camp=');

        $this->expectExceptionMessage('Filter on camp is required.');
        $provider->provide(new GetCollection(extraProperties: ['scoping_filters' => ['camp']]));
    }

    public function testAcceptsDottedFilterWithAValue(): void {
        $decorated = $this->createMock(ProviderInterface::class);
        $decorated->expects($this->once())->method('provide')->willReturn([]);
        $provider = $this->provider('/?checklist.camp=%2Fapi%2Fcamps%2F1', $decorated);

        self::assertSame([], $provider->provide(new GetCollection(extraProperties: ['scoping_filters' => ['checklist.camp']])));
    }

    public function testSkipsUriVariableSubresources(): void {
        $decorated = $this->createMock(ProviderInterface::class);
        $decorated->expects($this->once())->method('provide')->willReturn([]);
        $provider = $this->provider('/', $decorated);

        self::assertSame([], $provider->provide(new GetCollection(extraProperties: ['scoping_filters' => ['camp']]), ['camp' => '1']));
    }

    public function testAllowsOperationsWithScopingDisabled(): void {
        $decorated = $this->createMock(ProviderInterface::class);
        $decorated->expects($this->once())->method('provide')->willReturn([]);
        $provider = $this->provider('/', $decorated);

        self::assertSame([], $provider->provide(new GetCollection(extraProperties: ['scoping_filters' => false])));
    }

    public function testDoesNotChangeItemOperations(): void {
        $decorated = $this->createMock(ProviderInterface::class);
        $decorated->expects($this->once())->method('provide')->willReturn([]);
        $provider = $this->provider('/', $decorated);

        self::assertSame([], $provider->provide(new Get()));
    }

    private function provider(string $uri, ?ProviderInterface $decorated = null): RequireCollectionFilterProvider {
        $requestStack = new RequestStack();
        $requestStack->push(Request::create($uri));

        return new RequireCollectionFilterProvider($decorated ?? $this->createStub(ProviderInterface::class), $requestStack);
    }
}
