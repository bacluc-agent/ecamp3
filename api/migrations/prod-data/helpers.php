<?php

namespace DataMigrations;

require_once __DIR__.'/../SqlStatementHelper.php';

function getStatementsForMigrationFile(): array {
    return \Migrations\Sql\getStatementsForMigrationFile(__DIR__.'/data.sql');
}
