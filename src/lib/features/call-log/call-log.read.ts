import { err, ok, Result } from "neverthrow";
import { z } from "zod";
import type { LineProblem } from "./call-log.errors";
import type { InnerCall, LogLine, ReadLog, Script } from "./call-log.types";

const WireCall = z.object({
  ts: z.iso.datetime(),
  session: z.string(),
  seq: z.number().int().positive(),
  mcpVersion: z.string().optional(),
  server: z.literal("rust").optional(),
  tool: z.string(),
  input: z.json(),
  inputHash: z.string(),
  isError: z.boolean(),
  durationMs: z.number().nonnegative(),
  responseBytes: z.number().int().nonnegative(),
  excerpt: z.string(),
  truncated: z.boolean(),
  client: z.object({ name: z.string(), version: z.string() }).optional(),
});

const WireInnerCall = z.discriminatedUnion("isError", [
  z.object({
    seq: z.number().int().positive(),
    inputHash: z.string(),
    isError: z.literal(false),
    durationMs: z.number().nonnegative(),
    responseBytes: z.number().int().nonnegative(),
  }),
  z.object({
    seq: z.number().int().positive(),
    inputHash: z.string(),
    isError: z.literal(true),
    durationMs: z.number().nonnegative(),
    responseBytes: z.number().int().nonnegative(),
    error: z.string(),
  }),
]);

const WireScriptCall = WireCall.extend({
  tool: z.literal("run_script"),
  input: z.object({ code: z.string() }),
  scriptHash: z.string(),
  innerCalls: z.array(WireInnerCall),
  limit: z.string().optional(),
  console: z.string(),
});

const RunScript = z.object({ tool: z.literal("run_script") });

const lineOf = (wire: z.infer<typeof WireCall>, script: Script): LogLine => ({
  at: Date.parse(wire.ts),
  session: wire.session,
  seq: wire.seq,
  mcpVersion:
    wire.mcpVersion === undefined
      ? { kind: "NOT_RECORDED" }
      : { kind: "RECORDED", version: wire.mcpVersion },
  server: wire.server === undefined ? "TYPESCRIPT" : "RUST",
  tool: wire.tool,
  input: wire.input,
  inputHash: wire.inputHash,
  isError: wire.isError,
  durationMs: wire.durationMs,
  responseBytes: wire.responseBytes,
  excerpt: wire.excerpt,
  truncated: wire.truncated,
  client:
    wire.client === undefined
      ? { kind: "NOT_RECORDED" }
      : { kind: "RECORDED", ...wire.client },
  script,
});

const innerCallOf = (wire: z.infer<typeof WireInnerCall>): InnerCall => ({
  seq: wire.seq,
  inputHash: wire.inputHash,
  durationMs: wire.durationMs,
  responseBytes: wire.responseBytes,
  result: wire.isError
    ? { kind: "FAILED", error: wire.error }
    : { kind: "ANSWERED" },
});

const scriptLineOf = (wire: z.infer<typeof WireScriptCall>): LogLine =>
  lineOf(wire, {
    kind: "SCRIPT",
    code: wire.input.code,
    scriptHash: wire.scriptHash,
    innerCalls: wire.innerCalls.map(innerCallOf),
    limit:
      wire.limit === undefined
        ? { kind: "NONE" }
        : { kind: "STOPPED", name: wire.limit },
    console: wire.console,
  });

const callLineOf = (wire: z.infer<typeof WireCall>): LogLine =>
  lineOf(wire, { kind: "NONE" });

const jsonOf = (
  text: string,
  lineNumber: number,
): Result<unknown, LineProblem> =>
  Result.fromThrowable(
    (): unknown => JSON.parse(text),
    (): LineProblem => ({ kind: "NotJson", lineNumber }),
  )();

const parsedWith = <Wire>(
  schema: z.ZodType<Wire>,
  toLine: (wire: Wire) => LogLine,
  json: unknown,
  lineNumber: number,
): Result<LogLine, LineProblem> => {
  const parsed = schema.safeParse(json);
  return parsed.success
    ? ok(toLine(parsed.data))
    : err({
        kind: "NotACall",
        lineNumber,
        issues: parsed.error.issues.map((issue) => ({
          key: issue.path.map(String).join("."),
          message: issue.message,
        })),
      });
};

const callOf = (
  json: unknown,
  lineNumber: number,
): Result<LogLine, LineProblem> =>
  RunScript.safeParse(json).success
    ? parsedWith(WireScriptCall, scriptLineOf, json, lineNumber)
    : parsedWith(WireCall, callLineOf, json, lineNumber);

export const readLog = (content: string): ReadLog => {
  const results = content
    .split("\n")
    .map((text, index) => ({ text: text.trim(), lineNumber: index + 1 }))
    .filter((line) => line.text !== "")
    .map((line) =>
      jsonOf(line.text, line.lineNumber).andThen((json) =>
        callOf(json, line.lineNumber),
      ),
    );
  return {
    lines: results.flatMap((result) =>
      result.match(
        (line) => [line],
        () => [],
      ),
    ),
    problems: results.flatMap((result) =>
      result.match(
        () => [],
        (problem) => [problem],
      ),
    ),
  };
};
