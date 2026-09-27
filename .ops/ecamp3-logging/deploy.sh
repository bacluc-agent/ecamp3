#!/bin/sh

set -ea

SCRIPT_DIR=$(realpath "$(dirname "$0")")
cd $SCRIPT_DIR

if [ -f $SCRIPT_DIR/.env ]; then
  . $SCRIPT_DIR/.env
fi

echo "ELASTIC_NODE_STORAGE_SIZE can not be automatically enlarged, see: https://github.com/kubernetes/enhancements/pull/4651 and https://github.com/kubernetes/kubernetes/issues/68737"

helmfile deps
helmfile write-values --environment default --output-file-template values.yaml

if [ $1 = "deploy" ]; then
  # to debug: --dry-run --debug
  helm upgrade --install ecamp3-logging \
      --namespace ecamp3-logging \
      --create-namespace \
      $SCRIPT_DIR \
      --values $SCRIPT_DIR/values.yaml
  exit 0
fi

if [ $1 = "diff" ]; then
  helm template \
      --namespace ecamp3-logging --no-hooks --skip-tests ecamp3-logging \
      $SCRIPT_DIR \
      --values $SCRIPT_DIR/values.yaml | kubectl diff --namespace ecamp3-logging -f -
  exit 0
fi
