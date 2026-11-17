import { oneFileOf } from "./log-file.domain";
import { readLogFile } from "./log-file.effects";
import type { LogFileEvent } from "./log-file.events";
import { INITIAL_LOG_FILE, logFileReducer } from "./log-file.reducer";
import type { LogFileState } from "./log-file.types";

export const logFile = $state<{ current: LogFileState }>({
  current: INITIAL_LOG_FILE,
});

let reads = 0;

const dispatch = (event: LogFileEvent): void => {
  logFile.current = logFileReducer(logFile.current, event);
};

export const openFiles = (files: readonly File[]): void => {
  oneFileOf(files).match(
    (file) => {
      reads += 1;
      void readLogFile(file, reads, dispatch);
    },
    (error) => {
      dispatch({ type: "FILE_REJECTED", error });
    },
  );
};

export const closeLog = (): void => {
  dispatch({ type: "CLOSED" });
};
