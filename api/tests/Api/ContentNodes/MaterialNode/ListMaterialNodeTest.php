<?php

declare(strict_types=1);

namespace App\Tests\Api\ContentNodes\MaterialNode;

use App\Tests\Api\ContentNodes\ListContentNodeTestCase;

/**
 * @internal
 */
class ListMaterialNodeTest extends ListContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpointBase = '/content_node/material_nodes';

        $this->contentNodesCamp1 = [
            $this->getIriFor('materialNode1'),
        ];

        $this->contentNodesCamp2 = [
            $this->getIriFor('materialNode2'),
        ];

        $this->contentNodesCampUnrelated = [
            $this->getIriFor('materialNodeCampUnrelated'),
        ];

        $this->contentNodesCampPrototype = [
            $this->getIriFor('materialNodeCampPrototype'),
        ];

        $this->contentNodesCampShared = [
            $this->getIriFor('materialNodeCampShared'),
        ];
    }
}
