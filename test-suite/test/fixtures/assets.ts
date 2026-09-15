const FLOAT = 5126;
const ALIGNMENT = 4;
const SPLAT_FIELDS = ['x', 'y', 'z', 'nx', 'ny', 'nz', 'f_dc_0', 'f_dc_1', 'f_dc_2', 'opacity', 'scale_0', 'scale_1', 'scale_2', 'rot_0', 'rot_1', 'rot_2', 'rot_3'];
const concat = (chunks: Buffer[]) => Buffer.concat(chunks.map(chunk => new Uint8Array(chunk)));

/** A grounded triangle, nested node and one translation clip; revision two doubles its width. */
export const model = (revision = 1) => {
    const arrays = [
        new Float32Array([-revision, 0, 0, revision, 0, 0, 0, 2, 0]),
        new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
        new Uint16Array([0, 1, 2]),
        new Float32Array([0, 1, 2]),
        new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0])
    ];
    const chunks: Buffer[] = [];
    let offset = 0;
    const views = arrays.map((array) => {
        const bytes = Buffer.from(array.buffer);
        const view = { buffer: 0, byteOffset: offset, byteLength: bytes.length };
        const padding = (ALIGNMENT - bytes.length % ALIGNMENT) % ALIGNMENT;
        chunks.push(bytes, Buffer.alloc(padding));
        offset += bytes.length + padding;
        return view;
    });
    const binary = concat(chunks);
    const document = {
        asset: { version: '2.0', generator: 'PlayCanvas Editor E2E fixture' },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ name: 'FixtureRoot', children: [1] }, { name: 'FixtureTriangle', mesh: 0 }],
        meshes: [{ name: 'FixtureTriangle', primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
        materials: [{ name: 'FixtureRed', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [1, 0, 0, 1], metallicFactor: 0, roughnessFactor: 1 } }],
        animations: [{ name: 'FixtureBounce', samplers: [{ input: 3, output: 4, interpolation: 'LINEAR' }], channels: [{ sampler: 0, target: { node: 1, path: 'translation' } }] }],
        buffers: [{ byteLength: binary.length }],
        bufferViews: views,
        accessors: [
            { bufferView: 0, componentType: FLOAT, count: 3, type: 'VEC3', min: [-revision, 0, 0], max: [revision, 2, 0] },
            { bufferView: 1, componentType: FLOAT, count: 3, type: 'VEC3' },
            { bufferView: 2, componentType: 5123, count: 3, type: 'SCALAR' },
            { bufferView: 3, componentType: FLOAT, count: 3, type: 'SCALAR', min: [0], max: [2] },
            { bufferView: 4, componentType: FLOAT, count: 3, type: 'VEC3' }
        ]
    };
    const json = Buffer.from(JSON.stringify(document));
    const padded = concat([json, Buffer.alloc((ALIGNMENT - json.length % ALIGNMENT) % ALIGNMENT, ' ')]);
    const header = Buffer.alloc(20);
    header.write('glTF');
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(28 + padded.length + binary.length, 8);
    header.writeUInt32LE(padded.length, 12);
    header.write('JSON', 16);
    const bin = Buffer.alloc(8);
    bin.writeUInt32LE(binary.length);
    bin.writeUInt32LE(0x004E4942, 4);
    return concat([header, padded, bin, binary]);
};

/** Nine opaque red gaussians in a three-by-three grid, with no higher-order harmonics. */
export const splat = () => {
    const header = `ply\nformat binary_little_endian 1.0\nelement vertex 9\n${SPLAT_FIELDS.map(name => `property float ${name}`).join('\n')}\nend_header\n`;
    const data = Buffer.alloc(9 * SPLAT_FIELDS.length * ALIGNMENT);
    for (let index = 0; index < 9; index++) {
        const values = [index % 3 - 1, Math.floor(index / 3), 0, 0, 0, 0, 1.772454, -1.772454, -1.772454, 8, -1.5, -1.5, -1.5, 1, 0, 0, 0];
        values.forEach((value, field) => data.writeFloatLE(value, (index * SPLAT_FIELDS.length + field) * ALIGNMENT));
    }
    return concat([Buffer.from(header), data]);
};
