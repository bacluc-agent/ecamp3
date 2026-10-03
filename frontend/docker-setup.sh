#!/bin/bash
set -euo pipefail

BASEDIR=$(dirname "$0")

if [ "$CI" = 'true' ] ; then
  unset npm_config_store
  npm ci --verbose
  npm run build
  npm run preview
else
  npm install
  npm run dev
fi
