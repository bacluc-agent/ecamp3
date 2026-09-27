<?php

namespace App\Tests\InputFilter;

use App\InputFilter\CleanHTMLFilter;
use App\InputFilter\InputFilter;
use App\InputFilter\UnexpectedValueException;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * @internal
 */
class CleanHTMLFilterTest extends KernelTestCase {
    private ?InputFilter $inputFilter = null;

    public function setUp(): void {
        parent::setUp();

        $purifierMock = $this->createStub(\HTMLPurifier::class);
        $purifierMock->method('purify')->willReturnArgument(0);

        $this->inputFilter = new CleanHTMLFilter($purifierMock);
    }

    #[DataProvider('getExamples')]
    public function testInputFiltering(string $input, string $output) {
        // given
        $data = ['key' => $input];
        $outputData = ['key' => $output];

        // For this test, use a real purifier, so we can check that the
        // purifier is configured correctly
        static::bootKernel();
        $this->inputFilter = static::getContainer()->get(CleanHTMLFilter::class);

        // when
        $result = $this->inputFilter->applyTo($data, 'key');

        // then
        $this->assertSame($outputData, $result);
    }

    public static function getExamples(): \Iterator {
        yield ['', ''];

        yield ['abc', 'abc'];

        yield ['<b>abc</b>', '<b>abc</b>'];

        yield ['<3', '&lt;3'];

        yield ['<script>alert(1)</script>', ''];

        yield ['<span onload="alert(1)">123</span>', '<span>123</span>'];

        yield ['abc<li>def', 'abcdef'];
    }

    public function testDoesNothingWhenKeyIsMissing() {
        // given
        $data = ['otherkey' => 'something'];

        // when
        $result = $this->inputFilter->applyTo($data, 'key');

        // then
        $this->assertSame($data, $result);
    }

    public function testDoesNothingWhenValueIsNull() {
        // given
        $data = ['key' => null];

        // when
        $result = $this->inputFilter->applyTo($data, 'key');

        // then
        $this->assertEquals($data, $result);
    }

    public function testThrowsWhenValueIsNotStringable() {
        // given
        $data = ['key' => new \stdClass()];

        // then
        $this->expectException(UnexpectedValueException::class);

        // when
        $this->inputFilter->applyTo($data, 'key');
    }
}
