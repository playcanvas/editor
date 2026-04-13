export type FingerprintedError = Error & { fingerprint: string; context: unknown[] };
