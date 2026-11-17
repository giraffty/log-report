import { match } from "ts-pattern";
import type { LogFileEvent } from "./log-file.events";
import type { LogFileState } from "./log-file.types";

export const INITIAL_LOG_FILE: LogFileState = { phase: "EMPTY" };

export const logFileReducer = (
  state: LogFileState,
  event: LogFileEvent,
): LogFileState =>
  match<LogFileEvent, LogFileState>(event)
    .with({ type: "FILE_REJECTED" }, (e) => ({
      phase: "FAILED",
      error: e.error,
    }))
    .with({ type: "READ_STARTED" }, (e) => ({
      phase: "READING",
      readId: e.readId,
      name: e.name,
    }))
    .with({ type: "FILE_READ" }, (e) =>
      state.phase === "READING" && state.readId === e.readId
        ? { phase: "READ", name: state.name, log: e.log }
        : state,
    )
    .with({ type: "READ_FAILED" }, (e) =>
      state.phase === "READING" && state.readId === e.readId
        ? { phase: "FAILED", error: e.error }
        : state,
    )
    .with({ type: "CLOSED" }, () => INITIAL_LOG_FILE)
    .exhaustive();
