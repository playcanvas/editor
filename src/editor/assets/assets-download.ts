import type { AssetObserver } from '@/editor-api';

import { planDownload } from './archive/entries';
import { STARTUP_FAILED } from './assets-archive';

// larger archives stream through the server job instead of sitting in browser memory
const MAX_ARCHIVE_BYTES = 256 * 1024 * 1024;

const click = (href: string, name?: string) => {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = href;
    if (name !== undefined) {
        a.download = name;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const save = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    click(url, name);
    // revoking in the same tick can cancel large downloads in some browsers
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

editor.once('load', () => {
    // Asset types that don't have uploaded files and need client-side JSON download
    const dataOnlyAssets = new Set(['animstategraph']);

    editor.method('assets:download', (asset: AssetObserver) => {
        if (dataOnlyAssets.has(asset.get('type'))) {
            // Data-only assets need client-side JSON serialization
            const data = asset.get('data');
            save(new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' }), `${asset.get('name')}.json`);
            return;
        }

        const branchId = (config.self.branch as { id: string }).id;
        const serverUrl = `/api/assets/${asset.get('id')}/download?branchId=${branchId}`;
        const res = planDownload(asset, (id) => editor.call('assets:get', id), branchId, MAX_ARCHIVE_BYTES);
        if (res.mode === 'error') {
            editor.call('status:error', `Download failed: ${res.error}`);
            return;
        }
        if (res.mode === 'client') {
            const { plan } = res;
            editor.call('assets:archive', plan).then(([err, blob]: [string | null, Blob | null]) => {
                // the click gesture is gone by now, so fall back with a same-tab link, not a popup;
                // the route's content-disposition keeps it a download rather than a navigation
                if (err === STARTUP_FAILED) {
                    click(serverUrl);
                } else if (err) {
                    editor.call('status:error', `Download failed: ${err}`);
                } else {
                    save(blob!, plan.name);
                }
            });
            return;
        }

        // unsupported type, source asset or over the cap: a popup from inside the click, so the
        // download route's filename handling (special characters like #) still applies
        window.open(serverUrl);
    });
});
