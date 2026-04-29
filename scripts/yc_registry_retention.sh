#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${YC_REGISTRY_ID:-}" ]]; then
  echo "YC_REGISTRY_ID is required."
  exit 1
fi

KEEP_AUTOGEN_IMAGES="${KEEP_AUTOGEN_IMAGES:-20}"
DRY_RUN="${DRY_RUN:-true}"

cleanup_repository() {
  local repository_short="$1"
  local container_name="$2"
  local repository="${YC_REGISTRY_ID}/${repository_short}"
  local protected_tags_json
  local deletions

  echo "== Repository: ${repository} =="

  if ! yc container repository get "$repository" >/dev/null 2>&1; then
    echo "Repository does not exist yet, skipping."
    return
  fi

  protected_tags_json="$(
    {
      echo "latest"
      yc serverless container revision list --container-name "$container_name" --format json 2>/dev/null \
        | jq -r 'sort_by(.created_at) | reverse | first(.[]?) | .image.image_url // empty' \
        | awk -F: '{print $NF}'
    } \
      | awk 'NF' \
      | sort -u \
      | jq -R . \
      | jq -s .
  )"

  deletions="$(
    yc container image list \
      --registry-id "$YC_REGISTRY_ID" \
      --repository-name "$repository" \
      --format json \
    | jq -r \
        --argjson keep "$KEEP_AUTOGEN_IMAGES" \
        --argjson protected_tags "$protected_tags_json" '
          def is_auto_tag:
            test("^[0-9a-f]{40}$")
            or test("^sha256:[0-9a-f]{64}$");

          ($protected_tags | map({key: ., value: true}) | from_entries) as $protected_set |

          [
            .[]
            | .tags = (.tags // [])
            | select(any(.tags[]?; $protected_set[.] == true) | not)
            | select((.tags | length) == 0 or all(.tags[]; is_auto_tag))
          ]
          | sort_by(.created_at) | reverse
          | .[$keep:]
          | .[]
          | [.id, .created_at, (.tags | join(","))]
          | @tsv
        '
  )"

  if [[ -z "$deletions" ]]; then
    echo "Nothing to delete."
    return
  fi

  echo "Candidates:"
  printf '%s\n' "$deletions"

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "Dry-run mode enabled, skipping deletion."
    return
  fi

  while IFS=$'\t' read -r image_id _; do
    [[ -z "$image_id" ]] && continue
    echo "Deleting image: $image_id"
    yc container image delete "$image_id" || true
  done <<< "$deletions"
}

cleanup_repository "vrk-backend" "vrk-backend"
cleanup_repository "vrk-web" "vrk-web"
