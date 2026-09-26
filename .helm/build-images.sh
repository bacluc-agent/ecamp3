#!/bin/sh

set -e

SCRIPT_DIR=$(realpath "$(dirname "$0")")
REPO_DIR=$(realpath "$SCRIPT_DIR"/..)

version=$(yq -r '.IMAGE_TAG' $SCRIPT_DIR/ecamp3/env.yaml)
docker_hub_account=$(yq -r '.DOCKER_HUB_USERNAME' $SCRIPT_DIR/ecamp3/env.yaml)

frontend_image_tag="${docker_hub_account}/ecamp3-frontend:${version}"
docker build "$REPO_DIR" -f "$REPO_DIR"/.docker-hub/frontend/Dockerfile -t "$frontend_image_tag"
docker push "$frontend_image_tag"

api_image_tag="${docker_hub_account}/ecamp3-api:${version}"
docker build "$REPO_DIR"/api -f "$REPO_DIR"/api/Dockerfile -t "$api_image_tag" --target frankenphp_prod
docker push "$api_image_tag"

print_image_tag="${docker_hub_account}/ecamp3-print:${version}"
docker build "$REPO_DIR" -f "$REPO_DIR"/.docker-hub/print/Dockerfile -t "$print_image_tag"
docker push "$print_image_tag"

varnish_image_tag="${docker_hub_account}/ecamp3-varnish:${version}"
docker build "$REPO_DIR" -f "$REPO_DIR"/.docker-hub/varnish/Dockerfile -t "$varnish_image_tag"
docker push "$varnish_image_tag"

export REPO_OWNER=${docker_hub_account}
export VERSION=${version}
db_backup_restore_docker_compose_path="$REPO_DIR"/.helm/ecamp3/files/db-backup-restore-image/docker-compose.yml
docker compose -f "$db_backup_restore_docker_compose_path" build
docker compose -f "$db_backup_restore_docker_compose_path" push
