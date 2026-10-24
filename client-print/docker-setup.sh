#!/bin/bash
set -euo pipefail

for _ in {1..120}; do
  if node --input-type=module -e 'try { process.exit((await fetch("http://frontend:3000")).ok ? 0 : 1) } catch { process.exit(1) }'; then
    break
  fi
  sleep 1
done
node --input-type=module -e 'const response = await fetch("http://frontend:3000"); if (!response.ok) process.exit(1)'

if [ "${CI:-}" = 'true' ] ; then
  npm ci --verbose
  npm run start
else
  npm install
  npm run dev
fi
