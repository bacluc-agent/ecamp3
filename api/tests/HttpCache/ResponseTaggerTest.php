<?php

namespace App\Tests\HttpCache;

use App\HttpCache\ResponseTagger;
use FOS\HttpCacheBundle\Http\SymfonyResponseTagger;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

use function PHPUnit\Framework\never;
use function PHPUnit\Framework\once;

/**
 * @internal
 */
#[AllowMockObjectsWithoutExpectations]
class ResponseTaggerTest extends TestCase {
    private const MATCH_PATH = '^/?($|index.jsonhal$|content_types|camps/[0-9a-f]*/categories|periods/[0-9a-f]*/schedule_entries|camps/[0-9a-f]*/activities|camps/[0-9a-f]*/checklists|activities/[0-9a-f]*|periods/[0-9a-f]*/days)';

    private MockObject&SymfonyResponseTagger $responseTagger;

    protected function setUp(): void {
        $this->responseTagger = $this->createMock(SymfonyResponseTagger::class);
    }

    public function testAddsTagsForCollectionUrlWithQueryString() {
        $this->responseTagger
            ->expects(once())
            ->method('addTags')
            ->with(['/camps/70ca971c992f/activities'])
        ;

        $this->createTagger('/camps/70ca971c992f/activities?name=Snow')
            ->addTags(['/camps/70ca971c992f/activities'])
        ;
    }

    public function testAddsTagsForIndexJsonhalWithQueryString() {
        $this->responseTagger
            ->expects(once())
            ->method('addTags')
            ->with(['/index'])
        ;

        $this->createTagger('/index.jsonhal?x=y')
            ->addTags(['/index'])
        ;
    }

    public function testDoesNotAddTagsForNonCacheableUrlWithQueryString() {
        $this->responseTagger
            ->expects(never())
            ->method('addTags')
        ;

        $this->createTagger('/invitations?x=y')
            ->addTags(['/invitations'])
        ;
    }

    private function createTagger(string $requestUri): ResponseTagger {
        $requestStack = new RequestStack();
        $requestStack->push(Request::create($requestUri));

        return new ResponseTagger(self::MATCH_PATH, $this->responseTagger, $requestStack);
    }
}
