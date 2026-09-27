<?php

namespace App\Tests\Api\Comments;

use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use App\Entity\Comment;
use App\Tests\Api\ECampApiTestCase;

/**
 * @internal
 */
class CreateCommentTest extends ECampApiTestCase {
    public function testCreateCommentIsDeniedForAnonymousUser() {
        static::createBasicClient()->request('POST', '/comments', ['json' => $this->getExampleWritePayload()]);

        $this->assertResponseStatusCodeSame(401);
        $this->assertJsonContains([
            'code' => 401,
            'message' => 'JWT Token not found',
        ]);
    }

    public function testCreateCommentIsNotPossibleForUnrelatedUserBecauseCampIsNotReadable() {
        static::createClientWithCredentials(['email' => static::$fixtures['user4unrelated']->getEmail()])
            ->request('POST', '/comments', ['json' => $this->getExampleWritePayload()])
        ;
        $this->assertResponseStatusCodeSame(400);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Item not found for "'.$this->getIriFor('camp1').'".',
        ]);
    }

    public function testCreateCommentIsAllowedForGuest() {
        static::createClientWithCredentials(['email' => static::$fixtures['user3guest']->getEmail()])
            ->request('POST', '/comments', ['json' => $this->getExampleWritePayload()])
        ;

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains($this->getExampleReadPayload());
    }

    public function testCreateCommentIsAllowedForMember() {
        static::createClientWithCredentials(['email' => static::$fixtures['user2member']->getEmail()])
            ->request('POST', '/comments', ['json' => $this->getExampleWritePayload()])
        ;

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains($this->getExampleReadPayload());
    }

    public function testCreateCommentIsAllowedForManager() {
        static::createClientWithCredentials()->request('POST', '/comments', ['json' => $this->getExampleWritePayload()]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains($this->getExampleReadPayload());
    }

    public function testCreateCommentInCampPrototypeIsDeniedForUnrelatedUser() {
        static::createClientWithCredentials()->request('POST', '/comments', ['json' => $this->getExampleWritePayload([
            'camp' => $this->getIriFor('campPrototype'),
            'activity' => $this->getIriFor('activity1campPrototype'),
        ])]);

        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Access Denied.',
        ]);
    }

    public function testCreateCommentInSharedCampIsDeniedForUnrelatedUser() {
        static::createClientWithCredentials()->request('POST', '/comments', ['json' => $this->getExampleWritePayload([
            'camp' => $this->getIriFor('campShared'),
            'activity' => $this->getIriFor('activity1campPrototype'),
        ])]);

        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Access Denied.',
        ]);
    }

    public function testCreateCommentInSharedCampIsDeniedForInactiveUser() {
        static::createClientWithCredentials(['email' => static::$fixtures['user5inactive']->getEmail()])->request('POST', '/comments', ['json' => $this->getExampleWritePayload([
            'camp' => $this->getIriFor('campShared'),
            'activity' => $this->getIriFor('activity1campPrototype'),
        ])]);

        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Access Denied.',
        ]);
    }

    public function testCreateCommentInSharedCampIsDeniedForInvitedUser() {
        static::createClientWithCredentials(['email' => static::$fixtures['user6invited']->getEmail()])->request('POST', '/comments', ['json' => $this->getExampleWritePayload([
            'camp' => $this->getIriFor('campShared'),
            'activity' => $this->getIriFor('activity1campPrototype'),
        ])]);

        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Access Denied.',
        ]);
    }

    public function testCreateCommentValidatesMissingText() {
        static::createClientWithCredentials()->request('POST', '/comments', ['json' => $this->getExampleWritePayload([], ['textHtml'])]);

        $this->assertResponseStatusCodeSame(422);
        $this->assertJsonContains([
            'violations' => [
                [
                    'propertyPath' => 'textHtml',
                    'message' => 'This value should not be blank.',
                ],
            ],
        ]);
    }

    public function testCreateCommentValidatesTextMaxLength() {
        static::createClientWithCredentials()->request('POST', '/comments', ['json' => $this->getExampleWritePayload([
            'textHtml' => str_repeat('a', 1025),
        ])]);

        $this->assertResponseStatusCodeSame(422);
        $this->assertJsonContains([
            'violations' => [
                [
                    'propertyPath' => 'textHtml',
                    'message' => 'This value is too long. It should have 1024 characters or less.',
                ],
            ],
        ]);
    }

    public function testCreateCommentRejectsAuthorInPayload() {
        static::createClientWithCredentials()->request('POST', '/comments', ['json' => $this->getExampleWritePayload(['author' => $this->getIriFor('user1manager')])]);

        $this->assertResponseStatusCodeSame(400);
        $this->assertJsonContains([
            'detail' => 'Extra attributes are not allowed ("author" is unknown).',
        ]);
    }

    public function testCreateCommentRejectsActivityCampMismatch() {
        static::createClientWithCredentials()->request('POST', '/comments', ['json' => $this->getExampleWritePayload(['camp' => $this->getIriFor('camp2')])]);

        $this->assertResponseStatusCodeSame(422);
        $this->assertJsonContains([
            'detail' => 'activity: Must belong to the same camp.',
        ]);
    }

    public function testCreateCommentFiltersMaliciousHtml() {
        static::createClientWithCredentials()->request('POST', '/comments', ['json' => $this->getExampleWritePayload(['textHtml' => '<b>testText</b><script>alert(1)</script>'])]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains($this->getExampleReadPayload(['textHtml' => '<b>testText</b>']));
    }

    #[\Override]
    public function getExampleWritePayload($attributes = [], $except = []) {
        return $this->getExamplePayload(
            Comment::class,
            Post::class,
            array_merge([
                'camp' => $this->getIriFor('camp1'),
                'activity' => $this->getIriFor('activity1'),
            ], $attributes),
            ['author'],
            $except
        );
    }

    public function getExampleReadPayload($attributes = [], $except = []) {
        return $this->getExamplePayload(
            Comment::class,
            Get::class,
            $attributes,
            ['camp', 'activity', 'author'],
            $except
        );
    }
}
