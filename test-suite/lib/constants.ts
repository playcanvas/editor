export const CONSOLE_ALLOWLIST: RegExp[] = [];

export const READY_TIMEOUT = 90_000;

// deliberately longer than the 2 min default test timeout; job-backed tests must
// set test.setTimeout(4 * 60 * 1000) for this diagnostic to surface
export const JOB_TIMEOUT = 3 * 60_000;

// budget for tests that wait on JOB_TIMEOUT
export const JOB_TEST_TIMEOUT = 4 * 60_000;
