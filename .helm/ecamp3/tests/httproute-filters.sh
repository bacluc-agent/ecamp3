#!/bin/sh

set -eu

command -v helm >/dev/null
command -v helmfile >/dev/null
command -v yq >/dev/null

chart_dir=$(cd -- "$(dirname "$0")/.." && pwd)
env_file="$chart_dir/env.yaml"
values_file="$chart_dir/values.yaml"
if [ -e "$env_file" ] || [ -e "$values_file" ]; then
  printf '%s\n' 'env.yaml or values.yaml already exists in the chart directory' >&2
  exit 1
fi
work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"; rm -f "$env_file" "$values_file"' EXIT
cp "$chart_dir/env.example.yaml" "$env_file"

render_routes() {
  auth_enabled=$1
  gateway_class=$2
  basic_auth_enabled=false
  if [ "$auth_enabled" = enabled ]; then
    basic_auth_enabled=true
  fi
  test_dir="$work_dir/$auth_enabled-$gateway_class"
  mkdir -p "$test_dir"
  yq -i \
    ".NAME = \"httproute-test\" |
     .DOMAIN = \"example.test\" |
     .DOCKER_HUB_USERNAME = \"test\" |
     .IMAGE_TAG = \"test\" |
     .HITOBITO_TOKEN_ENCRYPTION_KEY = \"test\" |
     .JWT_PASSPHRASE = \"test\" |
     .JWT_PRIVATE_KEY = \"test\" |
     .JWT_PUBLIC_KEY = \"test\" |
     .POSTGRES_URL = \"postgres://test:test@localhost:5432\" |
     .GATEWAY_CLASS_NAME = \"$gateway_class\" |
     .BASIC_AUTH_ENABLED = $basic_auth_enabled |
     .BASIC_AUTH_USERNAME = \"test\" |
     .BASIC_AUTH_PASSWORD = \"test\"" \
    "$env_file"
  (cd "$chart_dir" && helmfile write-values --environment default --output-file-template values.yaml) >/dev/null
  helm template httproute-test "$chart_dir" --values "$values_file" >"$test_dir/routes.yaml"
  printf '%s\n' "$test_dir/routes.yaml"
}

assert_route() {
  file=$1
  name=$2
  expression=$3
  yq -e "select(.kind == \"HTTPRoute\" and .metadata.name == \"$name\") | ((.spec.rules | length) > 0) and ([.spec.rules[] | ($expression)] | all)" "$file" >/dev/null
}

disabled=$(render_routes disabled traefik)
enabled=$(render_routes enabled traefik)
non_traefik=$(render_routes enabled nginx)

for file in "$disabled" "$enabled" "$non_traefik"; do
  yq ea -e '[select(.kind == "HTTPRoute") | .spec.rules[] | ((has("filters") | not) or (.filters | type == "!!seq"))] | all' "$file" >/dev/null
done

assert_route "$disabled" httproute-test-ecamp3-frontend '(has("filters") | not)'
assert_route "$disabled" httproute-test-ecamp3-mail '(has("filters") | not)'
assert_route "$disabled" httproute-test-ecamp3-api '(.filters | length == 2) and .filters[0].type == "URLRewrite" and .filters[0].urlRewrite.path.type == "ReplacePrefixMatch" and .filters[0].urlRewrite.path.replacePrefixMatch == "/" and .filters[1].type == "RequestHeaderModifier" and .filters[1].requestHeaderModifier.add[0].name == "X-Forwarded-Prefix" and .filters[1].requestHeaderModifier.add[0].value == "/api"'

assert_route "$enabled" httproute-test-ecamp3-frontend '(.filters | length == 1) and .filters[0].type == "ExtensionRef" and .filters[0].extensionRef.group == "traefik.io" and .filters[0].extensionRef.kind == "Middleware" and .filters[0].extensionRef.name == "httproute-test-ecamp3-basic-auth"'
assert_route "$enabled" httproute-test-ecamp3-mail '(.filters | length == 1) and .filters[0].type == "ExtensionRef" and .filters[0].extensionRef.group == "traefik.io" and .filters[0].extensionRef.kind == "Middleware" and .filters[0].extensionRef.name == "httproute-test-ecamp3-basic-auth"'
assert_route "$enabled" httproute-test-ecamp3-api '(.filters | length == 3) and .filters[0].type == "URLRewrite" and .filters[0].urlRewrite.path.type == "ReplacePrefixMatch" and .filters[0].urlRewrite.path.replacePrefixMatch == "/" and .filters[1].type == "RequestHeaderModifier" and .filters[1].requestHeaderModifier.add[0].name == "X-Forwarded-Prefix" and .filters[1].requestHeaderModifier.add[0].value == "/api" and .filters[2].type == "ExtensionRef" and .filters[2].extensionRef.group == "traefik.io" and .filters[2].extensionRef.kind == "Middleware" and .filters[2].extensionRef.name == "httproute-test-ecamp3-basic-auth"'

assert_route "$non_traefik" httproute-test-ecamp3-frontend '(has("filters") | not)'
assert_route "$non_traefik" httproute-test-ecamp3-mail '(has("filters") | not)'
assert_route "$non_traefik" httproute-test-ecamp3-api '(.filters | length == 2) and .filters[0].type == "URLRewrite" and .filters[0].urlRewrite.path.type == "ReplacePrefixMatch" and .filters[0].urlRewrite.path.replacePrefixMatch == "/" and .filters[1].type == "RequestHeaderModifier" and .filters[1].requestHeaderModifier.add[0].name == "X-Forwarded-Prefix" and .filters[1].requestHeaderModifier.add[0].value == "/api"'

printf '%s\n' 'HTTPRoute filter validation passed for frontend, API, and mail with Traefik and non-Traefik gateway classes; no print HTTPRoute is rendered by this chart.'
