#!/bin/bash
set -euo pipefail

if [ "${CI:-}" = 'true' ] ; then
  npm ci --verbose
  npm run start
else
  npm install
  npm run dev
fi
