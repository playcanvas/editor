editor.once('load', function () {
    'use strict';

    editor.method('templates:computeFilteredOverrides', function (root) {
        const overrides = editor.call('templates:computeOverrides', root);
        if (!overrides) return overrides;

        filterRemovableConflicts(
            overrides, 'children', 'templates:handleChildrenConflict');

        filterRemovableConflicts(
            overrides, 'components.script.order', 'templates:handleScriptOrderConflict');

        editor.call('template:utils', 'markAddRmScriptConflicts', overrides);

        setAllReparentPaths(overrides);

        keepOnePerSubtree(overrides, 'addedEntities');

        keepOnePerSubtree(overrides, 'deletedEntities');

        setNumOverrides(overrides);

        return overrides;

    });

    function filterRemovableConflicts(overrides, path, method)  {
        const a = overrides.conflicts.map(h => {
            return h.path === path ?
                editor.call(method, h, overrides) :
                h;
        });

        overrides.conflicts = editor.call('template:utils', 'rmFalsey', a);
    }

    function setAllReparentPaths(overrides) {
        overrides.conflicts.forEach(h => {
            if (h.path === 'parent') {
                editor.call('templates:setReparentPath', h, overrides);
            }
        });
    }

    function keepOnePerSubtree(overrides, type) {
        const a = overrides[type];

        const h = editor.call('template:utils', 'entArrayToMap', a);

        overrides[type] = a.filter(ent => !h[ent.parent]);
    }

    function setNumOverrides(overrides) {
        overrides.totalOverrides = 0;

        ['conflicts', 'addedEntities', 'deletedEntities'].forEach(k => {
            overrides.totalOverrides += overrides[k].length;
        });
    }
});
