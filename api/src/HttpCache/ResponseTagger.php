<?php

declare(strict_types=1);

namespace App\HttpCache;

use FOS\HttpCacheBundle\Http\SymfonyResponseTagger;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Wrapper around SymfonyResponseTagger which only adds tags for specific URIs, which match the regex $matchPath.
 *
 * @author Urban Suppiger <urban@suppiger.net>
 */
class ResponseTagger {
    public function __construct(
        private readonly string $matchPath,
        private readonly SymfonyResponseTagger $responseTagger,
        private readonly RequestStack $requestStack
    ) {}

    /**
     * Add tags to be set on the response.
     *
     * Only adds tags for requests that are cacheable
     *
     * @param string[] $tags List of tags to add
     */
    public function addTags(array $tags) {
        if ($this->isCacheable()) {
            $this->responseTagger->addTags($tags);
        }
    }

    private function isCacheable(): bool {
        $request = $this->requestStack->getCurrentRequest();

        if (!$request->isMethodCacheable()) {
            return false;
        }

        // Match the same notion of path the FOS cache_control rules use: the query string must not
        // participate, otherwise end-anchored alternatives (e.g. `index.jsonhal$`) never match a queried URL.
        $pathInfo = $request->getPathInfo();

        return (bool) preg_match('{'.$this->matchPath.'}', $pathInfo);
    }
}
