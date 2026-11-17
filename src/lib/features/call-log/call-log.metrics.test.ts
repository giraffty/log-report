import { describe, expect, it } from "vitest";
import { callsOf, lineAt } from "./call-log.fixtures";
import { metricsOf } from "./call-log.metrics";

describe("metricsOf", () => {
  it("counts the calls, queries and bytes, and the time from the first call to the last", () => {
    const calls = callsOf(
      lineAt(1, { tool: "describe_type", excerpt: "Wall (context)" }),
      lineAt(2, { excerpt: '{"errors":[{"message":"[GIRAFFTY.AST] x"}]' }),
      lineAt(3, { excerpt: '{"errors":[{"message":"[GIRAFFTY.RT.EXEC] x"}]' }),
      lineAt(5, { responseBytes: 400 }),
    );

    expect(metricsOf(calls)).toEqual({
      calls: 4,
      queries: 3,
      invalidQueries: 1,
      partialQueries: 1,
      totalBytes: 700,
      durationMs: 4000,
      describedBeforeQuerying: "YES",
    });
  });

  it("tells a conversation that queried without describing from one without queries", () => {
    const describe = { tool: "describe_type", excerpt: "Wall (context)" };

    expect(
      metricsOf(callsOf(lineAt(1), lineAt(2, describe)))
        .describedBeforeQuerying,
    ).toBe("NO");
    expect(
      metricsOf(callsOf(lineAt(1, describe))).describedBeforeQuerying,
    ).toBe("NO_QUERY");
  });
});
