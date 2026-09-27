<?php

declare(strict_types=1);

namespace App\DTO;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Post;
use ApiPlatform\OpenApi\Model\Operation as OpenApiOperation;
use App\InputFilter;
use App\State\ResendActivationProcessor;
use Symfony\Component\Serializer\Attribute\Groups;

#[ApiResource(
    operations: [
        new Post(
            uriTemplate: '/resend_activation{._format}',
            status: 204,
            openapi: new OpenApiOperation(summary: 'Request activation email again', description: 'Activation email will be sent to the given email again.'),
            denormalizationContext: ['groups' => ['create']],
            security: 'true',
            output: false,
            processor: ResendActivationProcessor::class
        ),
    ],
    routePrefix: '/auth'
)]
class UserActivation {
    #[InputFilter\Trim]
    #[ApiProperty(readable: false, writable: true)]
    #[Groups(['create'])]
    public ?string $email = null;

    #[ApiProperty(readable: false, writable: true)]
    #[Groups(['create'])]
    public ?string $recaptchaToken = null;
}
