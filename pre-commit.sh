#!/bin/sh

# shellcheck disable=SC2034
# Load git diff once for slight performance improvements
git_changes=$(git diff --name-only)

execute_or_run() {
    folder="$1"
    container_name="$2"
    service="$3"
    cmd="$4"
    use_cmd_as_entrypoint="${5:-false}" # default to false if not provided

    if echo "$git_changes" | grep -qE "^$folder/"; then
        if docker inspect --format="{{.State.Running}}" "$container_name" 2>/dev/null | grep -q "true"; then
            docker compose exec -d "$service" $cmd
        else
            # Check if we should use the command as the entrypoint
            if $use_cmd_as_entrypoint; then
                docker compose run --rm -d --entrypoint="$cmd" "$service"
            else
                docker compose run -d "$service" $cmd
            fi
        fi
    fi
}


while IFS='|' read -r folder container service _check_service cmd use_cmd_as_entrypoint; do
    if [ "$folder" = "e2e" ]; then
        execute_or_run "$folder" "$container" "$service" "$cmd" "$use_cmd_as_entrypoint"
    else
        execute_or_run "$folder" "$container" "$service" "$cmd" "$use_cmd_as_entrypoint" &
    fi
done < .agents/scripts/lint-command-map

# Wait for all parallel jobs to complete
wait

echo "eCamp v3 Git-Hook run finished"
