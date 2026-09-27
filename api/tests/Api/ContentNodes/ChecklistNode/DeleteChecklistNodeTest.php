<?php

namespace App\Tests\Api\ContentNodes\ChecklistNode;

use App\Tests\Api\ContentNodes\DeleteContentNodeTestCase;

/**
 * @internal
 */
class DeleteChecklistNodeTest extends DeleteContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpoint = '/content_node/checklist_nodes';
        $this->defaultEntity = static::getFixture('checklistNode3');
        $this->campPrototypeEntity = static::getFixture('checklistNodeCampPrototype');
        $this->sharedCampEntity = static::getFixture('checklistNodeCampShared');
    }
}
