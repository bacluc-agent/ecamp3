<?php

namespace App\Tests\Api\ContentNodes\MultiSelect;

use App\Entity\ContentNode\MultiSelect;
use App\Tests\Api\ContentNodes\ReadContentNodeTestCase;

/**
 * @internal
 */
class ReadMultiSelectTest extends ReadContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpoint = '/content_node/multi_selects';
        $this->defaultEntity = static::getFixture('multiSelect1');
        $this->campPrototypeEntity = static::getFixture('multiSelectCampPrototype');
        $this->sharedCampEntity = static::getFixture('multiSelectCampShared');
    }

    public function testGetMultiSelect() {
        // given
        /** @var MultiSelect $contentNode */
        $multiSelect = $this->defaultEntity;

        // when
        $this->get($multiSelect);

        // then
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContains(['data' => $multiSelect->data]);
    }
}
