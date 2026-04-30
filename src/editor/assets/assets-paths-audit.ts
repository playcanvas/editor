import type { Observer } from '@playcanvas/observer';

const dedupePath = (path: (string | number)[]) => {
    const seen = new Set<string>();
    const out: (string | number)[] = [];
    for (const id of path) {
        const key = String(id);
        if (!seen.has(key)) {
            seen.add(key);
            out.push(id);
        }
    }
    return out;
};

const hasDuplicates = (path: (string | number)[] | null | undefined) => {
    if (!path || path.length < 2) {
        return false;
    }
    const seen = new Set<string>();
    for (const id of path) {
        const key = String(id);
        if (seen.has(key)) {
            return true;
        }
        seen.add(key);
    }
    return false;
};

const startChecker = () => {
    const pathFixes = new Set<string>();

    const checkAsset = (asset: Observer) => {
        const id = asset.get('id');
        if (hasDuplicates(asset.get('path'))) {
            pathFixes.add(id);
        } else {
            pathFixes.delete(id);
        }
    };

    const watchAsset = (asset: Observer) => {
        checkAsset(asset);
        asset.on('path:set', () => {
            checkAsset(asset);
            editor.call('assets:auditor:report', 'paths', pathFixes.size, 0);
        });
    };

    editor.method('assets:paths:issues', () => {
        return { fixes: new Set(pathFixes) };
    });

    editor.on('assets:paths:fixes:apply', () => {
        const previous = new Map<string, Array<string | number>>();

        const undo = () => {
            for (const [id, oldPath] of previous) {
                const asset = editor.call('assets:get', id);
                if (!asset) {
                    continue;
                }
                asset.history.enabled = false;
                asset.set('path', oldPath);
                asset.history.enabled = true;
                pathFixes.add(id);
                editor.call('console:log:asset', asset, `asset path was reverted to [${oldPath.join(', ')}]`);
            }
            previous.clear();
            editor.call('assets:auditor:report', 'paths', pathFixes.size, 0);
        };

        const redo = () => {
            for (const id of pathFixes) {
                const asset = editor.call('assets:get', id);
                if (!asset) {
                    continue;
                }
                const oldPath = asset.get('path') || [];
                const newPath = dedupePath(oldPath);
                previous.set(id, oldPath.slice());
                asset.history.enabled = false;
                asset.set('path', newPath);
                asset.history.enabled = true;
                editor.call('console:log:asset', asset, `asset path was deduped from [${oldPath.join(', ')}] to [${newPath.join(', ')}]`);
            }
            pathFixes.clear();
            editor.call('assets:auditor:report', 'paths', pathFixes.size, 0);
        };

        editor.api.globals.history.add({
            name: 'asset path duplicates fix',
            combine: false,
            undo,
            redo
        });

        redo();
    });

    editor.call('assets:list').forEach(watchAsset);
    editor.call('assets:auditor:report', 'paths', pathFixes.size, 0);

    editor.on('assets:add', watchAsset);
    editor.on('assets:remove', (asset: Observer) => {
        pathFixes.delete(asset.get('id'));
        editor.call('assets:auditor:report', 'paths', pathFixes.size, 0);
    });
};

editor.once('assets:load', () => {
    startChecker();
});
