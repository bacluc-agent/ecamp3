<?php

namespace App\Tests\Api\ContentNodes\ResponsiveLayout;

use App\Tests\Api\ContentNodes\UpdateContentNodeTestCase;

/**
 * @internal
 */
class UpdateResponsiveLayoutTest extends UpdateContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpoint = '/content_node/responsive_layouts';
        $this->defaultEntity = static::getFixture('responsiveLayout1');
        $this->campPrototypeEntity = static::getFixture('responsiveLayoutCampPrototype');
        $this->sharedCampEntity = static::getFixture('responsiveLayoutCampShared');
    }

    public function testPatchResponsiveLayoutAcceptsValidJson() {
        $VALID_JSON_CONFIG = [
            ['slot' => 'main'],
            ['slot' => 'aside-top'],
            ['slot' => 'aside-bottom'],
        ];

        $contentNode = static::getFixture('responsiveLayout1');
        static::createClientWithCredentials()->request('PATCH', $this->endpoint.'/'.$contentNode->getId(), ['json' => ['data' => [
            'items' => $VALID_JSON_CONFIG,
        ]], 'headers' => ['Content-Type' => 'application/merge-patch+json']]);

        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContains(['data' => [
            'items' => $VALID_JSON_CONFIG,
        ]]);
    }

    public function testPatchResponsiveLayoutRejectsInvalidJson() {
        $INVALID_JSON_CONFIG = [
            'data' => 'value',
        ];

        $contentNode = static::getFixture('responsiveLayout1');
        $response = static::createClientWithCredentials()->request('PATCH', $this->endpoint.'/'.$contentNode->getId(), ['json' => ['data' => [
            'items' => $INVALID_JSON_CONFIG,
        ]], 'headers' => ['Content-Type' => 'application/merge-patch+json']]);

        $this->assertResponseStatusCodeSame(422);
        $this->assertJsonSchemaError($response, 'data');
    }
}
