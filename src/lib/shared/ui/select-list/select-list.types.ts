import type { TagTone } from "@giraffty/ui";

export type SelectMark = {
  readonly text: string;
  readonly tone: TagTone;
};

export type SelectItem<T> = {
  readonly value: T;
  readonly title: string;
  readonly meta: string;
  readonly marks: readonly SelectMark[];
  readonly selected: boolean;
};

export type SelectListProps<T> = {
  readonly label: string;
  readonly items: readonly SelectItem<T>[];
  readonly onSelect: (value: T) => void;
};
