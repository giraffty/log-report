import { describe, expect, it, vi } from "vitest";
import { currentOf, selectOf } from "./select-list";

describe("selectOf", () => {
  it("selects the item's value", () => {
    const onSelect = vi.fn();

    selectOf(onSelect, 3)();

    expect(onSelect).toHaveBeenCalledWith(3);
  });
});

describe("currentOf", () => {
  it("marks the selected item as current", () => {
    expect([currentOf(true), currentOf(false)]).toEqual(["true", "false"]);
  });
});
