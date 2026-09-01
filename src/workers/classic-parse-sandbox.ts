// allow scripts but omit allow-same-origin, so the sandbox runs on an opaque origin
const SANDBOX_PERMISSIONS = 'allow-scripts';

// connect-src 'none' blocks exfil; script-src carries no host, so code can only
// load the blob: urls we build, never a remote collector
const buildSandboxCsp = (nonce: string) =>
    `default-src 'none'; script-src 'nonce-${nonce}' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'`;

// spawns the parser worker from source text (never a url) and relays its result out
const buildSandboxSrcdoc = (nonce: string) => `<!DOCTYPE html><html><head>
<meta http-equiv="Content-Security-Policy" content="${buildSandboxCsp(nonce)}">
</head><body><script nonce="${nonce}">
onmessage = (e) => {
    const { workerSource, engine, script, port } = e.data;
    const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    worker.onmessage = (ev) => { port.postMessage({ result: ev.data }); worker.terminate(); };
    worker.onerror = (ev) => { port.postMessage({ error: ev.message || 'parse error' }); worker.terminate(); };
    worker.postMessage({ engine, script });
};
</script></body></html>`;

export { SANDBOX_PERMISSIONS, buildSandboxCsp, buildSandboxSrcdoc };
