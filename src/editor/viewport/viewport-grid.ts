import { createColorMaterial } from './viewport-color-material';

editor.once('viewport:load', (app) => {

    const material = createColorMaterial(true);
    material.name = 'GridMaterial';

    const node = new pc.GraphNode('grid');

    let meshInstance;

    const settings = editor.call('settings:projectUser');

    const updateGrid = () => {
        const layer = editor.call('gizmo:layers', 'Viewport Grid');

        if (meshInstance) {
            layer.removeMeshInstances([meshInstance]);
            meshInstance.destroy();
        }

        const divisions = Math.floor(settings.get('editor.gridDivisions'));
        const size = settings.get('editor.gridDivisionSize');
        const width = divisions * size;

        if (divisions > 0 && size > 0) {
            const gridColor = [136, 136, 136, 255];
            const axisColor = [0, 0, 0, 255];

            const pos = [];
            const col = [];

            for (let i = -(divisions / 2); i <= divisions / 2; i++) {
                const color = (i === 0) ? axisColor : gridColor;

                pos.push(-width / 2, 0, i * size);
                col.push(...color);
                pos.push(width / 2, 0, i * size);
                col.push(...color);
                pos.push(i * size, 0, -width / 2);
                col.push(...color);
                pos.push(i * size, 0, width / 2);
                col.push(...color);
            }

            const mesh = new pc.Mesh(app.graphicsDevice);
            mesh.setPositions(pos);
            mesh.setColors32(col);
            mesh.setNormals(pos);            // normals (unused, by standard material requires it)
            mesh.update(pc.PRIMITIVE_LINES, true);

            meshInstance = new pc.MeshInstance(mesh, material, node);
            meshInstance.pick = false;

            layer.addMeshInstances([meshInstance]);
        }

        editor.call('viewport:render');
    };

    settings.on('editor.gridDivisions:set', updateGrid);
    settings.on('editor.gridDivisionSize:set', updateGrid);

    updateGrid();
});
