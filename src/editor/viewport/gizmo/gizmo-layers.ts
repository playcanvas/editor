import { Layer, SORTMODE_BACK2FRONT, SORTMODE_NONE } from 'playcanvas';

editor.once('load', () => {
    // holds all layers that are to be added in the beginning of the composition
    const layerIndexBefore = {};
    // holds all layers that are to be added to the end of the composition
    const layerIndexAfter = {};
    // holds all layers by name
    const nameIndex = {};

    // true if the layer is renderable by the Editor (false when it's just added to the composition)
    const layerRenderable = new Map();

    let id = 1000000000;

    editor.method('gizmo:layers:register', (name, insertToBeginning, data, renderable = true) => {
        if (nameIndex[name]) {
            console.warn(`Layer with name ${name} already exists.`);
        }

        if (!data) {
            data = {};
        }

        data.id = id++;
        data.enabled = true;
        data.name = `Editor Layer ${name}`;

        if (data.opaqueSortMode === undefined) {
            data.opaqueSortMode = SORTMODE_NONE;
        }
        if (data.transparentSortMode === undefined) {
            data.transparentSortMode = SORTMODE_BACK2FRONT;
        }

        const index = insertToBeginning ? layerIndexBefore : layerIndexAfter;

        index[data.id] = new Layer(data);
        nameIndex[name] = index[data.id];

        layerRenderable.set(name, renderable);

        return index[data.id];
    });

    editor.method('gizmo:layers', (name) => {
        return nameIndex[name];
    });

    editor.method('gizmo:layers:list', () => {
        const result = [];
        for (const key in nameIndex) {
            if (layerRenderable.get(key)) {
                result.push(nameIndex[key]);
            }
        }

        return result;
    });

    editor.method('gizmo:layers:removeFromComposition', (composition) => {
        if (!composition) {
            const app = editor.call('viewport:app');
            if (!app) {
                return;
            }
            composition = app.scene.layers;
        }

        for (const key in layerIndexBefore) {
            composition.remove(layerIndexBefore[key]);
        }

        for (const key in layerIndexAfter) {
            composition.remove(layerIndexAfter[key]);
        }
    });

    editor.method('gizmo:layers:addToComposition', (composition) => {
        if (!composition) {
            const app = editor.call('viewport:app');
            if (!app) {
                return;
            }

            composition = app.scene.layers;

        }

        let key;
        let index = 0;
        for (key in layerIndexBefore) {
            composition.insert(layerIndexBefore[key], index++);
        }

        for (key in layerIndexAfter) {
            composition.push(layerIndexAfter[key]);
        }

    });

    // Grid layer
    editor.call('gizmo:layers:register', 'Viewport Grid', true);
    // Layer before every scene layer
    editor.call('gizmo:layers:register', 'Bright Gizmo', true);
    // First layer after every scene layer
    editor.call('gizmo:layers:register', 'Bright Collision');
    // Second layer after every scene layer - clears depth buffer
    editor.call('gizmo:layers:register', 'Dim Gizmo', false, {
        overrideClear: true,
        clearDepthBuffer: true,
        onPreRender: function () {

        }
    });

    // special layer which needs to be added to the composition, but not used by the Editor cameras,
    // only the outline camera uses it
    editor.call('gizmo:layers:register', 'Viewport Outline', false, {
    }, false);

    editor.call('gizmo:layers:register', 'Axis Gizmo Immediate', false, {
        passThrough: true,
        overrideClear: true,
        clearDepthBuffer: true,
        opaqueSortMode: SORTMODE_NONE,
        transparentSortMode: SORTMODE_NONE
    });

    editor.call('gizmo:layers:register', 'Axis Rotate Gizmo Immediate', false, {
        passThrough: true,
        overrideClear: true,
        clearDepthBuffer: true,
        opaqueSortMode: SORTMODE_NONE,
        transparentSortMode: SORTMODE_NONE
    });

    editor.call('gizmo:layers:register', 'Axis Gizmo', false, {
    });

    editor.once('viewport:load', (app) => {
        editor.call('gizmo:layers:addToComposition');
    });
});
