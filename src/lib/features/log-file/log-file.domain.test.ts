import { err, ok } from "neverthrow";
import { describe, expect, it } from "vitest";
import { oneFileOf } from "./log-file.domain";

describe("oneFileOf", () => {
  it("takes the one file", () => {
    expect(oneFileOf(["anna.jsonl"])).toEqual(ok("anna.jsonl"));
  });

  it("refuses no file and several files", () => {
    expect(oneFileOf([])).toEqual(err({ kind: "NoFile" }));
    expect(oneFileOf(["a.jsonl", "b.jsonl"])).toEqual(
      err({ kind: "SeveralFiles", count: 2 }),
    );
  });
});
