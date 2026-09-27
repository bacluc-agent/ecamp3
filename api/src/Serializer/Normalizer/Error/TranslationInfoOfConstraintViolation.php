<?php

namespace App\Serializer\Normalizer\Error;

use Symfony\Component\Validator\ConstraintViolationInterface;

class TranslationInfoOfConstraintViolation {
    public function extract(ConstraintViolationInterface $constraintViolation): TranslationInfo {
        $constraint = $constraintViolation->getConstraint();
        $constraintClass = null !== $constraint ? $constraint::class : self::class;
        $key = str_replace('\\', '.', $constraintClass);
        $key = strtolower($key);
        $paramsWithoutCurlyBraces = self::removeCurlyBraces($constraintViolation->getParameters());

        return new TranslationInfo($key, $paramsWithoutCurlyBraces);
    }

    /**
     * @psalm-suppress InvalidReturnType
     * @psalm-suppress InvalidReturnStatement
     */
    public static function removeCurlyBraces(array $parameters): array {
        $paramsWithoutCurlyBraces = [];
        foreach ($parameters as $key => $value) {
            /** @var int|string $key */
            /** @phpstan-ignore varTag.nativeType */
            $key = str_replace('{{ ', '', $key);
            $key = str_replace(' }}', '', $key);
            $paramsWithoutCurlyBraces[$key] = $value;
        }

        return $paramsWithoutCurlyBraces;
    }
}
