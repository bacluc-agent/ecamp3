<?php

namespace App\Tests\Api\ContentNodes\ResponsiveLayout;

use App\Tests\Api\ContentNodes\DeleteContentNodeTestCase;

/**
 * @internal
 */
class DeleteResponsiveLayoutTest extends DeleteContentNodeTestCase {
    #[\Override]
    public function setUp(): void {
        parent::setUp();

        $this->endpoint = '/content_node/responsive_layouts';
        $this->defaultEntity = static::getFixture('responsiveLayout1');
        $this->campPrototypeEntity = static::getFixture('responsiveLayoutCampPrototype');
        $this->sharedCampEntity = static::getFixture('responsiveLayoutCampShared');
    }
}
