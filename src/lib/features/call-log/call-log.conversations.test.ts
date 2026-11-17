import { describe, expect, it } from "vitest";
import { conversationsOf } from "./call-log.conversations";
import { callsOf, lineAt } from "./call-log.fixtures";

const MINUTE = 60 * 1000;

describe("conversationsOf", () => {
  it("splits a session where it pauses for more than two minutes", () => {
    const first = lineAt(1);
    const second = lineAt(2, { at: first.at + 2 * MINUTE });
    const third = lineAt(3, { at: second.at + 2 * MINUTE + 1 });

    expect(conversationsOf([first, second, third])).toEqual([
      { number: 1, session: "s1", calls: callsOf(first, second) },
      { number: 2, session: "s1", calls: callsOf(third) },
    ]);
  });

  it("keeps the sessions apart, in the order they first appear, with calls in order", () => {
    const a1 = lineAt(1, { session: "a" });
    const b1 = lineAt(1, { session: "b" });
    const a2 = lineAt(2, { session: "a" });

    expect(conversationsOf([a2, b1, a1])).toEqual([
      { number: 1, session: "a", calls: callsOf(a1, a2) },
      { number: 2, session: "b", calls: callsOf(b1) },
    ]);
  });

  it("has no conversations without lines", () => {
    expect(conversationsOf([])).toEqual([]);
  });
});
