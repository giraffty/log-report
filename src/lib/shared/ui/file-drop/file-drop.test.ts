import { describe, expect, it, vi } from "vitest";
import { chooseOf, dragStateOf, dropOf, keepInPage } from "./file-drop.svelte";

const fileNamed = (name: string): File => new File(["{}"], name);

const transferOf = (files: readonly File[]): DataTransfer => {
  const transfer = new DataTransfer();
  files.forEach((file) => transfer.items.add(file));
  return transfer;
};

const dragEvent = (type: string, init: DragEventInit = {}): DragEvent =>
  new DragEvent(type, { cancelable: true, ...init });

describe("keepInPage", () => {
  it("stops the browser from opening a file dropped outside the drop area", () => {
    const event = dragEvent("drop");
    keepInPage(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe("dragStateOf", () => {
  it("is over while a drag is inside the area, also over its children", () => {
    const drag = dragStateOf();
    const entering = dragEvent("dragenter");

    drag.enter(entering);
    drag.enter(dragEvent("dragenter"));
    drag.leave();

    expect(entering.defaultPrevented).toBe(true);
    expect(drag.over).toBe(true);

    drag.leave();
    drag.leave();

    expect(drag.over).toBe(false);
  });
});

describe("dropOf", () => {
  it("hands over the dropped files and ends the drag", () => {
    const drag = dragStateOf();
    const onFiles = vi.fn();
    const file = fileNamed("anna.jsonl");
    const event = dragEvent("drop", { dataTransfer: transferOf([file]) });
    drag.enter(dragEvent("dragenter"));

    dropOf(drag, onFiles)(event);

    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(event.defaultPrevented).toBe(true);
    expect(drag.over).toBe(false);
  });

  it("hands over no files when the drop carries none", () => {
    const onFiles = vi.fn();

    dropOf(dragStateOf(), onFiles)(dragEvent("drop"));

    expect(onFiles).toHaveBeenCalledWith([]);
  });
});

describe("chooseOf", () => {
  it("hands over the chosen files and clears the input, so the same file can be chosen again", () => {
    const onFiles = vi.fn();
    const file = fileNamed("anna.jsonl");
    const input = document.createElement("input");
    input.type = "file";
    input.files = transferOf([file]).files;
    input.addEventListener("change", chooseOf(onFiles));

    input.dispatchEvent(new Event("change"));

    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(input.files?.length).toBe(0);
  });

  it("ignores a change from anything but a file input", () => {
    const onFiles = vi.fn();
    const element = document.createElement("div");
    element.addEventListener("change", chooseOf(onFiles));

    element.dispatchEvent(new Event("change"));

    expect(onFiles).not.toHaveBeenCalled();
  });
});
