import { match, P } from "ts-pattern";
import type {
  AnalyzedCall,
  Calls,
  Fix,
  Flag,
  LogLine,
  Outcome,
} from "./call-log.types";

const LARGE_RESPONSE_BYTES = 50_000;
const SLOW_CALL_MS = 10_000;
const SEARCH_LOOP_LENGTH = 3;
const NULL_IN_DATA = /":null[,}\]]/;
const RETRIED: readonly Outcome[] = [
  "INVALID_QUERY",
  "SCRIPT_ERROR",
  "QUERY_ERROR",
  "LIMIT",
];

const fixOf = (failed: AnalyzedCall, later: readonly AnalyzedCall[]): Fix => {
  const fixed = later.find(
    (call) => call.line.tool === failed.line.tool && call.outcome === "OK",
  );
  return fixed === undefined
    ? { kind: "NOT_FIXED" }
    : { kind: "FIXED_AT", seq: fixed.line.seq };
};

const retryFlags = (calls: Calls): readonly Flag[] =>
  calls.flatMap<Flag>((call, index) =>
    RETRIED.includes(call.outcome)
      ? [
          {
            kind: "RETRY_AFTER_FAILURE",
            seq: call.line.seq,
            fix: fixOf(call, calls.slice(index + 1)),
          },
        ]
      : [],
  );

const hashOf = (line: LogLine): string =>
  line.script.kind === "SCRIPT" ? line.script.scriptHash : line.inputHash;

const repeatedFlags = (calls: Calls): readonly Flag[] =>
  calls.flatMap<Flag>((call, index) => {
    const earlier = calls
      .slice(0, index)
      .find(
        (previous) =>
          previous.line.tool === call.line.tool &&
          hashOf(previous.line) === hashOf(call.line),
      );
    return JSON.stringify(call.line.input) === "{}" || earlier === undefined
      ? []
      : [
          {
            kind: "REPEATED_CALL",
            seq: call.line.seq,
            sameAs: earlier.line.seq,
          },
        ];
  });

const largeFlags = (calls: Calls): readonly Flag[] =>
  calls
    .filter((call) => call.line.responseBytes > LARGE_RESPONSE_BYTES)
    .map<Flag>((call) => ({
      kind: "LARGE_RESPONSE",
      seq: call.line.seq,
      bytes: call.line.responseBytes,
    }));

const slowFlags = (calls: Calls): readonly Flag[] =>
  calls
    .filter((call) => call.line.durationMs > SLOW_CALL_MS)
    .map<Flag>((call) => ({
      kind: "SLOW_CALL",
      seq: call.line.seq,
      durationMs: call.line.durationMs,
    }));

type Searching = {
  readonly searches: number;
  readonly flags: readonly Flag[];
};

const afterSearch = (state: Searching, seq: number): Searching => {
  const searches = state.searches + 1;
  return {
    searches,
    flags:
      searches === SEARCH_LOOP_LENGTH
        ? [...state.flags, { kind: "SEARCH_LOOP", seq }]
        : state.flags,
  };
};

const searchLoopFlags = (calls: Calls): readonly Flag[] =>
  calls.reduce<Searching>(
    (state, call) =>
      match<string, Searching>(call.line.tool)
        .with(P.union("query", "run_script"), () => ({
          searches: 0,
          flags: state.flags,
        }))
        .with("search_schema", () => afterSearch(state, call.line.seq))
        .otherwise(() => state),
    { searches: 0, flags: [] },
  ).flags;

const nullFlags = (calls: Calls): readonly Flag[] =>
  calls
    .filter(
      (call) =>
        call.line.tool === "query" &&
        call.outcome === "OK" &&
        NULL_IN_DATA.test(call.line.excerpt),
    )
    .map<Flag>((call) => ({ kind: "NULL_WITHOUT_ERROR", seq: call.line.seq }));

const failedInsideOf = (call: AnalyzedCall): number =>
  call.line.script.kind === "SCRIPT" && call.outcome === "OK"
    ? call.line.script.innerCalls.filter(
        (inner) => inner.result.kind === "FAILED",
      ).length
    : 0;

const innerFailedFlags = (calls: Calls): readonly Flag[] =>
  calls.flatMap<Flag>((call) => {
    const failed = failedInsideOf(call);
    return failed === 0
      ? []
      : [{ kind: "INNER_QUERY_FAILED", seq: call.line.seq, failed }];
  });

export const flagsOf = (calls: Calls): readonly Flag[] =>
  [
    ...retryFlags(calls),
    ...repeatedFlags(calls),
    ...largeFlags(calls),
    ...slowFlags(calls),
    ...searchLoopFlags(calls),
    ...nullFlags(calls),
    ...innerFailedFlags(calls),
  ].toSorted((a, b) => a.seq - b.seq);
