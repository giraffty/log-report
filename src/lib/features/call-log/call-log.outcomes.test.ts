import { describe, expect, it } from "vitest";
import { lineAt } from "./call-log.fixtures";
import { isFailed, outcomeOf } from "./call-log.outcomes";
import type { Outcome } from "./call-log.types";

describe("outcomeOf", () => {
  it.each<[string, Parameters<typeof lineAt>[1], Outcome]>([
    ["a query without errors", {}, "OK"],
    [
      "a query the schema rejects",
      { excerpt: '{"errors":[{"message":"[GIRAFFTY.SCHEMA] no field x"}]' },
      "INVALID_QUERY",
    ],
    [
      "a mutation with wrong arguments",
      {
        tool: "mutate",
        excerpt: '{"errors":[{"message":"[GIRAFFTY.RT.ARGS] x"}]',
      },
      "INVALID_QUERY",
    ],
    [
      "a query with fields that failed",
      { excerpt: '{"errors":[{"message":"[GIRAFFTY.RT.EXEC] failed"}]' },
      "PARTIAL",
    ],
    [
      "a type that does not exist",
      { tool: "describe_type", isError: true },
      "NOT_FOUND",
    ],
    ["a tool that could not run", { isError: true }, "UNAVAILABLE"],
    [
      "a search without matches",
      { tool: "search_schema", excerpt: 'No matches for "zzzz".' },
      "WEAK_SEARCH",
    ],
    [
      "a search of mostly enum values",
      {
        tool: "search_schema",
        excerpt: "A.x (enum value)\nA.y (enum value)\nWall (context)",
      },
      "WEAK_SEARCH",
    ],
    [
      "a search with types",
      { tool: "search_schema", excerpt: "Wall (context)\nA.x (enum value)" },
      "OK",
    ],
    ["any other tool", { tool: "ping", excerpt: "pong" }, "OK"],
  ])("%s", (_, overrides, outcome) => {
    expect(outcomeOf(lineAt(1, overrides))).toBe(outcome);
  });
});

describe("isFailed", () => {
  it("counts invalid queries, unavailable tools and missing types as failed", () => {
    const outcomes: readonly Outcome[] = [
      "OK",
      "PARTIAL",
      "INVALID_QUERY",
      "UNAVAILABLE",
      "NOT_FOUND",
      "WEAK_SEARCH",
    ];
    expect(outcomes.filter(isFailed)).toEqual([
      "INVALID_QUERY",
      "UNAVAILABLE",
      "NOT_FOUND",
    ]);
  });
});
