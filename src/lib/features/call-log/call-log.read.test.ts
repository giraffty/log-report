import { describe, expect, it } from "vitest";
import {
  innerCallAt,
  lineAt,
  scriptAt,
  wireLine,
  wireScriptLine,
} from "./call-log.fixtures";
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

  it("reads a script line that sent no queries and hit no limit", () => {
    expect(readLog(wireScriptLine())).toEqual({
      lines: [scriptAt(1)],
      problems: [],
    });
  });

  it("reads a script line with its queries, its limit, its console and the client", () => {
    const line = wireScriptLine({
      client: { name: "claude-ai", version: "1.2.3" },
      innerCalls: [
        {
          seq: 1,
          inputHash: "inner0000001",
          isError: false,
          durationMs: 5,
          responseBytes: 50,
        },
        {
          seq: 2,
          inputHash: "inner0000002",
          isError: true,
          durationMs: 5,
          responseBytes: 50,
          error: "no field x",
        },
      ],
      limit: "time",
      console: "checked",
    });

    expect(readLog(line)).toEqual({
      lines: [
        scriptAt(
          1,
          {
            innerCalls: [
              innerCallAt(1),
              innerCallAt(2, {
                result: { kind: "FAILED", error: "no field x" },
              }),
            ],
            limit: { kind: "STOPPED", name: "time" },
            console: "checked",
          },
          {
            client: { kind: "RECORDED", name: "claude-ai", version: "1.2.3" },
          },
        ),
      ],
      problems: [],
    });
  });

  it("does not take a script line without the keys a script line has", () => {
    expect(
      readLog(wireLine({ tool: "run_script", input: { code: "return 1;" } })),
    ).toEqual({
      lines: [],
      problems: [
        {
          kind: "NotACall",
          lineNumber: 1,
          issues: [
            {
              key: "scriptHash",
              message: "Invalid input: expected string, received undefined",
            },
            {
              key: "innerCalls",
              message: "Invalid input: expected array, received undefined",
            },
            {
              key: "console",
              message: "Invalid input: expected string, received undefined",
            },
          ],
        },
      ],
    });
  });

  it("does not take a query inside a script that threw without its error", () => {
    const line = wireScriptLine({
      innerCalls: [
        {
          seq: 1,
          inputHash: "inner0000001",
          isError: true,
          durationMs: 5,
          responseBytes: 50,
        },
      ],
    });

    expect(readLog(line).problems).toEqual([
      {
        kind: "NotACall",
        lineNumber: 1,
        issues: [
          {
            key: "innerCalls.0.error",
            message: "Invalid input: expected string, received undefined",
          },
        ],
      },
    ]);
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
