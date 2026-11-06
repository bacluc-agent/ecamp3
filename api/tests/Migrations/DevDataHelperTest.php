<?php

declare(strict_types=1);

namespace App\Tests\Migrations;

use PHPUnit\Framework\TestCase;

require_once __DIR__.'/../../migrations/dev-data/helpers.php';

/**
 * @internal
 */
final class DevDataHelperTest extends TestCase {
    public function testStreamedStatementsSelectAndPreserveInsertSql(): void {
        $sql = <<<'SQL'
-- header;
CREATE TABLE `ignored` (`id` int);
INSERT INTO `first` (`text`) VALUES ('one; two'), ('it\'s; multiline
value'), ('double ''; still quoted'), ('backtick `text`');
/* ignored; semicolon */
INSERT INTO `second` (`text`) VALUES ("quoted; text"), ('escaped\'; still value');
SQL;
        $file = fopen('php://memory', 'r+');
        fwrite($file, $sql);
        rewind($file);

        self::assertSame([
            <<<'SQL'
INSERT INTO "first" ("text") VALUES ('one; two'), ('it\'s; multiline
value'), ('double ''; still quoted'), ('backtick `text`')
SQL,
            <<<'SQL'
INSERT INTO "second" ("text") VALUES ("quoted; text"), ('escaped\'; still value')
SQL,
        ], \DataMigrations\getInsertStatementsFromStream($file));
        fclose($file);
    }

    public function testPublicHelperSelectsEveryInsertFromCurrentDumpInOrder(): void {
        $statements = \DataMigrations\getStatementsForMigrationFile();
        self::assertCount(20, $statements);
        foreach ($statements as $statement) {
            self::assertMatchesRegularExpression('/^INSERT\s+INTO\s+/i', $statement);
            self::assertStringNotContainsString('`', $statement);
            self::assertFalse(str_ends_with($statement, ';'));
        }
    }

    public function testLineCommentOnNonSeekableStreamEndsBeforeNextStatement(): void {
        $sql = "--\nINSERT INTO `after_comment` (`value`) VALUES ('included');";
        [$reader, $writer] = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
        fwrite($writer, $sql);
        fclose($writer);

        self::assertFalse(stream_get_meta_data($reader)['seekable']);
        self::assertSame([$sql], iterator_to_array(\DataMigrations\getSqlStatements($reader), false));
        fclose($reader);

        [$reader, $writer] = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, STREAM_IPPROTO_IP);
        fwrite($writer, $sql);
        fclose($writer);
        self::assertSame(
            ["INSERT INTO \"after_comment\" (\"value\") VALUES ('included')"],
            \DataMigrations\getInsertStatementsFromStream($reader),
        );
        fclose($reader);
    }

    public function testCurrentDumpContainsExpectedInsertSelection(): void {
        $file = fopen(__DIR__.'/../../migrations/dev-data/data.sql', 'rb');
        $statements = \DataMigrations\getInsertStatementsFromStream($file);
        self::assertCount(20, $statements);
        self::assertStringStartsWith('INSERT INTO ', $statements[0]);
        fclose($file);
    }

    public function testScaledDumpFits124MegabytesWhenParsedIncrementally(): void {
        $source = file_get_contents(__DIR__.'/../../migrations/dev-data/data.sql');
        $directory = sys_get_temp_dir().'/dev-data-'.bin2hex(random_bytes(8));
        mkdir($directory);
        $path = $directory.'/data.sql';
        file_put_contents($path, str_repeat($source, 8));
        copy(__DIR__.'/../../migrations/dev-data/helpers.php', $directory.'/helpers.php');
        $autoload = realpath(__DIR__.'/../../vendor/autoload.php');
        $helper = realpath($directory.'/helpers.php');
        $streamed = "require '{$autoload}'; require '{$helper}'; "
            .'$statements = \DataMigrations\getStatementsForMigrationFile(); '
            .'echo memory_get_peak_usage(true); '
            .'exit(count($statements) === 160 ? 0 : 1);';
        $legacy = "require '{$autoload}'; "
            .'$sql = file_get_contents($argv[1]); '
            .'new \PhpMyAdmin\SqlParser\Parser($sql);';

        try {
            [$streamed_status, $peak_memory] = $this->runPhpWithMemoryLimit($streamed, $path);
            self::assertSame(0, $streamed_status);
            self::assertLessThan(124 * 1024 * 1024, (int) $peak_memory);
            [$legacy_status, , $legacy_error] = $this->runPhpWithMemoryLimit($legacy, $path);
            self::assertNotSame(0, $legacy_status);
            self::assertStringContainsString('Allowed memory size', $legacy_error);
        } finally {
            unlink($directory.'/helpers.php');
            unlink($path);
            rmdir($directory);
        }
    }

    private function runPhpWithMemoryLimit(string $script, string $path): array {
        $process = proc_open(
            [PHP_BINARY, '-d', 'memory_limit=124M', '-r', $script, $path],
            [1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes,
        );
        $output = stream_get_contents($pipes[1]);
        $error = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        return [proc_close($process), $output, $error];
    }
}
