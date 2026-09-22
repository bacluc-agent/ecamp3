<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\MaterialItem;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * @template-implements ProviderInterface<MaterialItem>
 */
class MaterialItemCollectionProvider implements ProviderInterface {
    public function __construct(
        private readonly ProviderInterface $decorated,
        private readonly RequestStack $requestStack
    ) {}

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): array|object|null {
        $request = $this->requestStack->getCurrentRequest();
        $hasFilter = $request?->query->has('camp') || $request?->query->has('period') || $request?->query->has('materialList') || $request?->query->has('materialNode');
        $hasSubresource = !empty($uriVariables) && (isset($uriVariables['campId']) || isset($uriVariables['materialListId']) || isset($uriVariables['materialNodeId']) || isset($uriVariables['periodId'])); // ponytail: minimal guard change — check $uriVariables instead of only $request->query.

        if (!$hasFilter && !$hasSubresource) {
            throw new BadRequestHttpException('Filter on camp, period, materialList or materialNode is required');
        }

        return $this->decorated->provide($operation, $uriVariables, $context);
    }
}
