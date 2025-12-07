editor.once('load', () => {
    // Asset types that don't have uploaded files and need client-side JSON download
    const dataOnlyAssets = new Set([
        'animstategraph'
    ]);

    editor.method('assets:download', (asset) => {
        if (dataOnlyAssets.has(asset.get('type'))) {
            // Data-only assets need client-side JSON serialization
            const data = asset.get('data');
            const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = URL.createObjectURL(blob);
            a.download = `${asset.get('name')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } else {
            // Use the download API endpoint which properly handles filenames
            // including special characters like # that would otherwise be URL-encoded
            const branchId = (config.self.branch as { id: string }).id;
            window.open(`/api/assets/${asset.get('id')}/download?branchId=${branchId}`);
        }
    });
});
