<?php

namespace App\Tests\Api\Comments;

use App\Tests\Api\ECampApiTestCase;

/**
 * @internal
 */
class UpdateCommentTest extends ECampApiTestCase {
    public function testPatchCommentIsNotAllowed() {
        $comment = static::getFixture('comment1');
        static::createClientWithCredentials()->request('PATCH', '/comments/'.$comment->getId(), ['json' => [], 'headers' => ['Content-Type' => 'application/merge-patch+json']]);

        $this->assertResponseStatusCodeSame(405); // method not allowed
    }
}
