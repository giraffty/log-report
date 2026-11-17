import type { ReportEvent } from "./report.events";
import { INITIAL_REPORT, reportReducer } from "./report.reducer";
import type { CallId, FilterMode, ReportState } from "./report.types";

export const report = $state<{ current: ReportState }>({
  current: INITIAL_REPORT,
});

const dispatch = (event: ReportEvent): void => {
  report.current = reportReducer(report.current, event);
};

export const chooseConversation = (number: number): void => {
  dispatch({ type: "CONVERSATION_CHOSEN", number });
};

export const chooseModeOf = (mode: FilterMode) => (): void => {
  dispatch({ type: "MODE_CHOSEN", mode });
};

export const search = (text: string): void => {
  dispatch({ type: "SEARCH_CHANGED", search: text });
};

export const expandCallOf =
  (call: CallId) =>
  (expanded: boolean): void => {
    dispatch({ type: "CALL_EXPANDED", call, expanded });
  };

export const resetReport = (): void => {
  dispatch({ type: "RESET" });
};
