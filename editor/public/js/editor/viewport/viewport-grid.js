pc.Grid = function (device, size, divisions) {
    // Create the vertex format
    var vertexFormat = new pc.VertexFormat(device, [
        { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 },
        { semantic: pc.SEMANTIC_COLOR, components: 4, type: pc.TYPE_UINT8, normalize: true }
    ]);

    var size = size || 140;
    var divisions = divisions || 14;
    var interval = size / divisions;
    var numVerts = (divisions + 1) * 4;
    var gridColor = [136, 136, 136, 255];
    var axisColor = [0, 0, 0, 255];
    var color;

    // Create a vertex buffer
    this.vertexBuffer = new pc.VertexBuffer(device, vertexFormat, numVerts);
    var vertexBuffer = this.vertexBuffer;

    // Fill the vertex buffer
    var iterator = new pc.VertexIterator(vertexBuffer);
    for (i = -(divisions / 2); i <= divisions / 2; i++) {
        color = (i === 0) ? axisColor : gridColor;
        iterator.element[pc.SEMANTIC_POSITION].set(-size/2, 0.0, i * interval);
        iterator.element[pc.SEMANTIC_COLOR].set(color[0], color[1], color[2], color[3]);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set( size/2, 0.0, i * interval);
        iterator.element[pc.SEMANTIC_COLOR].set(color[0], color[1], color[2], color[3]);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(i * interval, 0.0, -size/2);
        iterator.element[pc.SEMANTIC_COLOR].set(color[0], color[1], color[2], color[3]);
        iterator.next();
        iterator.element[pc.SEMANTIC_POSITION].set(i * interval, 0.0,  size/2);
        iterator.element[pc.SEMANTIC_COLOR].set(color[0], color[1], color[2], color[3]);
        if (i !== divisions / 2) {
            iterator.next();
        }
    }
    iterator.end();

    var library = device.getProgramLibrary();
    var shader = library.getProgram("basic", { vertexColors: true, diffuseMapping: false });

    var material = new pc.Material();
    material.shader = shader;

    var mesh = new pc.Mesh();
    mesh.vertexBuffer = vertexBuffer;
    mesh.indexBuffer[0] = null;
    mesh.primitive[0].type = pc.PRIMITIVE_LINES;
    mesh.primitive[0].base = 0;
    mesh.primitive[0].count = vertexBuffer.getNumVertices();
    mesh.primitive[0].indexed = false;

    var node = new pc.GraphNode('grid');

    var meshInstance = new pc.MeshInstance(node, mesh, material);
    meshInstance.mask = GIZMO_MASK;

    var model = new pc.Model();
    model.graph = node;
    model.meshInstances = [ meshInstance ];

    this.model = model;
};

pc.Grid.prototype = {
    destroy: function () {
        if (this.vertexBuffer) {
            this.vertexBuffer.destroy();
            this.vertexBuffer = null;
        }
    }
};
