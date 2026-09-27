<?php

namespace App\Tests\Api\ContentNodes\SingleText;

use App\Tests\Api\ContentNodes\DeleteContentNodeTestCase;

/**
 * @internal
 */
class DeleteSingleTextTest extends DeleteContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpoint = '/content_node/single_texts';
        $this->defaultEntity = static::getFixture('singleText1');
        $this->campPrototypeEntity = static::getFixture('singleTextCampPrototype');
        $this->sharedCampEntity = static::getFixture('singleTextCampShared');
    }
}
