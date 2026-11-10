#!/usr/bin/env bash
# usage: retry.sh <attempts> <sleep_seconds> <command...>
set -euo pipefail
attempts=$1; sleep_s=$2; shift 2
for i in $(seq 1 "$attempts"); do
  if "$@"; then exit 0; fi
  echo "attempt $i/$attempts failed: $*" >&2
  if [ "$i" -lt "$attempts" ]; then sleep "$sleep_s"; fi
done
echo "giving up after $attempts attempts: $*" >&2
exit 1
