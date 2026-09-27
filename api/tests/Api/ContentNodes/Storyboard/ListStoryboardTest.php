<?php

declare(strict_types=1);

namespace App\Tests\Api\ContentNodes\Storyboard;

use App\Tests\Api\ContentNodes\ListContentNodeTestCase;

/**
 * @internal
 */
class ListStoryboardTest extends ListContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpointBase = '/content_node/storyboards';

        $this->contentNodesCamp1 = [
            $this->getIriFor('storyboard1'),
            $this->getIriFor('storyboard2'),
        ];

        $this->contentNodesCamp2 = [
            // none
        ];

        $this->contentNodesCampUnrelated = [
            $this->getIriFor('storyboardCampUnrelated'),
        ];

        $this->contentNodesCampPrototype = [
            $this->getIriFor('storyboardCampPrototype'),
        ];

        $this->contentNodesCampShared = [
            $this->getIriFor('storyboardCampShared'),
        ];
    }
}
