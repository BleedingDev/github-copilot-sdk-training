import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type AuditRecord = {
  readonly type: string;
  readonly sessionId?: string;
  readonly payload: unknown;
};

export class AuditLog {
  constructor(private readonly filePath = resolve(process.cwd(), "reports/sdk-audit.jsonl")) {}

  async write(record: AuditRecord): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...record,
      payload: redact(record.payload),
    });
    await appendFile(this.filePath, `${line}\n`, "utf8");
  }
}

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    result[key] = isSensitiveKey(key) ? "[redacted]" : redact(nestedValue);
  }
  return result;
}

function isSensitiveKey(key: string): boolean {
  return /token|secret|password|apikey|api_key|authorization/i.test(key);
}

