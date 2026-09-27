<?php

namespace App\Tests\Api\ContentNodes\MaterialNode;

use App\Tests\Api\ContentNodes\UpdateContentNodeTestCase;

/**
 * @internal
 */
class UpdateMaterialNodeTest extends UpdateContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpoint = '/content_node/material_nodes';
        $this->defaultEntity = static::getFixture('materialNode1');
        $this->campPrototypeEntity = static::getFixture('materialNodeCampPrototype');
        $this->sharedCampEntity = static::getFixture('materialNodeCampShared');
    }
}
