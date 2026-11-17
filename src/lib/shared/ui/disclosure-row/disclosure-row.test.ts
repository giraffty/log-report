import { describe, expect, it, vi } from "vitest";
import { markOf, toggleOf } from "./disclosure-row";

describe("toggleOf", () => {
  it("asks for the other state", () => {
    const onExpanded = vi.fn();

    toggleOf(onExpanded, false)();
    toggleOf(onExpanded, true)();

    expect(onExpanded.mock.calls).toEqual([[true], [false]]);
  });
});

describe("markOf", () => {
  it("points down when open and right when closed", () => {
    expect([markOf(true), markOf(false)]).toEqual(["▾", "▸"]);
  });
});
