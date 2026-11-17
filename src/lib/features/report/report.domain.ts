import type { CallId } from "./report.types";

export const sameCall = (a: CallId, b: CallId): boolean =>
  a.session === b.session && a.seq === b.seq;
