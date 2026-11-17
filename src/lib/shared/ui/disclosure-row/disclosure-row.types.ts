import type { Snippet } from "svelte";

export type ExpandedCallback = (expanded: boolean) => void;

export type DisclosureRowProps = {
  readonly expanded: boolean;
  readonly onExpanded: ExpandedCallback;
  readonly header: Snippet;
  readonly children: Snippet;
};
