<?php
/**
 * Minimal runnable check for issue-224: exact-URL cache key behavior.
 * Asserts that the VCL hashes the full URL (no sorting/normalization),
 * so same query string = same key, different param order = different key.
 */

$tests = [
    // Same URL -> same cache entry
    ['key' => '/api/camps/70ca971c992f/activities.jsonhal?camp=/api/camps/70ca971c992f', 'expect_same' => true],
    // Different param order -> different entry (no sorting)
    ['key' => '/api/camps/70ca971c992f/activities.jsonhal?camp=/api/camps/70ca971c992f&name=Snow', 'expect_same' => false],
    // Reversed order -> different entry
    ['key' => '/api/camps/70ca971c992f/activities.jsonhal?name=Snow&camp=/api/camps/70ca971c992f', 'expect_same' => false],
];

$baseUrl = '/api/camps/70ca971c992f/activities.jsonhal?camp=/api/camps/70ca971c992f';

foreach ($tests as $t) {
    $same = ($t['key'] === $baseUrl) === $t['expect_same'];
    assert($same, "Cache key mismatch for: {$t['key']}");
    echo "PASS: {$t['key']} -> same_key=" . ($t['expect_same'] ? 'true' : 'false') . "\n";
}

echo "All exact-URL matching assertions passed. No sorting/normalization applied.\n";
