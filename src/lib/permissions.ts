import type { PermissionHandler, PermissionRequest } from "@github/copilot-sdk";

const DESTRUCTIVE_PATTERNS = [
  /\brm\s+-rf\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+checkout\s+--\b/i,
  /\bgit\s+clean\b/i,
  /\bchmod\s+-R\b/i,
];

export const guardedPermissionHandler: PermissionHandler = (request) => {
  if (isDestructivePermissionRequest(request)) {
    return {
      kind: "reject",
      feedback: "Destruktivní příkaz je v labu zakázaný. Navrhni bezpečný inkrementální postup.",
    };
  }

  return { kind: "approve-once" };
};

export function isDestructivePermissionRequest(request: PermissionRequest): boolean {
  if (request.kind !== "shell") {
    return false;
  }

  return containsDestructiveCommand(request);
}

export function containsDestructiveCommand(value: unknown): boolean {
  const text = JSON.stringify(value);
  return DESTRUCTIVE_PATTERNS.some((pattern) => pattern.test(text));
}

