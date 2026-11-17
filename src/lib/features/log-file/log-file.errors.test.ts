import { describe, expect, it } from "vitest";
import { formatFileError } from "./log-file.errors";

describe("formatFileError", () => {
  it("says what to drop and what went wrong", () => {
    expect(formatFileError({ kind: "NoFile" })).toBe(
      "Drop a file: the call log, mcp-calls.jsonl.",
    );
    expect(formatFileError({ kind: "SeveralFiles", count: 3 })).toBe(
      "3 files were dropped. Drop one call log at a time.",
    );
    expect(
      formatFileError({ kind: "Unreadable", fileName: "anna.jsonl" }),
    ).toBe(
      "anna.jsonl could not be read. It may have been moved, or be open in another program.",
    );
  });
});
