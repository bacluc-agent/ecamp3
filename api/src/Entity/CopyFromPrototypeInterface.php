<?php

declare(strict_types=1);

namespace App\Entity;

interface CopyFromPrototypeInterface {
    public function copyFromPrototype($prototype, $entityMap): void;
}
