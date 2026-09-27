<?php

declare(strict_types=1);

namespace App\Entity;

interface HasParentInterface extends HasId {
    public function getParent(): ?HasParentInterface;
}
