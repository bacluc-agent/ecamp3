<?php

declare(strict_types=1);

namespace App\Entity;

use App\Entity\ContentNode\ColumnLayout;

interface BelongsToContentNodeTreeInterface {
    public function getRoot(): ?ColumnLayout;
}
