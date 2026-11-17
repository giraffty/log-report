import { describe, expect, it } from "vitest";
import { callsOf, lineAt } from "./call-log.fixtures";
import { flagsOf } from "./call-log.flags";

const INVALID = '{"errors":[{"message":"[GIRAFFTY.SCHEMA] x"}]';

describe("flagsOf", () => {
  it("flags the problems seen in real sessions, in call order", () => {
    const calls = callsOf(
      lineAt(1, { excerpt: INVALID }),
      lineAt(2, { inputHash: "export", durationMs: 38_000 }),
      lineAt(3, { inputHash: "export", durationMs: 40_000 }),
      lineAt(4, { responseBytes: 153_000 }),
      lineAt(5, { tool: "search_schema", excerpt: "Wall (context)" }),
      lineAt(6, { tool: "search_schema", excerpt: "Wall (context)" }),
      lineAt(7, { tool: "search_schema", excerpt: "Wall (context)" }),
      lineAt(8, { excerpt: '{"errors":[],"data":{"value":null}}' }),
    );

    expect(flagsOf(calls)).toEqual([
      {
        kind: "RETRY_AFTER_FAILURE",
        seq: 1,
        fix: { kind: "FIXED_AT", seq: 2 },
      },
      { kind: "SLOW_CALL", seq: 2, durationMs: 38_000 },
      { kind: "REPEATED_CALL", seq: 3, sameAs: 2 },
      { kind: "SLOW_CALL", seq: 3, durationMs: 40_000 },
      { kind: "LARGE_RESPONSE", seq: 4, bytes: 153_000 },
      { kind: "SEARCH_LOOP", seq: 7 },
      { kind: "NULL_WITHOUT_ERROR", seq: 8 },
    ]);
  });

  it("says when a failed query is not fixed in the conversation", () => {
    const calls = callsOf(
      lineAt(1, { excerpt: INVALID }),
      lineAt(2, { tool: "describe_type", excerpt: "Wall (context)" }),
    );

    expect(flagsOf(calls)).toEqual([
      { kind: "RETRY_AFTER_FAILURE", seq: 1, fix: { kind: "NOT_FIXED" } },
    ]);
  });

  it("does not flag repeating a call without input", () => {
    const calls = callsOf(
      lineAt(1, { tool: "get_revit_session", input: {}, inputHash: "empty" }),
      lineAt(2, { tool: "get_revit_session", input: {}, inputHash: "empty" }),
    );

    expect(flagsOf(calls)).toEqual([]);
  });

  it("starts counting searches again after a query, not after other tools", () => {
    const search = { tool: "search_schema", excerpt: "Wall (context)" };
    const calls = callsOf(
      lineAt(1, search),
      lineAt(2, search),
      lineAt(3),
      lineAt(4, search),
      lineAt(5, { tool: "describe_type", excerpt: "Wall (context)" }),
      lineAt(6, search),
    );

    expect(flagsOf(calls)).toEqual([]);
  });

  it("does not flag null in a query with errors", () => {
    const calls = callsOf(
      lineAt(1, {
        excerpt: '{"errors":[{"message":"x"}],"data":{"value":null}}',
      }),
    );

    expect(flagsOf(calls)).toEqual([]);
  });
});
