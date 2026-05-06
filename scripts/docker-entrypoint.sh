#!/usr/bin/env bash
set -euo pipefail

cd /workspace

if [ ! -d node_modules ] || [ ! -f node_modules/.modules.yaml ]; then
  pnpm install --frozen-lockfile
fi

exec "$@"
