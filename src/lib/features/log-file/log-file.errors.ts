import { match } from "ts-pattern";

export type FileError =
  | { readonly kind: "NoFile" }
  | { readonly kind: "SeveralFiles"; readonly count: number }
  | { readonly kind: "Unreadable"; readonly fileName: string };

export const formatFileError = (error: FileError): string =>
  match(error)
    .with(
      { kind: "NoFile" },
      () => "Drop a file: the call log, mcp-calls.jsonl.",
    )
    .with(
      { kind: "SeveralFiles" },
      (e) => `${e.count} files were dropped. Drop one call log at a time.`,
    )
    .with(
      { kind: "Unreadable" },
      (e) =>
        `${e.fileName} could not be read. It may have been moved, or be open in another program.`,
    )
    .exhaustive();
