import { match } from "ts-pattern";
import type { AnalyzedCall, Calls, Fix, Flag } from "./call-log.types";

const LARGE_RESPONSE_BYTES = 50_000;
const SLOW_CALL_MS = 10_000;
const SEARCH_LOOP_LENGTH = 3;
const NULL_IN_DATA = /":null[,}\]]/;

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
    call.outcome === "INVALID_QUERY"
      ? [
          {
            kind: "RETRY_AFTER_FAILURE",
            seq: call.line.seq,
            fix: fixOf(call, calls.slice(index + 1)),
          },
        ]
      : [],
  );

const repeatedFlags = (calls: Calls): readonly Flag[] =>
  calls.flatMap<Flag>((call, index) => {
    const earlier = calls
      .slice(0, index)
      .find(
        (previous) =>
          previous.line.tool === call.line.tool &&
          previous.line.inputHash === call.line.inputHash,
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
        .with("query", () => ({ searches: 0, flags: state.flags }))
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

export const flagsOf = (calls: Calls): readonly Flag[] =>
  [
    ...retryFlags(calls),
    ...repeatedFlags(calls),
    ...largeFlags(calls),
    ...slowFlags(calls),
    ...searchLoopFlags(calls),
    ...nullFlags(calls),
  ].toSorted((a, b) => a.seq - b.seq);
