<?php

declare(strict_types=1);

namespace Migrations\Sql;

/**
 * Dependency-free helper for splitting SQL migration files into individual statements.
 */
class SqlStatementHelper {
    /**
     * Read an SQL file and return an ordered list of executable SQL statements.
     *
     * @return string[]
     */
    public static function getStatementsForMigrationFile(string $sqlFile): array {
        return getStatementsForMigrationFile($sqlFile);
    }
}

/**
 * Read an SQL file and return an ordered list of executable SQL statements.
 *
 * Statements are split on semicolons while preserving semicolons inside
 * single-quoted strings. "--" line comments and blank lines are ignored.
 * MySQL-style backtick identifiers are normalized to PostgreSQL double quotes.
 *
 * @return string[]
 */
function getStatementsForMigrationFile(string $sqlFile): array {
    $sql = file_get_contents($sqlFile);
    if (false === $sql) {
        return [];
    }

    $statements = [];
    $current = '';
    $inSingleQuote = false;
    $inLineComment = false;
    $inBlockComment = false;
    $length = strlen($sql);

    for ($i = 0; $i < $length; ++$i) {
        $char = $sql[$i];
        $next = $i + 1 < $length ? $sql[$i + 1] : '';

        if ($inLineComment) {
            if ("\n" === $char) {
                $inLineComment = false;
                $current .= $char;
            }

            continue;
        }

        if ($inBlockComment) {
            if ('*' === $char && '/' === $next) {
                $inBlockComment = false;
                ++$i;
            }

            continue;
        }

        if (!$inSingleQuote) {
            if ('-' === $char && '-' === $next) {
                $inLineComment = true;
                ++$i;

                continue;
            }
            if ('/' === $char && '*' === $next) {
                $inBlockComment = true;
                ++$i;

                continue;
            }
        }

        if ("'" === $char) {
            $current .= $char;
            if ($inSingleQuote) {
                if ("'" === $next) {
                    $current .= $next;
                    ++$i;
                } else {
                    $inSingleQuote = false;
                }
            } else {
                $inSingleQuote = true;
            }

            continue;
        }

        if (!$inSingleQuote && ';' === $char) {
            $statement = trim($current);
            if ('' !== $statement) {
                $statement = rtrim($statement);
                if (',' === substr($statement, -1)) {
                    $statement = substr($statement, 0, -1);
                }
                $statements[] = str_replace('`', '"', $statement);
            }
            $current = '';

            continue;
        }

        $current .= $char;
    }

    $statement = trim($current);
    if ('' !== $statement) {
        $statement = rtrim($statement);
        if (',' === substr($statement, -1)) {
            $statement = substr($statement, 0, -1);
        }
        $statements[] = str_replace('`', '"', $statement);
    }

    return array_values(array_filter($statements, static fn (string $s): bool => '' !== trim($s)));
}
