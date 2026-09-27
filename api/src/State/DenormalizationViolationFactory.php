<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\DenormalizationViolationFactoryInterface;
use ApiPlatform\Symfony\Validator\ValidationGroupsGeneratorInterface;
use ApiPlatform\Validator\Exception\ValidationException;
use Symfony\Component\Serializer\Exception\NotNormalizableValueException;
use Symfony\Component\Serializer\Exception\PartialDenormalizationException;
use Symfony\Component\Validator\Constraints\GroupSequence;
use Symfony\Component\Validator\Constraints\Type;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationInterface;
use Symfony\Component\Validator\ConstraintViolationList;

/**
 * api-platform/validator hands operation.validationContext['groups'] straight to
 * DenormalizationViolationFactory::collectConstraints(..., ?array $validationGroups),
 * while api-platform/symfony's Validator resolves that same value from a
 * ValidationGroupsGeneratorInterface service into a GroupSequence. An operation that
 * names its groups by such a class therefore validates correctly and still answers
 * HTTP 500 with a TypeError for every denormalization violation, because TypeError is
 * absent from the exception_to_status map. Resolve the class to the groups it yields
 * for the error path only, leaving the operation's group sequence intact.
 *
 * The decorated factory also demotes every denormalization failure to its generic
 * Type message, which throws away the reason the serializer gave ("Parsing datetime
 * string ... at position 4: ...") and leaves the user with "This value should be of
 * type string." even though the value is a string. That reason survives only as
 * parameters['hint'], which the error provider copies into i18n but never renders.
 * Put the serializer's own message back, scoped to the three date diagnostics
 * DateTimeNormalizer raises and only onto Type::INVALID_TYPE_ERROR violations, so
 * NotNull, NotBlank and every other violation keep the validator's wording.
 */
class DenormalizationViolationFactory implements DenormalizationViolationFactoryInterface {
    public function __construct(private readonly DenormalizationViolationFactoryInterface $decorated) {}

    public function handle(NotNormalizableValueException|PartialDenormalizationException $exception, Operation $operation): void {
        $groups = ($operation->getValidationContext() ?? [])['groups'] ?? null;

        if (\is_string($groups) && is_a($groups, ValidationGroupsGeneratorInterface::class, true) && null !== $class = $operation->getClass()) {
            $groups = (new $groups())(new $class());
            $operation = $operation->withValidationContext([
                ...($operation->getValidationContext() ?? []),
                'groups' => $groups instanceof GroupSequence ? $groups->groups : $groups,
            ]);
        }

        try {
            $this->decorated->handle($exception, $operation);
        } catch (ValidationException $validationException) {
            $dateMessages = $this->dateMessages($exception);
            if ([] === $dateMessages) {
                throw $validationException;
            }

            $violations = new ConstraintViolationList();
            foreach ($validationException->getConstraintViolationList() as $violation) {
                $pathMessages = $dateMessages[$violation->getPropertyPath()] ?? [];
                $message = Type::INVALID_TYPE_ERROR === $violation->getCode() ? array_shift($pathMessages) : null;
                $violations->add(null === $message ? $violation : $this->withMessage($violation, $message));
            }

            throw new ValidationException($violations);
        }
    }

    private function dateMessages(NotNormalizableValueException|PartialDenormalizationException $exception): array {
        $errors = $exception instanceof NotNormalizableValueException
            ? [$exception]
            : $exception->getNotNormalizableValueErrors();
        $messages = [];

        foreach ($errors as $error) {
            // ponytail: the whitelist matches a Symfony message wording and the PHP minor version; delete it
            // together with the message half of this decorator once api-platform renders parameters['hint'].
            if ($error instanceof NotNormalizableValueException && (str_starts_with($error->getMessage(), 'Parsing datetime string ') || str_starts_with($error->getMessage(), 'Failed to parse time string ') || str_starts_with($error->getMessage(), 'The data is either not an string'))) {
                $messages[$error->getPath()][] = $error->getMessage();
            }
        }

        return $messages;
    }

    private function withMessage(ConstraintViolationInterface $violation, string $message): ConstraintViolation {
        return new ConstraintViolation(
            $message,
            $message,
            $violation->getParameters(),
            $violation->getRoot(),
            $violation->getPropertyPath(),
            $violation->getInvalidValue(),
            $violation->getPlural(),
            $violation->getCode(),
            $violation->getConstraint(),
        );
    }
}
