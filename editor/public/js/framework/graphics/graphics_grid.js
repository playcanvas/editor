pc.extend(pc.designer.graphics, function() {
    // Private members

    // Public Interface
    var Grid = function (device, size, divisions) {
        // Create the vertex format
        var vertexFormat = new pc.gfx.VertexFormat(device, [
            { semantic: pc.gfx.SEMANTIC_POSITION, components: 3, type: pc.gfx.ELEMENTTYPE_FLOAT32 },
            { semantic: pc.gfx.SEMANTIC_COLOR, components: 4, type: pc.gfx.ELEMENTTYPE_UINT8, normalize: true }
        ]);

        var size = size || 140;
        var divisions = divisions || 14;
        var interval = size / divisions;
        var numVerts = (divisions + 1) * 4;
        var gridColor = [136, 136, 136, 255];
        var axisColor = [0, 0, 0, 255];
        var color;

        // Create a vertex buffer
        this.vertexBuffer = new pc.gfx.VertexBuffer(device, vertexFormat, numVerts);
        var vertexBuffer = this.vertexBuffer;

        // Fill the vertex buffer
        var iterator = new pc.gfx.VertexIterator(vertexBuffer);
        for (i = -(divisions / 2); i <= divisions / 2; i++) {
            color = (i === 0) ? axisColor : gridColor;
            iterator.element[pc.gfx.SEMANTIC_POSITION].set(-size/2, 0.0, i * interval);
            iterator.element[pc.gfx.SEMANTIC_COLOR].set(color[0], color[1], color[2], color[3]);
            iterator.next();
            iterator.element[pc.gfx.SEMANTIC_POSITION].set( size/2, 0.0, i * interval);
            iterator.element[pc.gfx.SEMANTIC_COLOR].set(color[0], color[1], color[2], color[3]);
            iterator.next();
            iterator.element[pc.gfx.SEMANTIC_POSITION].set(i * interval, 0.0, -size/2);
            iterator.element[pc.gfx.SEMANTIC_COLOR].set(color[0], color[1], color[2], color[3]);
            iterator.next();
            iterator.element[pc.gfx.SEMANTIC_POSITION].set(i * interval, 0.0,  size/2);
            iterator.element[pc.gfx.SEMANTIC_COLOR].set(color[0], color[1], color[2], color[3]);
            if (i !== divisions / 2) {
                iterator.next();
            }
        }
        iterator.end();

        var library = device.getProgramLibrary();
        var shader = library.getProgram("basic", { vertexColors: true, diffuseMapping: false });

        var material = new pc.scene.Material();
        material.shader = shader;

        var mesh = new pc.scene.Mesh();
        mesh.vertexBuffer = vertexBuffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.gfx.PRIMITIVE_LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = vertexBuffer.getNumVertices();
        mesh.primitive[0].indexed = false;

        var node = new pc.scene.GraphNode();
        node.setName('grid');

        var meshInstance = new pc.scene.MeshInstance(node, mesh, material);

        var model = new pc.scene.Model();
        model.graph = node;
        model.meshInstances = [ meshInstance ];

        this.model = model;
    };

    Grid.prototype = {
        destroy: function () {
            if (this.vertexBuffer) {
                this.vertexBuffer.destroy();
                this.vertexBuffer = null;
            }
        }
    };

    return {
        Grid: Grid
    }
}());