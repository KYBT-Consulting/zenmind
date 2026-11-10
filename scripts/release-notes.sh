#!/usr/bin/env bash
# Print the CHANGELOG.md section for one version (without its "## [x.y.z]" heading).
# Used by the release workflow for the GitHub release body, which tauri-action also
# puts in latest.json as the "What's new" notes shown by the in-app updater.
#
#   scripts/release-notes.sh 0.3.1 [CHANGELOG.md]
set -euo pipefail
version="${1#v}"
changelog="${2:-CHANGELOG.md}"

# Portable awk only (macOS runners have BSD sed): collect the section, then drop
# leading and trailing blank lines
section="$(awk -v v="$version" '
  index($0, "## [" v "]") == 1 { found = 1; next }
  found && /^## \[/ { exit }
  found { lines[++n] = $0 }
  END {
    first = 1; while (first <= n && lines[first] ~ /^[[:space:]]*$/) first++
    last = n; while (last >= first && lines[last] ~ /^[[:space:]]*$/) last--
    for (i = first; i <= last; i++) print lines[i]
  }
' "$changelog")"

if [ -z "$section" ]; then
  echo "See the changelog for what's new in this release."
else
  printf '%s\n' "$section"
fi
