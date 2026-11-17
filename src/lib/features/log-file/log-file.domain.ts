import { err, ok, type Result } from "neverthrow";
import type { FileError } from "./log-file.errors";

export const oneFileOf = <T>(files: readonly T[]): Result<T, FileError> => {
  const [first, ...rest] = files;
  return first === undefined
    ? err({ kind: "NoFile" })
    : rest.length === 0
      ? ok(first)
      : err({ kind: "SeveralFiles", count: files.length });
};
