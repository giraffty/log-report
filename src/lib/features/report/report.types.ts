import type { ButtonVariant, OptionalText, TagTone } from "@giraffty/ui";
import type { SelectItem } from "#lib/shared/ui/select-list/select-list.types.ts";

export type FilterMode = "ALL" | "FAILURES" | "FLAGGED";

export type CallId = {
  readonly session: string;
  readonly seq: number;
};

type ChosenConversation =
  | { readonly kind: "FIRST" }
  | { readonly kind: "CHOSEN"; readonly number: number };

export type ReportState = {
  readonly chosen: ChosenConversation;
  readonly mode: FilterMode;
  readonly search: string;
  readonly opened: readonly CallId[];
};

export type Row = {
  readonly label: string;
  readonly value: string;
};

type FlagList =
  | { readonly kind: "NONE" }
  | { readonly kind: "FLAGS"; readonly texts: readonly string[] };

export type CallDetail =
  | { readonly kind: "CLOSED" }
  | {
      readonly kind: "OPEN";
      readonly flags: FlagList;
      readonly sent: string;
      readonly receivedLabel: string;
      readonly received: string;
      readonly cut: OptionalText;
      readonly meta: readonly Row[];
    };

export type CallView = {
  readonly key: string;
  readonly id: CallId;
  readonly time: string;
  readonly seq: string;
  readonly tool: string;
  readonly outcome: { readonly label: string; readonly tone: TagTone };
  readonly duration: string;
  readonly size: string;
  readonly summary: string;
  readonly flagMark: OptionalText;
  readonly expanded: boolean;
  readonly detail: CallDetail;
};

export type ConversationView = {
  readonly title: string;
  readonly metrics: readonly Row[];
  readonly calls: readonly CallView[];
};

export type ModeOption = {
  readonly mode: FilterMode;
  readonly label: string;
  readonly pressed: boolean;
  readonly variant: ButtonVariant;
};

export type ProblemsView =
  | { readonly kind: "NONE" }
  | {
      readonly kind: "LINES";
      readonly title: string;
      readonly lines: readonly string[];
    };

export type ShownView =
  | { readonly kind: "CONVERSATION"; readonly conversation: ConversationView }
  | { readonly kind: "NOTHING"; readonly text: string };

export type ReportView = {
  readonly summary: string;
  readonly problems: ProblemsView;
  readonly modes: readonly ModeOption[];
  readonly conversations: readonly SelectItem<number>[];
  readonly shown: ShownView;
};
