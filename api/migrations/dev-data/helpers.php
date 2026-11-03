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
    $file = fopen($dump_file, 'rb');
    if (false === $file) {
        throw new \RuntimeException('Unable to open dev data dump');
    }

    try {
        return getInsertStatementsFromStream($file);
    } finally {
        fclose($file);
    }
}

function getInsertStatementsFromStream($file): array {
    $parsed_statements = [];
    foreach (getSqlStatements($file) as $sql) {
        $parser = new Parser($sql);
        foreach ($parser->statements as $statement) {
            if ($statement instanceof InsertStatement) {
                $parsed_statements[] = str_replace('`', '"', $statement->build());
            }
        }
    }

    return $parsed_statements;
}

function getSqlStatements($file): \Generator {
    $statement = '';
    $quote = null;
    $escaped = false;
    $line_comment = false;
    $block_comment = false;
    $previous = '';

    while (($character = fgetc($file)) !== false) {
        $statement .= $character;

        if ($line_comment) {
            if ("\n" === $character) {
                $line_comment = false;
            }
        } elseif ($block_comment) {
            if ('*' === $previous && '/' === $character) {
                $block_comment = false;
            }
        } elseif (null !== $quote) {
            if ($escaped) {
                $escaped = false;
            } elseif ('\\' === $character) {
                $escaped = true;
            } elseif ($character === $quote) {
                $quote = null;
            }
        } elseif ("'" === $character || '"' === $character || '`' === $character) {
            $quote = $character;
        } elseif ('/' === $previous && '*' === $character) {
            $block_comment = true;
        } elseif ('-' === $previous && '-' === $character) {
            $next = fgetc($file);
            if (false !== $next) {
                fseek($file, -1, SEEK_CUR);
            }
            $line_comment = false === $next || ord($next) <= 32;
        } elseif ('#' === $character) {
            $line_comment = true;
        } elseif (';' === $character) {
            yield $statement;
            $statement = '';
        }

        $previous = $character;
    }

    if ('' !== trim($statement)) {
        yield $statement;
    }
}
