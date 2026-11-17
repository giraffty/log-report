import { ResultAsync } from "neverthrow";
import { analyzeLog } from "#lib/features/call-log/call-log.analyze.ts";
import type { FileError } from "./log-file.errors";
import type { LogFileDispatch } from "./log-file.events";
import type { ReadableFile } from "./log-file.types";

export const readLogFile = (
  file: ReadableFile,
  readId: number,
  dispatch: LogFileDispatch,
): Promise<void> => {
  dispatch({ type: "READ_STARTED", readId, name: file.name });
  return ResultAsync.fromPromise(file.text(), (): FileError => ({
    kind: "Unreadable",
    fileName: file.name,
  }))
    .map(analyzeLog)
    .match(
      (log) => {
        dispatch({ type: "FILE_READ", readId, log });
      },
      (error) => {
        dispatch({ type: "READ_FAILED", readId, error });
      },
    );
};
