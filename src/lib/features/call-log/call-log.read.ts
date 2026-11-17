import { err, ok, Result } from "neverthrow";
import { z } from "zod";
import type { LineProblem } from "./call-log.errors";
import type { LogLine, ReadLog } from "./call-log.types";

const WireLine = z.object({
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
});

const lineOf = (wire: z.infer<typeof WireLine>): LogLine => ({
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
});

const jsonOf = (
  text: string,
  lineNumber: number,
): Result<unknown, LineProblem> =>
  Result.fromThrowable(
    (): unknown => JSON.parse(text),
    (): LineProblem => ({ kind: "NotJson", lineNumber }),
  )();

const callOf = (
  json: unknown,
  lineNumber: number,
): Result<LogLine, LineProblem> => {
  const parsed = WireLine.safeParse(json);
  return parsed.success
    ? ok(lineOf(parsed.data))
    : err({
        kind: "NotACall",
        lineNumber,
        issues: parsed.error.issues.map((issue) => ({
          key: issue.path.map(String).join("."),
          message: issue.message,
        })),
      });
};

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
