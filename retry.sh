#!/usr/bin/env bash
# Retry a command that failed. Usage: ./retry.sh <attempts> <delay> <command> [args...]
#
# docker compose has no retry of its own, so one transient registry error
# ("read: connection reset by peer" while pulling an image) aborts the whole
# e2e job and skips every test. See
# https://github.com/ecamp/ecamp3/actions/runs/36334124503/job/108662317251
#
# ponytail: retries every failure, not only registry errors, because the error
# text differs per registry. The last attempt still exits non-zero, so a real
# failure still fails the job and only the backoff is wasted. Match on the
# error text first if the wasted 20s ever matters.

attempts=$1
delay=$2
shift 2

attempt=1
while true; do
    if "$@"; then
        exit 0
    fi
    if [ "$attempt" -ge "$attempts" ]; then
        echo "retry.sh: '$*' failed $attempt times, giving up"
        exit 1
    fi
    echo "retry.sh: '$*' failed (attempt $attempt/$attempts), retrying in ${delay}s"
    sleep "$delay"
    attempt=$((attempt + 1))
done
