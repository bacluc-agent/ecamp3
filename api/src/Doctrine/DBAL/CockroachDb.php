<?php

declare(strict_types=1);

namespace App\Doctrine\DBAL;

use Doctrine\DBAL\Connection;

final class CockroachDb {
    public static function is(Connection $connection): bool {
        return str_contains(strtolower((string) $connection->fetchOne('SELECT version()')), 'cockroachdb');
    }
}
