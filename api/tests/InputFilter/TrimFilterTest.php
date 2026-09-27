<?php

namespace App\Tests\InputFilter;

use App\InputFilter\TrimFilter;
use App\InputFilter\UnexpectedValueException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
class TrimFilterTest extends TestCase {
    #[DataProvider('getExamples')]
    public function testInputFiltering(string $input, string $output) {
        // given
        $data = ['key' => $input];
        $outputData = ['key' => $output];
        $trim = new TrimFilter();

        // when
        $result = $trim->applyTo($data, 'key');

        // then
        $this->assertSame($outputData, $result);
    }

    public static function getExamples(): \Iterator {
        yield ['', ''];

        yield ['abc', 'abc'];

        yield [' abc', 'abc'];

        yield ['abc def', 'abc def'];

        yield ['abc ', 'abc'];

        yield ["\tabc", 'abc'];

        yield ['  abc', 'abc'];

        yield ["\t abc ", 'abc'];
    }

    public function testDoesNothingWhenKeyIsMissing() {
        // given
        $data = ['otherkey' => 'something'];
        $trim = new TrimFilter();

        // when
        $result = $trim->applyTo($data, 'key');

        // then
        $this->assertSame($data, $result);
    }

    public function testDoesNothingWhenValueIsNull() {
        // given
        $data = ['key' => null];
        $trim = new TrimFilter();

        // when
        $result = $trim->applyTo($data, 'key');

        // then
        $this->assertEquals($data, $result);
    }

    public function testThrowsWhenValueIsNotStringable() {
        // given
        $data = ['key' => new \stdClass()];
        $trim = new TrimFilter();

        // then
        $this->expectException(UnexpectedValueException::class);

        // when
        $trim->applyTo($data, 'key');
    }
}
