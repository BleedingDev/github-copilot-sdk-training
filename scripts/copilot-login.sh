#!/usr/bin/env bash
set -euo pipefail

if [ -f /.dockerenv ] && [ -z "${COPILOT_GITHUB_TOKEN:-}${GH_TOKEN:-}${GITHUB_TOKEN:-}" ]; then
  echo "Docker nemá system keychain."
  echo "Copilot CLI proto použije plaintext token store uvnitř Docker volume."

  node --input-type=module <<'NODE'
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const copilotHome = process.env.COPILOT_HOME || join(homedir(), ".copilot");
const settingsPath = join(copilotHome, "settings.json");
mkdirSync(copilotHome, { recursive: true, mode: 0o700 });

let settings = {};
try {
  settings = JSON.parse(readFileSync(settingsPath, "utf8"));
} catch {
  settings = {};
}

writeFileSync(settingsPath, `${JSON.stringify({ ...settings, storeTokenPlaintext: true }, null, 2)}\n`, {
  mode: 0o600,
});
NODE
fi

exec copilot login "$@"
