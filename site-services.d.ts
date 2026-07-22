export const ICHING_ACCESS_CODE: "0000";
export const ICHING_ACCESS_SESSION_KEY: string;
export const VISIT_COUNTER_SESSION_KEY: string;
export const VISIT_COUNTER_ENDPOINT: string;

export type SessionStore = Pick<Storage, "getItem" | "setItem">;
export type VisitCounterOptions = {
  fetchImpl?: typeof fetch;
  sessionStore?: SessionStore | null;
  signal?: AbortSignal;
};

export function isIChingAccessCode(value: unknown): boolean;
export function hasIChingAccess(sessionStore?: SessionStore | null): boolean;
export function rememberIChingAccess(sessionStore?: SessionStore | null): boolean;
export function parseVisitCount(payload: unknown): number;
export function loadCumulativeVisitCount(options?: VisitCounterOptions): Promise<{ value: number; incremented: boolean }>;
