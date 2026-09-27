<?php

namespace App\Tests\Api\Camps;

use App\Repository\CampRepository;
use App\Tests\Api\ECampApiTestCase;

/**
 * @internal
 */
class DeleteCampTest extends ECampApiTestCase {
    public function testDeleteCampIsDeniedForAnonymousUser() {
        $camp = static::getFixture('camp1');
        static::createBasicClient()->request('DELETE', '/camps/'.$camp->getId());
        $this->assertResponseStatusCodeSame(401);
        $this->assertJsonContains([
            'code' => 401,
            'message' => 'JWT Token not found',
        ]);
    }

    public function testDeleteCampIsDeniedForUnrelatedUser() {
        $camp = static::getFixture('camp1');
        static::createClientWithCredentials(['email' => static::$fixtures['user4unrelated']->getEmail()])
            ->request('DELETE', '/camps/'.$camp->getId())
        ;
        $this->assertResponseStatusCodeSame(404);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Not Found',
        ]);
    }

    public function testDeleteCampIsDeniedForOtherwiseUnrelatedCreator() {
        $camp = static::getFixture('camp2');
        static::createClientWithCredentials(['email' => static::$fixtures['user4unrelated']->getEmail()])
            ->request('DELETE', '/camps/'.$camp->getId())
        ;
        $this->assertResponseStatusCodeSame(404);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Not Found',
        ]);
    }

    public function testDeleteCampIsDeniedForMember() {
        $camp = static::getFixture('camp1');
        static::createClientWithCredentials(['email' => static::$fixtures['campCollaboration2member']->getEmail()])->request('DELETE', '/camps/'.$camp->getId());
        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Access Denied.',
        ]);
    }

    public function testDeleteCampIsAllowedForManager() {
        $camp = static::getFixture('camp2');
        static::createClientWithCredentials()->request('DELETE', '/camps/'.$camp->getId());
        $this->assertResponseStatusCodeSame(204);
        $this->assertNull(static::getContainer()->get(CampRepository::class)->findOneBy(['id' => $camp->getId()]));
    }

    public function testDeletePrototypeCampIsDeniedForUnrelatedUser() {
        $camp = static::getFixture('campPrototype');
        static::createClientWithCredentials()->request('DELETE', '/camps/'.$camp->getId());
        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Access Denied.',
        ]);
    }

    public function testDeleteSharedCampIsDeniedForUnrelatedUser() {
        $camp = static::getFixture('campShared');
        static::createClientWithCredentials()->request('DELETE', '/camps/'.$camp->getId());
        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Access Denied.',
        ]);
    }

    public function testDeleteSharedCampIsDeniedForInactiveUser() {
        $camp = static::getFixture('campShared');
        static::createClientWithCredentials(['email' => static::$fixtures['user5inactive']->getEmail()])
            ->request('DELETE', '/camps/'.$camp->getId())
        ;
        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Access Denied.',
        ]);
    }

    public function testDeleteSharedCampIsDeniedForInvitedUser() {
        $camp = static::getFixture('campShared');
        static::createClientWithCredentials(['email' => static::$fixtures['user6invited']->getEmail()])
            ->request('DELETE', '/camps/'.$camp->getId())
        ;
        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains([
            'title' => 'An error occurred',
            'detail' => 'Access Denied.',
        ]);
    }

    public function testDeleteCampAlsoDeletesContentNodes() {
        $client = static::createClientWithCredentials();
        // Disable resetting the database between the two requests
        $client->disableReboot();

        $client->request('DELETE', $this->getIriFor(static::$fixtures['camp1']));
        $this->assertResponseStatusCodeSame(204);

        $client->request('GET', $this->getIriFor(static::$fixtures['activity1']));
        $this->assertResponseStatusCodeSame(404);

        $client->request('GET', $this->getIriFor(static::$fixtures['columnLayout1']));
        $this->assertResponseStatusCodeSame(404);

        $client->request('GET', $this->getIriFor(static::$fixtures['category1']));
        $this->assertResponseStatusCodeSame(404);

        $client->request('GET', $this->getIriFor(static::$fixtures['columnLayout2']));
        $this->assertResponseStatusCodeSame(404);
    }
}
