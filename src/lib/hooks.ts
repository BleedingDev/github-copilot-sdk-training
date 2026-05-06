import type { SessionConfig } from "@github/copilot-sdk";
import { AuditLog } from "./audit.js";
import { containsDestructiveCommand } from "./permissions.js";

const SCOPE_REMINDER = `

Scope reminder:
- Drž se aktuálního promptu a aktuální větve.
- Nekoukej do jiných git větví.
- Pokud potřebuješ změnu mimo lane ownership, popiš závislost místo úpravy.
`;

export function createGuardrailHooks(audit = new AuditLog()): NonNullable<SessionConfig["hooks"]> {
  return {
    onUserPromptSubmitted: async (input, invocation) => {
      await audit.write({
        type: "prompt.submitted",
        sessionId: invocation.sessionId,
        payload: { promptLength: input.prompt.length },
      });

      return {
        modifiedPrompt: `${input.prompt.trim()}${SCOPE_REMINDER}`,
      };
    },

    onPreToolUse: async (input, invocation) => {
      if (containsDestructiveCommand(input.toolArgs)) {
        await audit.write({
          type: "tool.blocked",
          sessionId: invocation.sessionId,
          payload: { toolName: input.toolName, toolArgs: input.toolArgs },
        });

        return {
          permissionDecision: "deny",
          permissionDecisionReason: "Destruktivní příkaz je v labu zakázaný.",
        };
      }

      await audit.write({
        type: "tool.pre",
        sessionId: invocation.sessionId,
        payload: { toolName: input.toolName, toolArgs: input.toolArgs },
      });

      return { permissionDecision: "ask" };
    },

    onPostToolUse: async (input, invocation) => {
      await audit.write({
        type: "tool.post",
        sessionId: invocation.sessionId,
        payload: {
          toolName: input.toolName,
          resultType: input.toolResult.resultType,
          error: input.toolResult.error,
        },
      });
    },

    onErrorOccurred: async (input, invocation) => {
      await audit.write({
        type: "session.error",
        sessionId: invocation.sessionId,
        payload: input,
      });
    },
  };
}
