export const CONSOLE_ALLOWLIST: RegExp[] = [];

export const READY_TIMEOUT = 90_000;

// deliberately longer than the 2 min default test timeout; job-backed tests must
// set test.setTimeout(4 * 60 * 1000) for this diagnostic to surface
export const JOB_TIMEOUT = 3 * 60_000;

// budget for tests that wait on JOB_TIMEOUT
export const JOB_TEST_TIMEOUT = 4 * 60_000;

// the esm script worker boot, after which scripts:handleParse is registered
export const WORKER_INIT_TIMEOUT = 30_000;

// only an e2e project older than this is a leftover; a newer one may belong to a run in
// flight, on this machine or another
export const STALE_PROJECT_AGE = 2 * 60 * 60_000;
