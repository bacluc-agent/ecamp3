<?php

namespace App\Tests\Api\ContentNodes\RootColumnLayout;

use App\Tests\Api\ECampApiTestCase;

/**
 * Tests for deleting a root column layout.
 *
 * @internal
 */
class DeleteRootColumnLayoutTest extends ECampApiTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpoint = '/content_node/column_layouts';
        $this->defaultEntity = static::getFixture('columnLayout1');
    }

    public function testDeleteColumnLayoutIsNotAllowedWhenColumnLayoutIsRoot() {
        // when
        $this->delete(entity: static::$fixtures['columnLayout1']);

        // then
        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Access Denied.',
        ]);
    }
}
