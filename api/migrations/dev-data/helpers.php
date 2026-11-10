<?php

namespace DataMigrations;

require_once __DIR__.'/../SqlStatementHelper.php';

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
    return \Migrations\Sql\getStatementsForMigrationFile(__DIR__.'/data.sql');
}
