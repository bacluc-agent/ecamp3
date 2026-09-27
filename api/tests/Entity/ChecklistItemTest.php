<?php

namespace App\Tests\Entity;

use App\Entity\Camp;
use App\Entity\Checklist;
use App\Entity\ChecklistItem;
use App\Util\EntityMap;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
class ChecklistItemTest extends TestCase {
    private Camp $camp;
    private Checklist $checklist;
    private ChecklistItem $itemPrototype1;
    private ChecklistItem $itemPrototype2;
    private ChecklistItem $itemPrototype3;

    public function setUp(): void {
        $this->camp = new Camp();
        $this->checklist = new Checklist();
        $this->checklist->name = 'checklist1';
        $this->camp->addChecklist($this->checklist);

        $this->itemPrototype1 = new ChecklistItem();
        $this->itemPrototype1->text = 'item1';
        $this->itemPrototype1->position = 0;
        $this->checklist->addChecklistItem($this->itemPrototype1);
        $this->itemPrototype2 = new ChecklistItem();
        $this->itemPrototype2->text = 'item2';
        $this->itemPrototype2->position = 1;
        $this->checklist->addChecklistItem($this->itemPrototype2);
        $this->itemPrototype3 = new ChecklistItem();
        $this->itemPrototype3->text = 'item3';
        $this->itemPrototype3->position = 1337;
        $this->itemPrototype2->addChild($this->itemPrototype3);
    }

    public function testCopyFromPrototypeCopiesTextAndPosition() {
        // given
        $copiedChecklist = new Checklist();

        // when
        $copiedChecklist->copyFromPrototype($this->checklist, new EntityMap($this->camp));

        // then
        $this->assertCount(3, $copiedChecklist->getChecklistItems());
        $item1 = $copiedChecklist->getChecklistItems()[0];
        $item2 = $copiedChecklist->getChecklistItems()[1];
        $this->assertEquals($this->itemPrototype1->text, $item1->text);
        $this->assertEquals($this->itemPrototype1->position, $item1->position);
        $this->assertEquals($this->itemPrototype2->text, $item2->text);
        $this->assertEquals($this->itemPrototype2->position, $item2->position);
        $this->assertCount(1, $item2->getChildren());
        $item3 = $item2->getChildren()[0];
        $this->assertEquals($item2, $item3->parent);
        $this->assertEquals($this->itemPrototype3->text, $item3->text);
        $this->assertEquals($this->itemPrototype3->position, $item3->position);
    }
}
