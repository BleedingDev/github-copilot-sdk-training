#!/usr/bin/env bash
set -euo pipefail

if [ -f /.dockerenv ] && [ -z "${COPILOT_GITHUB_TOKEN:-}${GH_TOKEN:-}${GITHUB_TOKEN:-}" ]; then
  echo "Docker nemá system keychain."
  echo "Plaintext fallback bude potvrzen automaticky uvnitř Docker volume."

  if command -v script >/dev/null 2>&1; then
    login_command="pnpm exec copilot login"
    for arg in "$@"; do
      login_command+=" $(printf "%q" "$arg")"
    done

    set +e
    (
      while true; do
        sleep 2
        printf "y\n"
      done
    ) | script -q /dev/null -c "$login_command"
    status=${PIPESTATUS[1]}
    set -e
    exit "$status"
  fi
fi

exec copilot login "$@"
