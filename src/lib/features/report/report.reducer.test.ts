import { describe, expect, it } from "vitest";
import { INITIAL_REPORT, reportReducer } from "./report.reducer";
import type { ReportState } from "./report.types";

const call = { session: "s1", seq: 3 };
const other = { session: "s2", seq: 3 };

describe("reportReducer", () => {
  it("chooses a conversation and closes the calls of the last one", () => {
    const state: ReportState = { ...INITIAL_REPORT, opened: [call] };

    expect(
      reportReducer(state, { type: "CONVERSATION_CHOSEN", number: 2 }),
    ).toEqual({
      ...INITIAL_REPORT,
      chosen: { kind: "CHOSEN", number: 2 },
    });
  });

  it("keeps the mode and the search text", () => {
    const filtered = reportReducer(
      reportReducer(INITIAL_REPORT, { type: "MODE_CHOSEN", mode: "FLAGGED" }),
      { type: "SEARCH_CHANGED", search: "wall" },
    );

    expect(filtered).toEqual({
      ...INITIAL_REPORT,
      mode: "FLAGGED",
      search: "wall",
    });
  });

  it("opens a call once and closes it again", () => {
    const opened = [
      { type: "CALL_EXPANDED", call, expanded: true },
      { type: "CALL_EXPANDED", call: other, expanded: true },
      { type: "CALL_EXPANDED", call, expanded: true },
    ] as const;
    const state = opened.reduce(reportReducer, INITIAL_REPORT);

    expect(state.opened).toEqual([other, call]);
    expect(
      reportReducer(state, { type: "CALL_EXPANDED", call, expanded: false })
        .opened,
    ).toEqual([other]);
  });

  it("starts over", () => {
    const state: ReportState = {
      chosen: { kind: "CHOSEN", number: 4 },
      mode: "FAILURES",
      search: "x",
      opened: [call],
    };

    expect(reportReducer(state, { type: "RESET" })).toEqual(INITIAL_REPORT);
  });
});
