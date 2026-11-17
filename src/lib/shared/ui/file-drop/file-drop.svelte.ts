import type { DragState, FilesCallback } from "./file-drop.types";

export const keepInPage = (event: Event): void => {
  event.preventDefault();
};

export const dragStateOf = (): DragState => {
  let depth = $state(0);
  return {
    get over(): boolean {
      return depth > 0;
    },
    enter: (event: DragEvent): void => {
      event.preventDefault();
      depth += 1;
    },
    leave: (): void => {
      depth = Math.max(depth - 1, 0);
    },
    end: (): void => {
      depth = 0;
    },
  };
};

export const dropOf =
  (drag: DragState, onFiles: FilesCallback) =>
  (event: DragEvent): void => {
    event.preventDefault();
    drag.end();
    onFiles([...(event.dataTransfer?.files ?? [])]);
  };

export const chooseOf =
  (onFiles: FilesCallback) =>
  (event: Event): void => {
    if (event.currentTarget instanceof HTMLInputElement) {
      const files = [...(event.currentTarget.files ?? [])];
      event.currentTarget.value = "";
      onFiles(files);
    }
  };
