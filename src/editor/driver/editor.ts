import { driver } from './driver';
import { api, log } from './shared';

// selection
driver.method('selection:get', () => {
    const items = api.selection.items || [];
    const type = editor.call('selector:type');
    const ids = items.map((it) => (type === 'asset' ? it.get('id') : it.get('resource_id')));
    log('Queried selection');
    return { data: { type, ids } };
});
driver.method('selection:set', (type, ids) => {
    const items = (ids || [])
        .map((id) => (type === 'asset' ? api.assets.get(id) : api.entities.get(id)))
        .filter(Boolean);
    api.selection.set(items);
    log(`Set ${type} selection (${items.length})`);
    return { data: { type, ids: items.map((it) => (type === 'asset' ? it.get('id') : it.get('resource_id'))) } };
});
driver.method('selection:clear', () => {
    api.selection.clear();
    log('Cleared selection');
    return { data: { type: null, ids: [] } };
});

// history (undo/redo)
driver.method('history:undo', () => {
    const undone = api.history.canUndo;
    if (undone) {
        api.history.undo();
    }
    log(undone ? 'Undo' : 'Undo (nothing to undo)');
    return { data: { undone, canUndo: api.history.canUndo, canRedo: api.history.canRedo } };
});
driver.method('history:redo', () => {
    const redone = api.history.canRedo;
    if (redone) {
        api.history.redo();
    }
    log(redone ? 'Redo' : 'Redo (nothing to redo)');
    return { data: { redone, canUndo: api.history.canUndo, canRedo: api.history.canRedo } };
});
driver.method('editor:logs', (options: any = {}) => editor.call('console:query', options));

// transform gizmo
driver.method('gizmo:state:set', (state) => {
    const s = state || {};
    if (s.mode !== undefined) {
        editor.call('gizmo:type', s.mode);
    }
    if (s.space !== undefined) {
        editor.call('gizmo:coordSystem', s.space);
    }
    if (s.snap !== undefined) {
        editor.call('gizmo:snap', s.snap);
    }
    log('Set gizmo state');
    return { data: { mode: editor.call('gizmo:type'), space: editor.call('gizmo:coordSystem') } };
});
