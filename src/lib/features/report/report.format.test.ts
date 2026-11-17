import { describe, expect, it } from "vitest";
import type { Flag } from "#lib/features/call-log/call-log.types.ts";
import {
  countOf,
  dateTimeOf,
  describedLabel,
  formatFlag,
  kilobytes,
  outcomeLabel,
  outcomeTone,
  prettyOf,
  seconds,
  summaryOf,
  timeOf,
} from "./report.format";

const AT = Date.parse("2026-10-20T15:04:05.678Z");

describe("numbers and times", () => {
  it("writes counts, sizes, durations and UTC times", () => {
    expect([
      countOf(1, "call"),
      countOf(2, "call"),
      countOf(0, "flag"),
    ]).toEqual(["1 call", "2 calls", "0 flags"]);
    expect(kilobytes(153_000)).toBe("149.4 KB");
    expect(seconds(38_250)).toBe("38.3 s");
    expect(dateTimeOf(AT)).toBe("2026-10-20 15:04:05");
    expect(timeOf(AT)).toBe("15:04:05");
  });
});

describe("outcomes", () => {
  it("names each outcome and marks failures", () => {
    const outcomes = [
      "OK",
      "PARTIAL",
      "INVALID_QUERY",
      "UNAVAILABLE",
      "NOT_FOUND",
      "WEAK_SEARCH",
    ] as const;

    expect(outcomes.map(outcomeLabel)).toEqual([
      "ok",
      "partial",
      "invalid query",
      "unavailable",
      "not found",
      "weak search",
    ]);
    expect(outcomes.map(outcomeTone)).toEqual([
      "muted",
      "neutral",
      "accent",
      "accent",
      "accent",
      "neutral",
    ]);
  });
});

describe("formatFlag", () => {
  it("names the flag as the user guide does, with its detail", () => {
    const flags: readonly Flag[] = [
      {
        kind: "RETRY_AFTER_FAILURE",
        seq: 1,
        fix: { kind: "FIXED_AT", seq: 4 },
      },
      { kind: "RETRY_AFTER_FAILURE", seq: 1, fix: { kind: "NOT_FIXED" } },
      { kind: "REPEATED_CALL", seq: 3, sameAs: 2 },
      { kind: "LARGE_RESPONSE", seq: 4, bytes: 153_000 },
      { kind: "SLOW_CALL", seq: 2, durationMs: 38_000 },
      { kind: "SEARCH_LOOP", seq: 7 },
      { kind: "NULL_WITHOUT_ERROR", seq: 8 },
    ];

    expect(flags.map(formatFlag)).toEqual([
      "retryAfterFailure: fixed at #4",
      "retryAfterFailure: not fixed in this conversation",
      "repeatedCall: same input as #2",
      "largeResponse: 149.4 KB",
      "slowCall: 38.0 s",
      "searchLoop: 3 searches without a query",
      "nullWithoutError: null in data without errors",
    ]);
  });
});

describe("describedLabel", () => {
  it("tells no from no query", () => {
    expect((["YES", "NO", "NO_QUERY"] as const).map(describedLabel)).toEqual([
      "yes",
      "no",
      "no query",
    ]);
  });
});

describe("summaryOf", () => {
  it("sums up a query, a search and a description, and nothing else", () => {
    expect(
      summaryOf({ root: "document", payload: { elements: {}, title: true } }),
    ).toBe("document: elements, title");
    expect(summaryOf({ query: "wall height" })).toBe('"wall height"');
    expect(summaryOf({ name: "Wall" })).toBe("Wall");
    expect(summaryOf({ port: 5005 })).toBe("");
  });
});

describe("prettyOf", () => {
  it("formats JSON and keeps other text as it is", () => {
    expect(prettyOf('{"a":[1]}')).toBe('{\n  "a": [\n    1\n  ]\n}');
    expect(prettyOf("Revit is not running.")).toBe("Revit is not running.");
  });
});
