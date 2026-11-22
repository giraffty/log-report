import { describe, expect, it } from "vitest";
import { lineAt, scriptAt } from "./call-log.fixtures";
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

describe("outcomeOf a script", () => {
  it.each<
    [
      string,
      Parameters<typeof scriptAt>[1],
      Parameters<typeof scriptAt>[2],
      Outcome,
    ]
  >([
    ["a script that returned", {}, {}, "OK"],
    [
      "a script that does not parse",
      {},
      { isError: true, excerpt: "Syntax error at line 1, column 5: x" },
      "SCRIPT_ERROR",
    ],
    [
      "a script that threw",
      {},
      {
        isError: true,
        excerpt: "Run-time error: the script returned nothing.",
      },
      "SCRIPT_ERROR",
    ],
    [
      "a script whose query threw",
      {},
      { isError: true, excerpt: "Query error: no field x" },
      "QUERY_ERROR",
    ],
    [
      "a script a limit stopped",
      { limit: { kind: "STOPPED", name: "time" } },
      { isError: true, excerpt: "Limit: the script ran for more than 30 s" },
      "LIMIT",
    ],
    [
      "a script the user cancelled",
      {},
      {
        isError: true,
        excerpt: "The request was cancelled and the script was stopped.",
      },
      "CANCELLED",
    ],
    [
      "a script the engine could not run",
      {},
      { isError: true, excerpt: "The script engine could not start: x" },
      "UNAVAILABLE",
    ],
  ])("%s", (_, script, overrides, outcome) => {
    expect(outcomeOf(scriptAt(1, script, overrides))).toBe(outcome);
  });
});

describe("isFailed", () => {
  it("counts invalid queries, unavailable tools, missing types and failed scripts as failed", () => {
    const outcomes: readonly Outcome[] = [
      "OK",
      "PARTIAL",
      "INVALID_QUERY",
      "UNAVAILABLE",
      "NOT_FOUND",
      "WEAK_SEARCH",
      "SCRIPT_ERROR",
      "QUERY_ERROR",
      "LIMIT",
      "CANCELLED",
    ];
    expect(outcomes.filter(isFailed)).toEqual([
      "INVALID_QUERY",
      "UNAVAILABLE",
      "NOT_FOUND",
      "SCRIPT_ERROR",
      "QUERY_ERROR",
      "LIMIT",
    ]);
  });
});
