import type { EntityObserver } from '@/editor-api';

editor.once('load', () => {
    /**
     * Copies the specified entities into localStorage
     *
     * @param entities - The entities to copy
     */
    editor.method('entities:copy', (entities: EntityObserver[]) => {
        try {
            // Collect script asset dependencies from entities
            const scriptAssetIds = new Set<string>();
            for (const entity of entities) {
                const scriptComponent = entity.apiEntity.script;
                if (scriptComponent && scriptComponent.scripts) {
                    for (const script of Object.values(scriptComponent.scripts)) {
                        if (script && script.asset) {
                            scriptAssetIds.add(script.asset);
                        }
                    }
                }
            }

            editor.api.globals.entities.copyToClipboard(
                entities.map(e => e.apiEntity),
                { assets: Array.from(scriptAssetIds) }
            );
        } catch (err) {
            if (err.name === 'QuotaExceededError') {
                editor.call('status:error', 'Cannot copy: Selection is too large');
            } else {
                editor.call('status:error', `Copy failed: ${err.message}`);
            }
            console.error('entities:copy error:', err);
        }
    });
});
