import { describe, expect, it } from "vitest";
import { analyzeLog } from "./call-log.analyze";
import { callsOf, lineAt, wireLine } from "./call-log.fixtures";

describe("analyzeLog", () => {
  it("gives each conversation its flags and metrics, and keeps the lines it could not read", () => {
    const content = [
      wireLine({ isError: true, excerpt: "Revit is not running." }),
      "not json",
    ].join("\n");

    expect(analyzeLog(content)).toEqual({
      conversations: [
        {
          conversation: {
            number: 1,
            session: "s1",
            calls: callsOf(
              lineAt(1, { isError: true, excerpt: "Revit is not running." }),
            ),
          },
          flags: [],
          metrics: {
            calls: 1,
            queries: 1,
            invalidQueries: 0,
            partialQueries: 0,
            totalBytes: 100,
            durationMs: 0,
            describedBeforeQuerying: "NO",
            scripts: { kind: "NONE" },
          },
        },
      ],
      problems: [{ kind: "NotJson", lineNumber: 2 }],
    });
  });
});
