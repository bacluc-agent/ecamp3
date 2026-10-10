#!/bin/bash
set -euo pipefail

if [ "$CI" = 'true' ] ; then
  unset npm_config_store
  npm ci --verbose
  npm run build
  npm run start
else
  npm install
  npm run dev
fi
