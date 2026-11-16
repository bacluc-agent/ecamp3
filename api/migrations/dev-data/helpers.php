<?php

namespace DataMigrations;

use PhpMyAdmin\SqlParser\Parser;

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
    $statements = [];
    foreach ($parser->statements as $statement) {
        $raw = '';
        for ($i = $statement->first; $i <= $statement->last; $i++) {
            $raw .= $parser->list->tokens[$i]->token;
        }
        $raw = trim($raw);
        // strip trailing semicolon
        $raw = rtrim($raw, "; \t\n\r");
        $raw = trim($raw);
        if ($raw !== '') {
            $statements[] = $raw;
        }
    }

    return $statements;
}
