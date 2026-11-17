export type FilesCallback = (files: readonly File[]) => void;

export type FileDropProps = {
  readonly title: string;
  readonly chooseLabel: string;
  readonly accept: string;
  readonly onFiles: FilesCallback;
};

export type DragState = {
  readonly over: boolean;
  readonly enter: (event: DragEvent) => void;
  readonly leave: () => void;
  readonly end: () => void;
};
