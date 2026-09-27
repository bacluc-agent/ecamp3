<?php

namespace App\Tests\Api\ContentNodes\MultiSelect;

use App\Tests\Api\ContentNodes\DeleteContentNodeTestCase;

/**
 * @internal
 */
class DeleteMultiSelectTest extends DeleteContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpoint = '/content_node/multi_selects';
        $this->defaultEntity = static::getFixture('multiSelect1');
        $this->campPrototypeEntity = static::getFixture('multiSelectCampPrototype');
        $this->sharedCampEntity = static::getFixture('multiSelectCampShared');
    }
}
