<?php

declare(strict_types=1);

namespace App\Tests\Api\ContentNodes\SingleText;

use App\Tests\Api\ContentNodes\ListContentNodeTestCase;

/**
 * @internal
 */
class ListSingleTextTest extends ListContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpointBase = '/content_node/single_texts';

        $this->contentNodesCamp1 = [
            $this->getIriFor('singleText1'),
            $this->getIriFor('singleText2'),
            $this->getIriFor('safetyConsiderations1'),
        ];

        $this->contentNodesCamp2 = [
            // none
        ];

        $this->contentNodesCampUnrelated = [
            $this->getIriFor('singleTextCampUnrelated'),
        ];

        $this->contentNodesCampPrototype = [
            $this->getIriFor('singleTextCampPrototype'),
        ];

        $this->contentNodesCampShared = [
            $this->getIriFor('singleTextCampShared'),
        ];
    }
}
