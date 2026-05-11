#!/usr/bin/env bash
set -euo pipefail

if [ -f /.dockerenv ] && [ -z "${COPILOT_GITHUB_TOKEN:-}${GH_TOKEN:-}${GITHUB_TOKEN:-}" ]; then
  printf 'y\n' | copilot login "$@"
else
  copilot login "$@"
fi
