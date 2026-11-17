import type { ExpandedCallback } from "./disclosure-row.types";

export const toggleOf =
  (onExpanded: ExpandedCallback, expanded: boolean) => (): void => {
    onExpanded(!expanded);
  };

export const markOf = (expanded: boolean): string => (expanded ? "▾" : "▸");
