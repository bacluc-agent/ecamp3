#!/usr/bin/env bash
# Self-check for retry.sh. Needs no Docker and no network and finishes in well
# under a second, so the e2e job can run it before it pulls any image.
# Usage: bash retry-self-test.sh

fail() {
    echo "retry-self-test: $1" >&2
    exit 1
}

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# succeeds on the n-th call, fails before that
succeed_on_nth_call='n=$(cat "$1/calls"); n=$((n + 1)); echo "$n" > "$1/calls"; [ "$n" -ge "$2" ]'

# 1: a command that already succeeds is run once and exits 0
echo 0 > "$work/calls"
bash "$(dirname "$0")/retry.sh" 3 0 sh -c "$succeed_on_nth_call" _ "$work" 1 \
    || fail 'a command that succeeds must exit 0'
[ "$(cat "$work/calls")" -eq 1 ] || fail 'a command that succeeds must not be retried'

# 2: a command that fails twice is retried until it works, then exits 0
echo 0 > "$work/calls"
bash "$(dirname "$0")/retry.sh" 3 0 sh -c "$succeed_on_nth_call" _ "$work" 3 \
    || fail 'a command that recovers must exit 0'
[ "$(cat "$work/calls")" -eq 3 ] || fail 'a recovering command must be retried until it works'

# 3: a command that never succeeds still fails, after exactly 3 attempts
echo 0 > "$work/calls"
if bash "$(dirname "$0")/retry.sh" 3 0 sh -c "$succeed_on_nth_call" _ "$work" 99; then
    fail 'a command that always fails must exit non-zero'
fi
[ "$(cat "$work/calls")" -eq 3 ] || fail 'an always-failing command must be tried 3 times'

echo 'retry-self-test: ok'
