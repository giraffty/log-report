import type { AnalyzedCall, Calls, LogLine } from "./call-log.types";
import { outcomeOf } from "./call-log.outcomes";

const START = Date.parse("2026-10-20T15:00:00.000Z");

export const lineAt = (
  seq: number,
  overrides: Partial<LogLine> = {},
): LogLine => ({
  at: START + seq * 1000,
  session: "s1",
  seq,
  mcpVersion: { kind: "RECORDED", version: "0.7.1" },
  server: "RUST",
  tool: "query",
  input: { root: "document" },
  inputHash: `hash${String(seq).padStart(8, "0")}`,
  isError: false,
  durationMs: 10,
  responseBytes: 100,
  excerpt: '{"errors":[],"data":{}}',
  truncated: false,
  ...overrides,
});

const analyzed = (line: LogLine): AnalyzedCall => ({
  line,
  outcome: outcomeOf(line),
});

export const callsOf = (first: LogLine, ...rest: readonly LogLine[]): Calls => [
  analyzed(first),
  ...rest.map(analyzed),
];

export const wireLine = (
  overrides: Readonly<Record<string, unknown>> = {},
): string =>
  JSON.stringify({
    ts: "2026-10-20T15:00:01.000Z",
    session: "s1",
    seq: 1,
    mcpVersion: "0.7.1",
    server: "rust",
    tool: "query",
    input: { root: "document" },
    inputHash: "hash00000001",
    isError: false,
    durationMs: 10,
    responseBytes: 100,
    excerpt: '{"errors":[],"data":{}}',
    truncated: false,
    ...overrides,
  });
