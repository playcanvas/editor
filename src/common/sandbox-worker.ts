/**
 * Runs a worker from source text in an opaque-origin, network-less sandbox iframe, posts it `data`
 * and resolves with the first message it sends back. Use it for anything that evaluates user code,
 * so that code never runs on the Editor's origin.
 *
 * @param workerSource - The worker's source text.
 * @param data - The message to post to the worker.
 * @param timeout - Milliseconds to wait for a reply before rejecting.
 * @returns The worker's reply.
 */
export const runSandboxedWorker = (workerSource: string, data: unknown, timeout: number) =>
    new Promise<unknown>((resolve, reject) => {
        // allow scripts but omit allow-same-origin, so the sandbox runs on an opaque origin
        const iframe = document.createElement('iframe');
        iframe.setAttribute('sandbox', 'allow-scripts');
        iframe.style.display = 'none';

        // connect-src 'none' blocks exfil; script-src carries no host, so code can only
        // load the blob: urls we build, never a remote collector
        const nonce = crypto.randomUUID();
        const csp = `default-src 'none'; script-src 'nonce-${nonce}' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'`;

        // spawn the worker from source text (never a url) and relay its result out; never
        // revoke the worker url (webkit then blocks the worker's own blob importScripts), removing
        // the iframe frees it
        iframe.srcdoc = /* html */ `<!DOCTYPE html><html><head>
<meta http-equiv="Content-Security-Policy" content="${csp}">
</head><body><script nonce="${nonce}">
onmessage = (e) => {
    const { workerSource, data, port } = e.data;
    const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    // not revoked: on the opaque origin the worker loads the blob after new Worker() returns, and
    // removing the iframe frees it
    const worker = new Worker(url);
    worker.onmessage = (ev) => { port.postMessage({ result: ev.data }); worker.terminate(); };
    worker.onerror = (ev) => { port.postMessage({ error: ev.message || 'parse error' }); worker.terminate(); };
    worker.postMessage(data);
};
</script></body></html>`;

        const channel = new MessageChannel();
        let settled = false;
        const cleanup = () => {
            settled = true;
            channel.port1.close();
            iframe.remove();
        };

        const timer = setTimeout(() => {
            if (settled) {
                return;
            }
            cleanup();
            reject(new Error('Timed out while parsing a script'));
        }, timeout);

        channel.port1.onmessage = (evt) => {
            if (settled) {
                return;
            }
            clearTimeout(timer);
            cleanup();
            const { result, error } = evt.data;
            if (error) {
                reject(new Error(error));
                return;
            }
            resolve(result);
        };

        iframe.onload = () => {
            iframe.contentWindow?.postMessage({ workerSource, data, port: channel.port2 }, '*', [channel.port2]);
        };

        document.body.appendChild(iframe);
    });
