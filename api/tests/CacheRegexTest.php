<?php

namespace App\Tests;

use PHPUnit\Framework\Attributes\TestWith;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

use function PHPUnit\Framework\assertDoesNotMatchRegularExpression;
use function PHPUnit\Framework\assertMatchesRegularExpression;

/**
 * @internal
 */
class CacheRegexTest extends KernelTestCase {
    private string $cacheRegex;

    protected function setUp(): void {
        $this->cacheRegex = '{'.$this->getContainer()->getParameter('app.httpCache.matchPath').'}';
    }

    #[TestWith(data: [''], name: '')]
    #[TestWith(data: ['/'], name: '/')]
    #[TestWith(data: ['index.jsonhal'], name: '/index.jsonhal')]
    #[TestWith(data: ['index.jsonhal?x=y'], name: '/index.jsonhal?x=y')]
    #[TestWith(data: ['/camps/25a82475e0b7/activities'], name: '/camps/25a82475e0b7/activities')]
    #[TestWith(data: ['/camps/25a82475e0b7/activities?name=Snow'], name: '/camps/25a82475e0b7/activities?name=Snow')]
    #[TestWith(data: ['/camps/25a82475e0b7/categories'], name: '/camps/25a82475e0b7/categories')]
    #[TestWith(data: ['/camps/25a82475e0b7/categories?name=Snow'], name: '/camps/25a82475e0b7/categories?name=Snow')]
    #[TestWith(data: ['/camps/25a82475e0b7/checklists'], name: '/camps/25a82475e0b7/checklists')]
    #[TestWith(data: ['/camps/25a82475e0b7/checklists?name=Snow'], name: '/camps/25a82475e0b7/checklists?name=Snow')]
    #[TestWith(data: ['/content_types'], name: '/content_types')]
    #[TestWith(data: ['/content_types?name=Snow'], name: '/content_types?name=Snow')]
    #[TestWith(data: ['/content_types/25a82375a0b6'], name: '/content_types/25a82375a0b6')]
    #[TestWith(data: ['/content_types/25a82375a0b6?name=Snow'], name: '/content_types/25a82375a0b6?name=Snow')]
    #[TestWith(data: ['/periods/25a82475e0b7/schedule_entries'], name: '/periods/25a82475e0b7/schedule_entries')]
    #[TestWith(data: ['/periods/25a82475e0b7/schedule_entries?name=Snow'], name: '/periods/25a82475e0b7/schedule_entries?name=Snow')]
    #[TestWith(data: ['/activities/25a82375a0b6'], name: '/activities/25a82375a0b6')]
    #[TestWith(data: ['/activities/25a82375a0b6?name=Snow'], name: '/activities/25a82375a0b6?name=Snow')]
    #[TestWith(data: ['/periods/25a82475e0b7/days'], name: '/periods/25a82475e0b7/days')]
    #[TestWith(data: ['/periods/25a82475e0b7/days?name=Snow'], name: '/periods/25a82475e0b7/days?name=Snow')]
    public function testIncludesUrls(string $url) {
        $url = preg_replace('/\?.*$/', '', $url);
        assertMatchesRegularExpression($this->cacheRegex, $url);
    }

    #[TestWith(data: ['/camps/25a82475e0b7/categories/c53dd7917e63'], name: '/camps/25a82475e0b7/categories/c53dd7917e63')]
    public function testAlsoIncludesUrls(string $url) {
        $url = preg_replace('/\?.*$/', '', $url);
        assertMatchesRegularExpression($this->cacheRegex, $url);
    }

    #[TestWith(data: ['/invitations'], name: '/invitations')]
    #[TestWith(data: ['/invitations?x=y'], name: '/invitations?x=y')]
    #[TestWith(data: ['/personal_invitations'], name: '/personal_invitations')]
    #[TestWith(data: ['/personal_invitations?x=y'], name: '/personal_invitations?x=y')]
    #[TestWith(data: ['/activity_progress_labels'], name: '/activity_progress_labels')]
    #[TestWith(data: ['/activity_progress_labels?x=y'], name: '/activity_progress_labels?x=y')]
    #[TestWith(data: ['/activity_responsibles'], name: '/activity_responsibles')]
    #[TestWith(data: ['/activity_responsibles?x=y'], name: '/activity_responsibles?x=y')]
    #[TestWith(data: ['/camp_collaborations'], name: '/camp_collaborations')]
    #[TestWith(data: ['/camp_collaborations?x=y'], name: '/camp_collaborations?x=y')]
    #[TestWith(data: ['/categories'], name: '/categories')]
    #[TestWith(data: ['/categories?x=y'], name: '/categories?x=y')]
    #[TestWith(data: ['/checklists'], name: '/checklists')]
    #[TestWith(data: ['/checklists?x=y'], name: '/checklists?x=y')]
    #[TestWith(data: ['/checklist_items'], name: '/checklist_items')]
    #[TestWith(data: ['/checklist_items?x=y'], name: '/checklist_items?x=y')]
    #[TestWith(data: ['/content_nodes'], name: '/content_nodes')]
    #[TestWith(data: ['/content_nodes?x=y'], name: '/content_nodes?x=y')]
    #[TestWith(data: ['/content_node/checklist_nodes'], name: '/content_node/checklist_nodes')]
    #[TestWith(data: ['/content_node/checklist_nodes?x=y'], name: '/content_node/checklist_nodes?x=y')]
    #[TestWith(data: ['/content_node/column_layouts'], name: '/content_node/column_layouts')]
    #[TestWith(data: ['/content_node/column_layouts?x=y'], name: '/content_node/column_layouts?x=y')]
    #[TestWith(data: ['/content_node/material_nodes'], name: '/content_node/material_nodes')]
    #[TestWith(data: ['/content_node/material_nodes?x=y'], name: '/content_node/material_nodes?x=y')]
    #[TestWith(data: ['/content_node/multi_selects'], name: '/content_node/multi_selects')]
    #[TestWith(data: ['/content_node/multi_selects?x=y'], name: '/content_node/multi_selects?x=y')]
    #[TestWith(data: ['/content_node/storyboards'], name: '/content_node/storyboards')]
    #[TestWith(data: ['/content_node/storyboards?x=y'], name: '/content_node/storyboards?x=y')]
    #[TestWith(data: ['/days'], name: '/days')]
    #[TestWith(data: ['/days?x=y'], name: '/days?x=y')]
    #[TestWith(data: ['/day_responsibles'], name: '/day_responsibles')]
    #[TestWith(data: ['/day_responsibles?x=y'], name: '/day_responsibles?x=y')]
    #[TestWith(data: ['/material_items'], name: '/material_items')]
    #[TestWith(data: ['/material_items?x=y'], name: '/material_items?x=y')]
    #[TestWith(data: ['/material_lists'], name: '/material_lists')]
    #[TestWith(data: ['/material_lists?x=y'], name: '/material_lists?x=y')]
    #[TestWith(data: ['/periods'], name: '/periods')]
    #[TestWith(data: ['/periods?x=y'], name: '/periods?x=y')]
    #[TestWith(data: ['/profiles'], name: '/profiles')]
    #[TestWith(data: ['/profiles?x=y'], name: '/profiles?x=y')]
    #[TestWith(data: ['/schedule_entries'], name: '/schedule_entries')]
    #[TestWith(data: ['/schedule_entries?x=y'], name: '/schedule_entries?x=y')]
    #[TestWith(data: ['/users'], name: '/users')]
    #[TestWith(data: ['/users?x=y'], name: '/users?x=y')]
    public function testDoesNotIncludeUrls(string $url) {
        $url = preg_replace('/\?.*$/', '', $url);
        assertDoesNotMatchRegularExpression($this->cacheRegex, $url);
    }
}
