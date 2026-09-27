<?php

declare(strict_types=1);

namespace App\Tests\Api\ContentNodes\MultiSelect;

use App\Tests\Api\ContentNodes\ListContentNodeTestCase;

/**
 * @internal
 */
class ListMultiSelectTest extends ListContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpointBase = '/content_node/multi_selects';

        $this->contentNodesCamp1 = [
            $this->getIriFor('multiSelect1'),
            $this->getIriFor('multiSelect2'),
        ];

        $this->contentNodesCamp2 = [];

        $this->contentNodesCampUnrelated = [
            $this->getIriFor('multiSelectCampUnrelated'),
        ];

        $this->contentNodesCampPrototype = [
            $this->getIriFor('multiSelectCampPrototype'),
        ];

        $this->contentNodesCampShared = [
            $this->getIriFor('multiSelectCampShared'),
        ];
    }
}
