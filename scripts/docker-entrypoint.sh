#!/usr/bin/env bash
set -euo pipefail

cd /workspace

if [ ! -d node_modules ] \
  || [ ! -f node_modules/.modules.yaml ] \
  || [ package.json -nt node_modules/.modules.yaml ] \
  || [ pnpm-lock.yaml -nt node_modules/.modules.yaml ] \
  || [ ! -x node_modules/.bin/copilot ]; then
  pnpm install --frozen-lockfile
fi

exec "$@"
