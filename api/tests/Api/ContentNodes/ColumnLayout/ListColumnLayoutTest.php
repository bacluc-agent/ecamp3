<?php

declare(strict_types=1);

namespace App\Tests\Api\ContentNodes\ColumnLayout;

use App\Tests\Api\ContentNodes\ListContentNodeTestCase;

/**
 * @internal
 */
class ListColumnLayoutTest extends ListContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpointBase = '/content_node/column_layouts';

        $this->contentNodesCamp1 = [
            $this->getIriFor('columnLayout1'),
            $this->getIriFor('columnLayoutChild1'),
            $this->getIriFor('columnLayout3'),
        ];
        $this->contentNodesCamp2 = [
            $this->getIriFor('columnLayout1camp2'),
        ];

        $this->contentNodesCampUnrelated = [
            $this->getIriFor('columnLayout1campUnrelated'),
        ];

        $this->contentNodesCampPrototype = [
            $this->getIriFor('columnLayout1campPrototype'),
            $this->getIriFor('columnLayout3campPrototype'),
        ];
        $this->contentNodesCampShared = [
            $this->getIriFor('columnLayout1campShared'),
            $this->getIriFor('columnLayout3campShared'),
        ];
    }
}
