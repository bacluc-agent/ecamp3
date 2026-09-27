#!/bin/sh

set -ea

SCRIPT_DIR=$(realpath "$(dirname "$0")")
cd $SCRIPT_DIR

action=${1:-diff}

helmfile deps
helmfile write-values --environment default --output-file-template values.yaml

if [ "$action" = "deploy" ]; then
  # to debug: --dry-run --debug
  helm upgrade --install ops-dashboard \
    --namespace=ops-dashboard \
    --create-namespace \
    "$SCRIPT_DIR" \
    --values "$SCRIPT_DIR/values.yaml"
  exit 0
fi

if [ "$action" = "diff" ]; then
  helm template \
    --namespace ops-dashboard --no-hooks --skip-tests ops-dashboard \
    "$SCRIPT_DIR" \
    --values "$SCRIPT_DIR/values.yaml" | kubectl diff --namespace ops-dashboard -f -
  exit 0
fi
