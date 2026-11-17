import { describe, expect, it } from "vitest";
import { formatLineProblem } from "./call-log.errors";

describe("formatLineProblem", () => {
  it("says a line is not JSON", () => {
    expect(formatLineProblem({ kind: "NotJson", lineNumber: 3 })).toBe(
      "line 3: not JSON",
    );
  });

  it("lists the issues of a line with their keys", () => {
    expect(
      formatLineProblem({
        kind: "NotACall",
        lineNumber: 7,
        issues: [
          { key: "", message: "expected an object" },
          { key: "input.root", message: "expected a string" },
        ],
      }),
    ).toBe("line 7: expected an object; input.root: expected a string");
  });
});
