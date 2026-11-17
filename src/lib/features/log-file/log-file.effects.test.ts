import { describe, expect, it } from "vitest";
import { analyzeLog } from "#lib/features/call-log/call-log.analyze.ts";
import { wireLine } from "#lib/features/call-log/call-log.fixtures.ts";
import type { LogFileEvent } from "./log-file.events";
import { readLogFile } from "./log-file.effects";
import { fileOf } from "./log-file.fixtures";

const dispatched = (): {
  readonly events: LogFileEvent[];
  readonly dispatch: (event: LogFileEvent) => void;
} => {
  const events: LogFileEvent[] = [];
  return {
    events,
    dispatch: (event) => {
      events.push(event);
    },
  };
};

describe("readLogFile", () => {
  it("reads the file and analyzes the log", async () => {
    const { events, dispatch } = dispatched();

    await readLogFile(
      fileOf("anna.jsonl", Promise.resolve(wireLine())),
      4,
      dispatch,
    );

    expect(events).toEqual([
      { type: "READ_STARTED", readId: 4, name: "anna.jsonl" },
      { type: "FILE_READ", readId: 4, log: analyzeLog(wireLine()) },
    ]);
  });

  it("fails with the file's name when the browser cannot read it", async () => {
    const { events, dispatch } = dispatched();

    await readLogFile(
      fileOf(
        "anna.jsonl",
        Promise.reject(new DOMException("gone", "NotReadableError")),
      ),
      4,
      dispatch,
    );

    expect(events).toEqual([
      { type: "READ_STARTED", readId: 4, name: "anna.jsonl" },
      {
        type: "READ_FAILED",
        readId: 4,
        error: { kind: "Unreadable", fileName: "anna.jsonl" },
      },
    ]);
  });
});
