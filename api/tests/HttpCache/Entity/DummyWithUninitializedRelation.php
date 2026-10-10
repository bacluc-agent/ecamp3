<?php

declare(strict_types=1);

namespace App\Tests\HttpCache\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
class DummyWithUninitializedRelation extends BaseEntity {
    public RelatedDummy $relatedDummy;
}
