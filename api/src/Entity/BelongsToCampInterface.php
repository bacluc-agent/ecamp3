<?php

declare(strict_types=1);

namespace App\Entity;

interface BelongsToCampInterface {
    public function getCamp(): ?Camp;
}
