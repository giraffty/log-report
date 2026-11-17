import { describe, expect, it } from "vitest";
import { lineAt, wireLine } from "./call-log.fixtures";
import { readLog } from "./call-log.read";

describe("readLog", () => {
  it("reads a line of the Rust server", () => {
    expect(readLog(wireLine())).toEqual({ lines: [lineAt(1)], problems: [] });
  });

  it("reads a line of the TypeScript server, which names no server and no version", () => {
    expect(
      readLog(wireLine({ server: undefined, mcpVersion: undefined })),
    ).toEqual({
      lines: [
        lineAt(1, {
          server: "TYPESCRIPT",
          mcpVersion: { kind: "NOT_RECORDED" },
        }),
      ],
      problems: [],
    });
  });

  it("accepts keys it does not know", () => {
    expect(readLog(wireLine({ addedLater: 1 }))).toEqual({
      lines: [lineAt(1)],
      problems: [],
    });
  });

  it("keeps the lines it can read and the line numbers of those it cannot", () => {
    const content = [
      wireLine(),
      "",
      "{cut off",
      wireLine({
        seq: 2,
        ts: "2026-10-20T15:00:02.000Z",
        inputHash: "hash00000002",
      }),
      "",
    ].join("\r\n");

    expect(readLog(content)).toEqual({
      lines: [lineAt(1), lineAt(2)],
      problems: [{ kind: "NotJson", lineNumber: 3 }],
    });
  });

  it("names the keys that are missing or wrong", () => {
    expect(readLog(wireLine({ tool: undefined, ts: "yesterday" }))).toEqual({
      lines: [],
      problems: [
        {
          kind: "NotACall",
          lineNumber: 1,
          issues: [
            { key: "ts", message: "Invalid ISO datetime" },
            {
              key: "tool",
              message: "Invalid input: expected string, received undefined",
            },
          ],
        },
      ],
    });
  });

  it("does not take JSON that is not an object for a call", () => {
    expect(readLog("5")).toEqual({
      lines: [],
      problems: [
        {
          kind: "NotACall",
          lineNumber: 1,
          issues: [
            {
              key: "",
              message: "Invalid input: expected object, received number",
            },
          ],
        },
      ],
    });
  });
});
