<?php

declare(strict_types=1);

namespace App\Tests\HttpCache;

use App\HttpCache\ResponseTagger;
use FOS\HttpCacheBundle\Http\SymfonyResponseTagger;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * @internal
 */
class ResponseTaggerTest extends TestCase {
    private const MATCH_PATH = '^/?($|index.jsonhal$|content_types|camps/[0-9a-f]*/categories|periods/[0-9a-f]*/schedule_entries|camps/[0-9a-f]*/activities|camps/[0-9a-f]*/checklists|activities/[0-9a-f]*|periods/[0-9a-f]*/days)';

    public function testAddsTagsForQueryVariantOfEndAnchoredPath(): void {
        $tagger = $this->createMock(SymfonyResponseTagger::class);
        $tagger->expects($this->once())->method('addTags')->with(['tag']);

        $this->createResponseTagger($tagger, Request::create('/index.jsonhal?x=1'))->addTags(['tag']);
    }

    public function testAddsTagsForRootQueryVariant(): void {
        $tagger = $this->createMock(SymfonyResponseTagger::class);
        $tagger->expects($this->once())->method('addTags')->with(['tag']);

        $this->createResponseTagger($tagger, Request::create('/?x=1'))->addTags(['tag']);
    }

    public function testDoesNotAddTagsForNonCacheablePath(): void {
        $tagger = $this->createMock(SymfonyResponseTagger::class);
        $tagger->expects($this->never())->method('addTags');

        $this->createResponseTagger($tagger, Request::create('/invitations?foo=bar'))->addTags(['tag']);
    }

    public function testDoesNotAddTagsForNonCacheableMethod(): void {
        $tagger = $this->createMock(SymfonyResponseTagger::class);
        $tagger->expects($this->never())->method('addTags');

        $this->createResponseTagger($tagger, Request::create('/index.jsonhal', 'POST'))->addTags(['tag']);
    }

    private function createResponseTagger(SymfonyResponseTagger $tagger, Request $request): ResponseTagger {
        $requestStack = new RequestStack();
        $requestStack->push($request);

        return new ResponseTagger(self::MATCH_PATH, $tagger, $requestStack);
    }
}
