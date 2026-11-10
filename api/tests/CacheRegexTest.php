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

    #[TestWith(data: ['/content_types?name=Checklist'], name: '/content_types?name=Checklist')]
    #[TestWith(data: ['/camps/25a82475e0b7/categories?camp=camps/25a82475e0b7'], name: '/camps/25a82475e0b7/categories?camp=camps/25a82475e0b7')]
    #[TestWith(data: ['/periods/25a82475e0b7/schedule_entries?start[before]=2031-01-25'], name: '/periods/25a82475e0b7/schedule_entries?start[before]=2031-01-25')]
    #[TestWith(data: ['/camps/25a82475e0b7/activities?camp=%2Fcamps%2F25a82475e0b7&order[id]=asc'], name: '/camps/25a82475e0b7/activities?camp=%2Fcamps%2F25a82475e0b7&order[id]=asc')]
    #[TestWith(data: ['/camps/25a82475e0b7/checklists?camp=camps/25a82475e0b7'], name: '/camps/25a82475e0b7/checklists?camp=camps/25a82475e0b7')]
    #[TestWith(data: ['/activities/25a82475e0b7?camp=camps/25a82475e0b7'], name: '/activities/25a82475e0b7?camp=camps/25a82475e0b7')]
    #[TestWith(data: ['/periods/25a82475e0b7/days?period.camp=camps/25a82475e0b7'], name: '/periods/25a82475e0b7/days?period.camp=camps/25a82475e0b7')]
    #[TestWith(data: ['/camps/25a82475e0b7/categories/c53dd7917e63?camp=camps/25a82475e0b7'], name: '/camps/25a82475e0b7/categories/c53dd7917e63?camp=camps/25a82475e0b7')]
    public function testIncludesUrlsWithQueryParams(string $url) {
        assertMatchesRegularExpression($this->cacheRegex, $url);
    }

    #[TestWith(data: ['/camps/25a82475e0b7/categories/c53dd7917e63'], name: '/camps/25a82475e0b7/categories/c53dd7917e63')]
    public function testAlsoIncludesUrls(string $url) {
        assertMatchesRegularExpression($this->cacheRegex, $url);
    }

    #[TestWith(data: ['/invitations?x=y'], name: '/invitations?x=y')]
    #[TestWith(data: ['/personal_invitations?x=y'], name: '/personal_invitations?x=y')]
    #[TestWith(data: ['/activity_progress_labels?x=y'], name: '/activity_progress_labels?x=y')]
    #[TestWith(data: ['/activity_responsibles?x=y'], name: '/activity_responsibles?x=y')]
    #[TestWith(data: ['/camp_collaborations?x=y'], name: '/camp_collaborations?x=y')]
    #[TestWith(data: ['/categories?x=y'], name: '/categories?x=y')]
    #[TestWith(data: ['/checklists?x=y'], name: '/checklists?x=y')]
    #[TestWith(data: ['/checklist_items?x=y'], name: '/checklist_items?x=y')]
    #[TestWith(data: ['/content_nodes?x=y'], name: '/content_nodes?x=y')]
    #[TestWith(data: ['/content_node/checklist_nodes?x=y'], name: '/content_node/checklist_nodes?x=y')]
    #[TestWith(data: ['/content_node/column_layouts?x=y'], name: '/content_node/column_layouts?x=y')]
    #[TestWith(data: ['/content_node/material_nodes?x=y'], name: '/content_node/material_nodes?x=y')]
    #[TestWith(data: ['/content_node/multi_selects?x=y'], name: '/content_node/multi_selects?x=y')]
    #[TestWith(data: ['/content_node/storyboards?x=y'], name: '/content_node/storyboards?x=y')]
    #[TestWith(data: ['/days?x=y'], name: '/days?x=y')]
    #[TestWith(data: ['/day_responsibles?x=y'], name: '/day_responsibles?x=y')]
    #[TestWith(data: ['/material_items?x=y'], name: '/material_items?x=y')]
    #[TestWith(data: ['/material_lists?x=y'], name: '/material_lists?x=y')]
    #[TestWith(data: ['/periods?x=y'], name: '/periods?x=y')]
    #[TestWith(data: ['/profiles?x=y'], name: '/profiles?x=y')]
    #[TestWith(data: ['/schedule_entries?x=y'], name: '/schedule_entries?x=y')]
    #[TestWith(data: ['/users?x=y'], name: '/users?x=y')]
    public function testDoesNotIncludeUrls(string $url) {
        assertDoesNotMatchRegularExpression($this->cacheRegex, $url);
    }
}
