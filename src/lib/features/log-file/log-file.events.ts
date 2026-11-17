import type { AnalyzedLog } from "#lib/features/call-log/call-log.types.ts";
import type { FileError } from "./log-file.errors";

export type LogFileEvent =
  | { readonly type: "FILE_REJECTED"; readonly error: FileError }
  | {
      readonly type: "READ_STARTED";
      readonly readId: number;
      readonly name: string;
    }
  | {
      readonly type: "FILE_READ";
      readonly readId: number;
      readonly log: AnalyzedLog;
    }
  | {
      readonly type: "READ_FAILED";
      readonly readId: number;
      readonly error: FileError;
    }
  | { readonly type: "CLOSED" };

export type LogFileDispatch = (event: LogFileEvent) => void;
