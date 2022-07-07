class EditorGrid {
    constructor(device, size = 140, divisions = 14) {
        const interval = size / divisions;
        const gridColor = [136, 136, 136, 255];
        const axisColor = [0, 0, 0, 255];

        const pos = [];
        const col = [];

        for (let i = -(divisions / 2); i <= divisions / 2; i++) {
            const color = (i === 0) ? axisColor : gridColor;

            pos.push(-size / 2, 0, i * interval);
            col.push(color[0], color[1], color[2], color[3]);
            pos.push(size / 2, 0, i * interval);
            col.push(color[0], color[1], color[2], color[3]);
            pos.push(i * interval, 0, -size / 2);
            col.push(color[0], color[1], color[2], color[3]);
            pos.push(i * interval, 0, size / 2);
            col.push(color[0], color[1], color[2], color[3]);
        }

        const mesh = new pc.Mesh(device);
        mesh.setPositions(pos);
        mesh.setColors32(col);
        mesh.update(pc.PRIMITIVE_LINES, true);

        const material = new pc.BasicMaterial();
        material.vertexColors = true;

        const node = new pc.GraphNode('grid');

        const meshInstance = new pc.MeshInstance(mesh, material, node);
        meshInstance.pick = false;

        const model = new pc.Model();
        model.graph = node;
        model.meshInstances = [meshInstance];

        this.model = model;
    }

    destroy() {
        if (this.model) {
            this.model.destroy();
            this.model = null;
        }
    }
}

window.EditorGrid = EditorGrid;
