import { match } from "ts-pattern";
import { sameCall } from "./report.domain";
import type { ReportEvent } from "./report.events";
import type { CallId, ReportState } from "./report.types";

export const INITIAL_REPORT: ReportState = {
  chosen: { kind: "FIRST" },
  mode: "ALL",
  search: "",
  opened: [],
};

const withCall = (
  opened: readonly CallId[],
  call: CallId,
  expanded: boolean,
): readonly CallId[] => [
  ...opened.filter((id) => !sameCall(id, call)),
  ...(expanded ? [call] : []),
];

export const reportReducer = (
  state: ReportState,
  event: ReportEvent,
): ReportState =>
  match<ReportEvent, ReportState>(event)
    .with({ type: "CONVERSATION_CHOSEN" }, (e) => ({
      ...state,
      chosen: { kind: "CHOSEN", number: e.number },
      opened: [],
    }))
    .with({ type: "MODE_CHOSEN" }, (e) => ({ ...state, mode: e.mode }))
    .with({ type: "SEARCH_CHANGED" }, (e) => ({ ...state, search: e.search }))
    .with({ type: "CALL_EXPANDED" }, (e) => ({
      ...state,
      opened: withCall(state.opened, e.call, e.expanded),
    }))
    .with({ type: "RESET" }, () => INITIAL_REPORT)
    .exhaustive();
