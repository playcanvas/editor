import { GraphNode, Grid, Mesh, MeshInstance, PRIMITIVE_LINES, PROJECTION_ORTHOGRAPHIC, Vec2 } from 'playcanvas';
import type { Application, Entity } from 'playcanvas';

import { createColorMaterial } from './viewport-color-material';

// fade by distance in perspective (the engine default); ortho cameras sit far away and see the
// whole plane at one distance, so they don't fade
const FADE_PERSPECTIVE = new Vec2(400, 1000);
const FADE_ORTHO = new Vec2(1e9, 1e9);

editor.once('viewport:load', (app: Application) => {
    const material = createColorMaterial(true);
    material.name = 'GridMaterial';

    const node = new GraphNode('grid');

    let meshInstance;

    // engine grid for the default preset, created once the canvas has its real size so its
    // pixel ratio is right
    let grid: Grid | null = null;
    let sized = false;

    const settings = editor.call('settings:projectUser');

    const updateClassicGrid = (show: boolean, divisions: number, size: number) => {
        const layer = editor.call('gizmo:layers', 'Viewport Grid');

        if (meshInstance) {
            layer.removeMeshInstances([meshInstance]);
            meshInstance.destroy();
            meshInstance = null;
        }

        if (!show) {
            return;
        }

        const width = divisions * size;
        const gridColor = [136, 136, 136, 255];
        const axisColor = [0, 0, 0, 255];

        const pos = [];
        const col = [];

        for (let i = -(divisions / 2); i <= divisions / 2; i++) {
            const color = i === 0 ? axisColor : gridColor;

            pos.push(-width / 2, 0, i * size);
            col.push(...color);
            pos.push(width / 2, 0, i * size);
            col.push(...color);
            pos.push(i * size, 0, -width / 2);
            col.push(...color);
            pos.push(i * size, 0, width / 2);
            col.push(...color);
        }

        const mesh = new Mesh(app.graphicsDevice);
        mesh.setPositions(pos);
        mesh.setColors32(col);
        mesh.setNormals(pos); // normals (unused, by standard material requires it)
        mesh.update(PRIMITIVE_LINES, true);

        meshInstance = new MeshInstance(mesh, material, node);
        meshInstance.pick = false;

        layer.addMeshInstances([meshInstance]);
    };

    // side views look along x or z, so their grid lies in the plane facing them
    const updateView = () => {
        const camera: Entity = editor.call('camera:current');
        if (!grid || !camera?.camera) {
            return;
        }
        let plane: 'xz' | 'xy' | 'yz' = 'xz';
        const ortho = camera.camera.projection === PROJECTION_ORTHOGRAPHIC;
        grid.fadeRange = ortho ? FADE_ORTHO : FADE_PERSPECTIVE;
        if (ortho) {
            const f = camera.forward;
            const x = Math.abs(f.x);
            const y = Math.abs(f.y);
            const z = Math.abs(f.z);
            if (z > x && z > y) {
                plane = 'xy';
            } else if (x > y && x > z) {
                plane = 'yz';
            }
        }
        grid.plane = plane;
    };

    const updateEngineGrid = (show: boolean, size: number) => {
        if (!show) {
            if (grid) {
                grid.visible = false;
            }
            return;
        }
        if (!grid) {
            if (!sized) {
                return;
            }
            grid = new Grid(app.graphicsDevice);
            grid.meshInstances.forEach((mi) => {
                mi.node = node;
            });
            editor.call('gizmo:layers', 'Scene Grid').addMeshInstances(grid.meshInstances);
        }
        grid.visible = true;
        grid.spacing = size;
        updateView();
    };

    const updateGrid = () => {
        const divisions = Math.floor(settings.get('editor.gridDivisions'));
        const size = settings.get('editor.gridDivisionSize');
        const show = divisions > 0 && size > 0;
        const engine = editor.call('gizmo:preset') === 'default';

        updateClassicGrid(show && !engine, divisions, size);
        updateEngineGrid(show && engine, size);

        editor.call('viewport:render');
    };

    settings.on('editor.gridDivisions:set', updateGrid);
    settings.on('editor.gridDivisionSize:set', updateGrid);
    editor.on('gizmo:preset', updateGrid);
    editor.on('camera:change', () => {
        updateView();
        editor.call('viewport:render');
    });
    editor.on('viewport:resize', () => {
        if (!sized) {
            sized = true;
            updateGrid();
        }
    });

    updateGrid();
});
