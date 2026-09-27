<?php

namespace App\Tests\Serializer\Normalizer\Error;

use App\Entity\CampCollaboration;
use App\Serializer\Normalizer\Error\TranslationInfoOfConstraintViolation;
use App\Validator\AllowTransition\AssertAllowTransitions;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\ConstraintViolation;

use function PHPUnit\Framework\assertThat;
use function PHPUnit\Framework\equalTo;

/**
 * @internal
 */
class TranslationInfoOfConstraintViolationTest extends TestCase {
    private TranslationInfoOfConstraintViolation $translationInfoOfConstraintViolation;

    protected function setUp(): void {
        $this->translationInfoOfConstraintViolation = new TranslationInfoOfConstraintViolation();
    }

    #[DataProvider('constraintViolations')]
    public function testExtractsTranslationInfoFromConstraintViolation(ConstraintViolation $violation, string $key): void {
        $translationInfo = $this->translationInfoOfConstraintViolation->extract($violation);
        $parametersWithoutCurlyBraces = TranslationInfoOfConstraintViolation::removeCurlyBraces($violation->getParameters());

        assertThat($translationInfo->key, equalTo($key));
        assertThat($translationInfo->parameters, equalTo($parametersWithoutCurlyBraces));
    }

    public static function constraintViolations(): \Iterator {
        yield AssertAllowTransitions::class => [
            new ConstraintViolation(
                message: 'value must be one of inactive, was established',
                messageTemplate: 'value must be one of {{ to }}, was {{ value }}',
                parameters: ['{{ to }}' => 'inactive', '{{ value }}' => 'established'],
                root: new CampCollaboration(),
                propertyPath: 'status',
                invalidValue: 'established',
                plural: null,
                code: null,
                constraint: new AssertAllowTransitions(transitions: [])
            ),
            'app.validator.allowtransition.assertallowtransitions',
        ];

        yield NotBlank::class => [
            new ConstraintViolation(
                message: 'This value should not be blank.',
                messageTemplate: 'This value should not be blank.',
                parameters: ['{{ value }}' => '""'],
                root: new CampCollaboration(),
                propertyPath: 'name',
                invalidValue: '',
                plural: null,
                code: 'c1051bb4-d103-4f74-8988-acbcafc7fdc3',
                constraint: new NotBlank()
            ),
            'symfony.component.validator.constraints.notblank',
        ];

        yield NotBlank::class.' without parameters' => [
            new ConstraintViolation(
                message: 'This value should not be blank.',
                messageTemplate: 'This value should not be blank.',
                parameters: [],
                root: new CampCollaboration(),
                propertyPath: 'name',
                invalidValue: '',
                plural: null,
                code: 'c1051bb4-d103-4f74-8988-acbcafc7fdc3',
                constraint: new NotBlank()
            ),
            'symfony.component.validator.constraints.notblank',
        ];
    }
}
