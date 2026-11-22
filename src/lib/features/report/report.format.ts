import type { TagTone } from "@giraffty/ui";
import { Result } from "neverthrow";
import { match } from "ts-pattern";
import { z } from "zod";
import { isFailed } from "#lib/features/call-log/call-log.outcomes.ts";
import type {
  DescribedBeforeQuerying,
  Flag,
  Outcome,
  Script,
  ScriptMetrics,
} from "#lib/features/call-log/call-log.types.ts";

export const countOf = (count: number, thing: string): string =>
  `${count} ${thing}${count === 1 ? "" : "s"}`;

export const queriesOf = (count: number): string =>
  count === 1 ? "1 query" : `${count} queries`;

export const kilobytes = (bytes: number): string =>
  `${(bytes / 1024).toFixed(1)} KB`;

export const seconds = (ms: number): string => `${(ms / 1000).toFixed(1)} s`;

export const dateTimeOf = (at: number): string =>
  new Date(at).toISOString().slice(0, 19).replace("T", " ");

export const timeOf = (at: number): string =>
  new Date(at).toISOString().slice(11, 19);

export const outcomeLabel = (outcome: Outcome): string =>
  match(outcome)
    .with("OK", () => "ok")
    .with("PARTIAL", () => "partial")
    .with("INVALID_QUERY", () => "invalid query")
    .with("UNAVAILABLE", () => "unavailable")
    .with("NOT_FOUND", () => "not found")
    .with("WEAK_SEARCH", () => "weak search")
    .with("SCRIPT_ERROR", () => "script error")
    .with("QUERY_ERROR", () => "query error")
    .with("LIMIT", () => "limit")
    .with("CANCELLED", () => "cancelled")
    .exhaustive();

export const outcomeTone = (outcome: Outcome): TagTone =>
  isFailed(outcome) ? "accent" : outcome === "OK" ? "muted" : "neutral";

export const formatFlag = (flag: Flag): string =>
  match(flag)
    .with(
      { kind: "RETRY_AFTER_FAILURE", fix: { kind: "FIXED_AT" } },
      (f) => `retryAfterFailure: fixed at #${f.fix.seq}`,
    )
    .with(
      { kind: "RETRY_AFTER_FAILURE", fix: { kind: "NOT_FIXED" } },
      () => "retryAfterFailure: not fixed in this conversation",
    )
    .with(
      { kind: "REPEATED_CALL" },
      (f) => `repeatedCall: same input as #${f.sameAs}`,
    )
    .with(
      { kind: "LARGE_RESPONSE" },
      (f) => `largeResponse: ${kilobytes(f.bytes)}`,
    )
    .with({ kind: "SLOW_CALL" }, (f) => `slowCall: ${seconds(f.durationMs)}`)
    .with(
      { kind: "SEARCH_LOOP" },
      () => "searchLoop: 3 searches without a query",
    )
    .with(
      { kind: "NULL_WITHOUT_ERROR" },
      () => "nullWithoutError: null in data without errors",
    )
    .with(
      { kind: "INNER_QUERY_FAILED" },
      (f) =>
        `innerQueryFailed: ${f.failed} failed inside and the script went on`,
    )
    .exhaustive();

export const describedLabel = (described: DescribedBeforeQuerying): string =>
  match(described)
    .with("YES", () => "yes")
    .with("NO", () => "no")
    .with("NO_QUERY", () => "no query")
    .exhaustive();

export const scriptsLabel = (
  scripts: Extract<ScriptMetrics, { kind: "SCRIPTS" }>,
): string =>
  `${scripts.scripts} (${scripts.failed} failed) · ${queriesOf(scripts.innerQueries)} inside (${scripts.failedInnerQueries} failed)`;

export const scriptSummaryOf = (
  script: Extract<Script, { kind: "SCRIPT" }>,
): string => {
  const failed = script.innerCalls.filter(
    (call) => call.result.kind === "FAILED",
  ).length;
  return failed === 0
    ? `script: ${queriesOf(script.innerCalls.length)}`
    : `script: ${queriesOf(script.innerCalls.length)}, ${failed} failed`;
};

const QueryInput = z.object({
  root: z.string(),
  payload: z.record(z.string(), z.json()),
});
const SearchInput = z.object({ query: z.string() });
const DescribeInput = z.object({ name: z.string() });

export const summaryOf = (input: unknown): string => {
  const query = QueryInput.safeParse(input);
  const search = SearchInput.safeParse(input);
  const describe = DescribeInput.safeParse(input);
  return query.success
    ? `${query.data.root}: ${Object.keys(query.data.payload).join(", ")}`
    : search.success
      ? `"${search.data.query}"`
      : describe.success
        ? describe.data.name
        : "";
};

export const prettyOf = (text: string): string =>
  Result.fromThrowable(
    (): unknown => JSON.parse(text),
    () => "NOT_JSON" as const,
  )().match(
    (json) => JSON.stringify(json, null, 2),
    () => text,
  );
