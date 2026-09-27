<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use App\Entity\MaterialItem;
use App\State\Util\AbstractPersistProcessor;

/**
 * @template-extends AbstractPersistProcessor<MaterialItem>
 */
class MaterialItemCreateProcessor extends AbstractPersistProcessor {
    /**
     * @param MaterialItem $data
     */
    #[\Override]
    public function onBefore($data, Operation $operation, array $uriVariables = [], array $context = []): MaterialItem {
        $data->camp = $data->getCamp();

        return $data;
    }
}
