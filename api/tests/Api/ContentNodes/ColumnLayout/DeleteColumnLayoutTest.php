<?php

namespace App\Tests\Api\ContentNodes\ColumnLayout;

use App\Tests\Api\ContentNodes\DeleteContentNodeTestCase;

/**
 * @internal
 */
class DeleteColumnLayoutTest extends DeleteContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpoint = '/content_node/column_layouts';
        $this->defaultEntity = static::getFixture('columnLayoutChild1');
        $this->campPrototypeEntity = static::getFixture('columnLayout3campPrototype');
        $this->sharedCampEntity = static::getFixture('columnLayout3campShared');
    }

    public function testDeleteColumnLayoutAlsoDeletesChildren() {
        $client = static::createClientWithCredentials();
        // Disable resetting the database between the two requests
        $client->disableReboot();

        $client->request('DELETE', $this->getIriFor(static::$fixtures['columnLayoutChild1']));
        $this->assertResponseStatusCodeSame(204);

        $client->request('GET', $this->getIriFor(static::$fixtures['singleText2']));
        $this->assertResponseStatusCodeSame(404);
    }
}
