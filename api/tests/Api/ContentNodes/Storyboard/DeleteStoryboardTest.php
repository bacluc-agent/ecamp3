<?php

namespace App\Tests\Api\ContentNodes\Storyboard;

use App\Tests\Api\ContentNodes\DeleteContentNodeTestCase;

/**
 * @internal
 */
class DeleteStoryboardTest extends DeleteContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpoint = '/content_node/storyboards';
        $this->defaultEntity = static::getFixture('storyboard1');
        $this->campPrototypeEntity = static::getFixture('storyboardCampPrototype');
        $this->sharedCampEntity = static::getFixture('storyboardCampShared');
    }
}
