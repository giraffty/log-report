import type { CallId, FilterMode } from "./report.types";

export type ReportEvent =
  | { readonly type: "CONVERSATION_CHOSEN"; readonly number: number }
  | { readonly type: "MODE_CHOSEN"; readonly mode: FilterMode }
  | { readonly type: "SEARCH_CHANGED"; readonly search: string }
  | {
      readonly type: "CALL_EXPANDED";
      readonly call: CallId;
      readonly expanded: boolean;
    }
  | { readonly type: "RESET" };
