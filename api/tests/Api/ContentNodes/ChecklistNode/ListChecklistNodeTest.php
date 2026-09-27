<?php

declare(strict_types=1);

namespace App\Tests\Api\ContentNodes\ChecklistNode;

use App\Tests\Api\ContentNodes\ListContentNodeTestCase;

/**
 * @internal
 */
class ListChecklistNodeTest extends ListContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpointBase = '/content_node/checklist_nodes';

        $this->contentNodesCamp1 = [
            $this->getIriFor('checklistNode1'),
            $this->getIriFor('checklistNode3'),
        ];
        $this->contentNodesCamp2 = [
            // none
        ];
        $this->contentNodesCampUnrelated = [
            $this->getIriFor('checklistNodeCampUnrelated'),
        ];
        $this->contentNodesCampPrototype = [
            $this->getIriFor('checklistNodeCampPrototype'),
        ];
        $this->contentNodesCampShared = [
            $this->getIriFor('checklistNodeCampShared'),
        ];
    }
}
