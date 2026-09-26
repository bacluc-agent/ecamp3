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
    #[TestWith(data: ['/camps/25a82475e0b7/activities'], name: '/camps/25a82475e0b7/activities')]
    #[TestWith(data: ['/camps/25a82475e0b7/categories'], name: '/camps/25a82475e0b7/categories')]
    #[TestWith(data: ['/camps/25a82475e0b7/checklists'], name: '/camps/25a82475e0b7/checklists')]
    #[TestWith(data: ['/content_types'], name: '/content_types')]
    #[TestWith(data: ['/content_types/25a82375a0b6'], name: '/content_types/25a82375a0b6')]
    #[TestWith(data: ['/periods/25a82475e0b7/schedule_entries'], name: '/periods/25a82475e0b7/schedule_entries')]
    public function testIncludesUrls(string $url) {
        assertMatchesRegularExpression($this->cacheRegex, $url);
    }

    /**
     * The two end-anchored alternatives ($ and index.jsonhal$) are missing on purpose:
     * a pure regex match against the full request uri can never match them with a query
     * string, but the fos_http_cache cache_control rules match on the path only, so those
     * urls are cacheable in the running application.
     */
    #[TestWith(data: ['/content_types?x=1'], name: '/content_types?x=1')]
    #[TestWith(data: ['/camps/25a82475e0b7/categories?x=1'], name: '/camps/25a82475e0b7/categories?x=1')]
    #[TestWith(data: ['/periods/25a82475e0b7/schedule_entries?x=1'], name: '/periods/25a82475e0b7/schedule_entries?x=1')]
    #[TestWith(data: ['/camps/25a82475e0b7/activities?camp=%2Fcamps%2F25a82475e0b7&order[id]=asc'], name: '/camps/25a82475e0b7/activities?camp=%2Fcamps%2F25a82475e0b7&order[id]=asc')]
    #[TestWith(data: ['/camps/25a82475e0b7/checklists?x=1'], name: '/camps/25a82475e0b7/checklists?x=1')]
    #[TestWith(data: ['/activities/25a82475e0b7?x=1'], name: '/activities/25a82475e0b7?x=1')]
    #[TestWith(data: ['/periods/25a82475e0b7/days?x=1'], name: '/periods/25a82475e0b7/days?x=1')]
    #[TestWith(data: ['/camps/25a82475e0b7/categories/c53dd7917e63?x=1'], name: '/camps/25a82475e0b7/categories/c53dd7917e63?x=1')]
    public function testIncludesUrlsWithQueryParams(string $url) {
        assertMatchesRegularExpression($this->cacheRegex, $url);
    }

    #[TestWith(data: ['/camps/25a82475e0b7/categories/c53dd7917e63'], name: '/camps/25a82475e0b7/categories/c53dd7917e63')]
    public function testAlsoIncludesUrls(string $url) {
        assertMatchesRegularExpression($this->cacheRegex, $url);
    }

    #[TestWith(data: ['/invitations'], name: '/invitations')]
    #[TestWith(data: ['/personal_invitations'], name: '/personal_invitations')]
    #[TestWith(data: ['/activity_progress_labels'], name: '/activity_progress_labels')]
    #[TestWith(data: ['/activity_responsibles'], name: '/activity_responsibles')]
    #[TestWith(data: ['/camp_collaborations'], name: '/camp_collaborations')]
    #[TestWith(data: ['/categories'], name: '/categories')]
    #[TestWith(data: ['/checklists'], name: '/checklists')]
    #[TestWith(data: ['/checklist_items'], name: '/checklist_items')]
    #[TestWith(data: ['/content_nodes'], name: '/content_nodes')]
    #[TestWith(data: ['/content_node/checklist_nodes'], name: '/content_node/checklist_nodes')]
    #[TestWith(data: ['/content_node/column_layouts'], name: '/content_node/column_layouts')]
    #[TestWith(data: ['/content_node/material_nodes'], name: '/content_node/material_nodes')]
    #[TestWith(data: ['/content_node/multi_selects'], name: '/content_node/multi_selects')]
    #[TestWith(data: ['/content_node/storyboards'], name: '/content_node/storyboards')]
    #[TestWith(data: ['/days'], name: '/days')]
    #[TestWith(data: ['/day_responsibles'], name: '/day_responsibles')]
    #[TestWith(data: ['/material_items'], name: '/material_items')]
    #[TestWith(data: ['/material_lists'], name: '/material_lists')]
    #[TestWith(data: ['/periods'], name: '/periods')]
    #[TestWith(data: ['/profiles'], name: '/profiles')]
    #[TestWith(data: ['/schedule_entries'], name: '/schedule_entries')]
    #[TestWith(data: ['/users'], name: '/users')]
    public function testDoesNotIncludeUrls(string $url) {
        assertDoesNotMatchRegularExpression($this->cacheRegex, $url);
    }

    /**
     * Same urls as testDoesNotIncludeUrls with a query string appended: a query string must
     * not make a non-cacheable path cacheable. See testIncludesUrlsWithQueryParams for the
     * two end-anchored alternatives that are deliberately left out.
     */
    #[TestWith(data: ['/invitations?x=1'], name: '/invitations?x=1')]
    #[TestWith(data: ['/personal_invitations?x=1'], name: '/personal_invitations?x=1')]
    #[TestWith(data: ['/activity_progress_labels?x=1'], name: '/activity_progress_labels?x=1')]
    #[TestWith(data: ['/activity_responsibles?x=1'], name: '/activity_responsibles?x=1')]
    #[TestWith(data: ['/camp_collaborations?x=1'], name: '/camp_collaborations?x=1')]
    #[TestWith(data: ['/categories?x=1'], name: '/categories?x=1')]
    #[TestWith(data: ['/checklists?x=1'], name: '/checklists?x=1')]
    #[TestWith(data: ['/checklist_items?x=1'], name: '/checklist_items?x=1')]
    #[TestWith(data: ['/content_nodes?x=1'], name: '/content_nodes?x=1')]
    #[TestWith(data: ['/content_node/checklist_nodes?x=1'], name: '/content_node/checklist_nodes?x=1')]
    #[TestWith(data: ['/content_node/column_layouts?x=1'], name: '/content_node/column_layouts?x=1')]
    #[TestWith(data: ['/content_node/material_nodes?x=1'], name: '/content_node/material_nodes?x=1')]
    #[TestWith(data: ['/content_node/multi_selects?x=1'], name: '/content_node/multi_selects?x=1')]
    #[TestWith(data: ['/content_node/storyboards?x=1'], name: '/content_node/storyboards?x=1')]
    #[TestWith(data: ['/days?x=1'], name: '/days?x=1')]
    #[TestWith(data: ['/day_responsibles?x=1'], name: '/day_responsibles?x=1')]
    #[TestWith(data: ['/material_items?x=1'], name: '/material_items?x=1')]
    #[TestWith(data: ['/material_lists?x=1'], name: '/material_lists?x=1')]
    #[TestWith(data: ['/periods?x=1'], name: '/periods?x=1')]
    #[TestWith(data: ['/profiles?x=1'], name: '/profiles?x=1')]
    #[TestWith(data: ['/schedule_entries?x=1'], name: '/schedule_entries?x=1')]
    #[TestWith(data: ['/users?x=1'], name: '/users?x=1')]
    public function testDoesNotIncludeUrlsWithQueryParams(string $url) {
        assertDoesNotMatchRegularExpression($this->cacheRegex, $url);
    }
}
