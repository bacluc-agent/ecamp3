<?php

namespace App\Tests\Api\ContentNodes;

use App\Entity\ContentNode;
use App\Tests\Api\ECampApiTestCase;

/**
 * Base LIST (get) test case to be used for various ContentNode types.
 *
 * This test class covers all tests that are the same across all content node implementations
 *
 * @internal
 */
abstract class ListContentNodeTestCase extends ECampApiTestCase {
    protected string $endpointBase = '';

    // content nodes visible for user 1, 2, 3
    protected array $contentNodesCamp1 = [];
    protected array $contentNodesCamp2 = [];

    // content nodes visislb for user 4
    protected array $contentNodesCampUnrelated = [];

    // content nodes visible for everyone
    protected array $contentNodesCampPrototype = [];
    protected array $contentNodesCampShared = [];

    #[\Override]
    public function setUp(): void {
        parent::setUp();
    }

    public function testListForAnonymousUser() {
        $this->endpoint = $this->endpointBase;
        static::createBasicClient()->request('GET', $this->endpoint);
        $this->assertResponseStatusCodeSame(401);
        $this->assertJsonContains([
            'code' => 401,
            'message' => 'JWT Token not found',
        ]);
    }

    public function testListForInvitedCollaborator() {
        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campPrototype');
        $response = $this->list(user: static::$fixtures['user6invited']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampPrototype);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campShared');
        $response = $this->list(user: static::$fixtures['user6invited']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampShared);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campUnrelated');
        $this->list(user: static::$fixtures['user6invited']);
        $this->assertResponseStatusCodeSame(400);
        $this->assertJsonContains(['status' => 400]);
    }

    public function testListForInactiveCollaborator() {
        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campPrototype');
        $response = $this->list(user: static::$fixtures['user5inactive']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampPrototype);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campShared');
        $response = $this->list(user: static::$fixtures['user5inactive']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampShared);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campUnrelated');
        $this->list(user: static::$fixtures['user5inactive']);
        $this->assertResponseStatusCodeSame(400);
        $this->assertJsonContains(['status' => 400]);
    }

    public function testListForUnrelatedUser() {
        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campUnrelated');
        $response = $this->list(user: static::$fixtures['user4unrelated']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampUnrelated);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campPrototype');
        $response = $this->list(user: static::$fixtures['user4unrelated']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampPrototype);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campShared');
        $response = $this->list(user: static::$fixtures['user4unrelated']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampShared);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('camp1');
        $this->list(user: static::$fixtures['user4unrelated']);
        $this->assertResponseStatusCodeSame(400);
        $this->assertJsonContains(['status' => 400]);
    }

    public function testListForGuest() {
        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('camp1');
        $response = $this->list(user: static::$fixtures['user3guest']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCamp1);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('camp2');
        $response = $this->list(user: static::$fixtures['user3guest']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCamp2);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campPrototype');
        $response = $this->list(user: static::$fixtures['user3guest']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampPrototype);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campShared');
        $response = $this->list(user: static::$fixtures['user3guest']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampShared);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campUnrelated');
        $this->list(user: static::$fixtures['user3guest']);
        $this->assertResponseStatusCodeSame(400);
        $this->assertJsonContains(['status' => 400]);
    }

    public function testListForMember() {
        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('camp1');
        $response = $this->list(user: static::$fixtures['user2member']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCamp1);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('camp2');
        $response = $this->list(user: static::$fixtures['user2member']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCamp2);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campPrototype');
        $response = $this->list(user: static::$fixtures['user2member']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampPrototype);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campShared');
        $response = $this->list(user: static::$fixtures['user2member']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampShared);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campUnrelated');
        $this->list(user: static::$fixtures['user2member']);
        $this->assertResponseStatusCodeSame(400);
        $this->assertJsonContains(['status' => 400]);
    }

    public function testListForManager() {
        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('camp1');
        $response = $this->list(user: static::$fixtures['user1manager']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCamp1);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('camp2');
        $response = $this->list(user: static::$fixtures['user1manager']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCamp2);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campPrototype');
        $response = $this->list(user: static::$fixtures['user1manager']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampPrototype);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campShared');
        $response = $this->list(user: static::$fixtures['user1manager']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContainsItems($response, $this->contentNodesCampShared);

        $this->endpoint = $this->endpointBase.'?camp='.$this->getIriFor('campUnrelated');
        $this->list(user: static::$fixtures['user1manager']);
        $this->assertResponseStatusCodeSame(400);
        $this->assertJsonContains(['status' => 400]);
    }
}
