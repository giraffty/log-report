import type {
  AnalyzedCall,
  Calls,
  InnerCall,
  LogLine,
  Script,
} from "./call-log.types";
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
  client: { kind: "NOT_RECORDED" },
  script: { kind: "NONE" },
  ...overrides,
});

type ScriptKeys = Omit<Extract<Script, { kind: "SCRIPT" }>, "kind">;

export const innerCallAt = (
  seq: number,
  overrides: Partial<InnerCall> = {},
): InnerCall => ({
  seq,
  inputHash: `inner${String(seq).padStart(7, "0")}`,
  durationMs: 5,
  responseBytes: 50,
  result: { kind: "ANSWERED" },
  ...overrides,
});

export const scriptAt = (
  seq: number,
  script: Partial<ScriptKeys> = {},
  overrides: Partial<LogLine> = {},
): LogLine =>
  lineAt(seq, {
    tool: "run_script",
    input: { code: "return 1;" },
    excerpt: "1",
    script: {
      kind: "SCRIPT",
      code: "return 1;",
      scriptHash: `hash${String(seq).padStart(8, "0")}`,
      innerCalls: [],
      limit: { kind: "NONE" },
      console: "",
      ...script,
    },
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

export const wireScriptLine = (
  overrides: Readonly<Record<string, unknown>> = {},
): string =>
  wireLine({
    tool: "run_script",
    input: { code: "return 1;" },
    excerpt: "1",
    scriptHash: "hash00000001",
    innerCalls: [],
    console: "",
    ...overrides,
  });
