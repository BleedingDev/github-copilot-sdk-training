import type { SessionEvent } from "@github/copilot-sdk";

type UnknownRecord = Record<string, unknown>;

export function createConsoleEventLogger() {
  return (event: SessionEvent): void => {
    const data = eventData(event);

    switch (event.type) {
      case "assistant.message_delta":
      case "assistant.streaming_delta":
        process.stdout.write(readString(data, "deltaContent") ?? readString(data, "content") ?? "");
        return;

      case "assistant.message":
        console.log("\n\n[assistant.message]");
        console.log(readString(data, "content") ?? JSON.stringify(data, null, 2));
        return;

      case "assistant.usage":
      case "session.usage_info":
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

function eventData(event: SessionEvent): UnknownRecord {
  const candidate = (event as { data?: unknown }).data;
  return isRecord(candidate) ? candidate : {};
}

function readString(record: UnknownRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

