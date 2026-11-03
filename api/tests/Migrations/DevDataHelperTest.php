<?php

declare(strict_types=1);

namespace App\Tests\Migrations;

use PhpMyAdmin\SqlParser\Parser;
use PhpMyAdmin\SqlParser\Statements\InsertStatement;
use PHPUnit\Framework\TestCase;

require_once __DIR__.'/../../migrations/dev-data/helpers.php';

/**
 * @internal
 */
final class DevDataHelperTest extends TestCase {
    public function testStreamedStatementsMatchParserOutputInOrder(): void {
        $sql = <<<'SQL'
-- header;
INSERT INTO `first` (`text`) VALUES ('one; two'), ('it\'s; multiline
value'), ('double '' quote');
/* ignored; semicolon */
INSERT INTO `second` (`text`) VALUES ("quoted; text");
SQL;
        $file = fopen('php://memory', 'r+');
        fwrite($file, $sql);
        rewind($file);

        $expected = [];
        foreach ((new Parser($sql))->statements as $statement) {
            if ($statement instanceof InsertStatement) {
                $expected[] = str_replace('`', '"', $statement->build());
            }
        }

        self::assertSame($expected, \DataMigrations\getInsertStatementsFromStream($file));
        fclose($file);
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
            ['INSERT INTO "after_comment"("value") VALUES (\'included\')'],
            \DataMigrations\getInsertStatementsFromStream($reader),
        );
        fclose($reader);
    }

    public function testCurrentDumpMatchesSinglePassParserOutput(): void {
        $sql = file_get_contents(__DIR__.'/../../migrations/dev-data/data.sql');
        $file = fopen(__DIR__.'/../../migrations/dev-data/data.sql', 'rb');
        $expected = [];
        foreach ((new Parser($sql))->statements as $statement) {
            if ($statement instanceof InsertStatement) {
                $expected[] = str_replace('`', '"', $statement->build());
            }
        }

        self::assertSame($expected, \DataMigrations\getInsertStatementsFromStream($file));
        fclose($file);
    }

    public function testScaledDumpFits124MegabytesWhenParsedIncrementally(): void {
        $source = file_get_contents(__DIR__.'/../../migrations/dev-data/data.sql');
        $path = tempnam(sys_get_temp_dir(), 'dev-data-');
        file_put_contents($path, str_repeat($source, 8));
        $autoload = realpath(__DIR__.'/../../vendor/autoload.php');
        $helper = realpath(__DIR__.'/../../migrations/dev-data/helpers.php');
        $streamed = "require '{$autoload}'; require '{$helper}'; "
            .'$file = fopen($argv[1], \'rb\'); '
            .'exit(count(\DataMigrations\getInsertStatementsFromStream($file)) === 160 ? 0 : 1);';
        $legacy = "require '{$autoload}'; "
            .'$sql = file_get_contents($argv[1]); '
            .'new \PhpMyAdmin\SqlParser\Parser($sql);';

        try {
            self::assertSame(0, $this->runPhpWithMemoryLimit($streamed, $path)[0]);
            [$legacy_status, $legacy_error] = $this->runPhpWithMemoryLimit($legacy, $path);
            self::assertNotSame(0, $legacy_status);
            self::assertStringContainsString('Allowed memory size', $legacy_error);
        } finally {
            unlink($path);
        }
    }

    private function runPhpWithMemoryLimit(string $script, string $path): array {
        $process = proc_open(
            [PHP_BINARY, '-d', 'memory_limit=124M', '-r', $script, $path],
            [1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes,
        );
        stream_get_contents($pipes[1]);
        $error = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        return [proc_close($process), $error];
    }
}
