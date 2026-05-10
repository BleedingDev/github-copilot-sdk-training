import type { SessionEvent } from "@github/copilot-sdk";
import type { EventLogMode } from "./config.js";

type UnknownRecord = Record<string, unknown>;

export type ConsoleEventLoggerOptions = {
  readonly mode?: EventLogMode;
};

export type ObservedEventLogger = {
  readonly onEvent: (event: SessionEvent) => void;
  readonly assertNoSessionErrors: () => void;
};

export function createConsoleEventLogger(options: ConsoleEventLoggerOptions = {}) {
  const mode = options.mode ?? "compact";
  let streamedAssistantText = false;

  return (event: SessionEvent): void => {
    const data = eventData(event);

    switch (event.type) {
      case "assistant.message_delta":
      case "assistant.streaming_delta":
        streamedAssistantText = true;
        process.stdout.write(readString(data, "deltaContent") ?? readString(data, "content") ?? "");
        return;

      case "assistant.message":
        if (mode === "full") {
          console.log("\n\n[assistant.message]");
          console.log(readString(data, "content") ?? JSON.stringify(data, null, 2));
          return;
        }

        if (!streamedAssistantText) {
          const content = readString(data, "content");
          if (content) {
            console.log(content);
          }
        }
        return;

      case "assistant.usage":
        if (mode === "compact") {
          console.log(
            `\n[assistant.usage] model=${readString(data, "model") ?? "unknown"} input=${readNumber(
              data,
              "inputTokens",
            )} output=${readNumber(data, "outputTokens")} reasoning=${readNumber(data, "reasoningTokens")} cost=${readNumber(
              data,
              "cost",
            )} durationMs=${readNumber(data, "duration")}`,
          );
          return;
        }

        console.log(`\n[${event.type}]`);
        console.log(JSON.stringify(data, null, 2));
        return;

      case "session.usage_info":
        if (mode === "compact") {
          console.log(
            `\n[session.usage_info] tokens=${readNumber(data, "currentTokens")}/${readNumber(
              data,
              "tokenLimit",
            )} messages=${readNumber(data, "messagesLength")}`,
          );
          return;
        }

        console.log(`\n[${event.type}]`);
        console.log(JSON.stringify(data, null, 2));
        return;

      case "tool.execution_start":
        console.log(`\n[tool.start] ${readString(data, "toolName") ?? "unknown"}`);
        return;

      case "tool.execution_complete":
        console.log(`\n[tool.complete] ${readString(data, "toolName") ?? "unknown"}`);
        return;

      case "session.error":
      case "model.call_failure":
        console.error(`\n[${event.type}]`);
        console.error(JSON.stringify(data, null, 2));
        return;

      default:
        return;
    }
  };
}

export function createObservedConsoleEventLogger(options: ConsoleEventLoggerOptions = {}): ObservedEventLogger {
  const errors: string[] = [];
  const logger = createConsoleEventLogger(options);

  return {
    onEvent(event: SessionEvent): void {
      if (event.type === "session.error" || event.type === "model.call_failure") {
        errors.push(readEventError(event));
      }

      logger(event);
    },

    assertNoSessionErrors(): void {
      if (errors.length > 0) {
        throw new Error(`Copilot session emitted error: ${errors.join("; ")}`);
      }
    },
  };
}

function eventData(event: SessionEvent): UnknownRecord {
  const candidate = (event as { data?: unknown }).data;
  return isRecord(candidate) ? candidate : {};
}

function readEventError(event: SessionEvent): string {
  const data = eventData(event);
  return readString(data, "message") ?? readString(data, "error") ?? JSON.stringify(data);
}

function readString(record: UnknownRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(record: UnknownRecord, key: string): number | string {
  const value = record[key];
  return typeof value === "number" ? value : "?";
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
