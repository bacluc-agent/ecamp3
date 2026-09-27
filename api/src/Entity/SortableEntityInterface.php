<?php

declare(strict_types=1);

namespace App\Entity;

interface SortableEntityInterface {
    public function getPosition(): int;

    public function setPosition(int $position): void;
}
