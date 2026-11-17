import type { AnalyzedLog } from "#lib/features/call-log/call-log.types.ts";
import type { FileError } from "./log-file.errors";

export type LogFileState =
  | { readonly phase: "EMPTY" }
  | {
      readonly phase: "READING";
      readonly readId: number;
      readonly name: string;
    }
  | { readonly phase: "READ"; readonly name: string; readonly log: AnalyzedLog }
  | { readonly phase: "FAILED"; readonly error: FileError };

export type ReadableFile = Pick<File, "name" | "text">;
