<?php

namespace DataMigrations;

use PhpMyAdmin\SqlParser\Parser;
use PhpMyAdmin\SqlParser\Statements\InsertStatement;

function createTruncateDatabaseCommand(): string {
    return "
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (
                    SELECT tablename 
                    FROM pg_tables 
                    WHERE 
                        schemaname = current_schema() 
                        AND tablename != 'doctrine_migration_versions'
                        AND tablename != 'content_type') 
                LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
        ";
}

function getStatementsForMigrationFile(): array {
    $dump_file = __DIR__.'/data.sql';
    $sql = file_get_contents($dump_file);

    $parser = new Parser($sql);
    $parsed_statements = [];
    foreach ($parser->statements as $statement) {
        $parsed_statements[] = $statement->build();
    }

    array_unshift($parsed_statements, 'SET session_replication_role = replica;');
    $parsed_statements[] = 'SET session_replication_role = DEFAULT;';

    return str_replace('`', '"', $parsed_statements);
}
