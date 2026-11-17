import { describe, expect, it } from "vitest";
import { EMPTY_LOG } from "./log-file.fixtures";
import { INITIAL_LOG_FILE, logFileReducer } from "./log-file.reducer";
import type { LogFileState } from "./log-file.types";

const reading: LogFileState = {
  phase: "READING",
  readId: 2,
  name: "anna.jsonl",
};

describe("logFileReducer", () => {
  it("starts reading a file, from any state", () => {
    const read: LogFileState = {
      phase: "READ",
      name: "old.jsonl",
      log: EMPTY_LOG,
    };

    expect(
      logFileReducer(read, {
        type: "READ_STARTED",
        readId: 2,
        name: "anna.jsonl",
      }),
    ).toEqual(reading);
  });

  it("shows the log of the file it is reading", () => {
    expect(
      logFileReducer(reading, { type: "FILE_READ", readId: 2, log: EMPTY_LOG }),
    ).toEqual({ phase: "READ", name: "anna.jsonl", log: EMPTY_LOG });
  });

  it("ignores the log of a file it no longer reads", () => {
    expect(
      logFileReducer(reading, { type: "FILE_READ", readId: 1, log: EMPTY_LOG }),
    ).toEqual(reading);
    expect(
      logFileReducer(INITIAL_LOG_FILE, {
        type: "FILE_READ",
        readId: 2,
        log: EMPTY_LOG,
      }),
    ).toEqual(INITIAL_LOG_FILE);
  });

  it("fails when the file it is reading cannot be read, and only then", () => {
    const error = { kind: "Unreadable", fileName: "anna.jsonl" } as const;

    expect(
      logFileReducer(reading, { type: "READ_FAILED", readId: 2, error }),
    ).toEqual({
      phase: "FAILED",
      error,
    });
    expect(
      logFileReducer(reading, { type: "READ_FAILED", readId: 1, error }),
    ).toEqual(reading);
    expect(
      logFileReducer(INITIAL_LOG_FILE, {
        type: "READ_FAILED",
        readId: 2,
        error,
      }),
    ).toEqual(INITIAL_LOG_FILE);
  });

  it("fails without reading when the drop is not one file", () => {
    expect(
      logFileReducer(INITIAL_LOG_FILE, {
        type: "FILE_REJECTED",
        error: { kind: "SeveralFiles", count: 2 },
      }),
    ).toEqual({ phase: "FAILED", error: { kind: "SeveralFiles", count: 2 } });
  });

  it("closes the log", () => {
    expect(
      logFileReducer(
        { phase: "READ", name: "anna.jsonl", log: EMPTY_LOG },
        { type: "CLOSED" },
      ),
    ).toEqual(INITIAL_LOG_FILE);
  });
});
