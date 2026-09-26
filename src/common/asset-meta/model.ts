// the model meta the server's meta job computes, from a json or glb model file

export type ModelMeta = {
    meshes: number;
    meshInstances: number;
    meshInstancesNames?: (string | undefined)[];
    nodes: number;
    skins: number;
    vertices: number;
    triangles: number;
    attributes: Record<string, number>;
    meshCompression: 'none' | 'draco';
};

// 'glTF' read little-endian
const GLB_MAGIC = 0x46546c67;

/**
 * The first (json) chunk of a GLB, parsed like GlbFile.getJsonChunk. Throws when the bytes are not a GLB.
 *
 * @param bytes - file contents
 */
export const glbJson = (bytes: Uint8Array) => {
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const len = bytes.byteLength >= 20 ? v.getUint32(12, true) : -1;
    if (len < 0 || v.getUint32(0, true) !== GLB_MAGIC || 20 + len > bytes.byteLength) {
        throw new Error('not a glb');
    }
    return JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + len)));
};

/**
 * A json file the way the server reads one: Buffer.toString keeps a byte order mark, which JSON.parse rejects.
 *
 * @param bytes - file contents
 */
export const json = (bytes: Uint8Array) => JSON.parse(new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes));

/**
 * Whether the server reads the file as json (by name), rather than as a GLB.
 *
 * @param name - file name
 */
export const isJson = (name: string) => name.toLowerCase().endsWith('.json');

const fromJson = ({ model: m }: any): ModelMeta => {
    const meta: ModelMeta = {
        meshes: m.meshes ? m.meshes.length : 0,
        meshInstances: m.meshInstances ? m.meshInstances.length : 0,
        nodes: m.nodes ? m.nodes.length : 0,
        skins: m.skins ? m.skins.length : 0,
        vertices: 0,
        triangles: 0,
        attributes: {},
        meshCompression: 'none'
    };
    for (const vertices of m.vertices ?? []) {
        meta.vertices += vertices.position.data.length / 3;
        for (const key of Object.keys(vertices)) {
            meta.attributes[key] = (meta.attributes[key] || 0) + 1;
        }
    }
    for (const mesh of m.meshes ?? []) {
        meta.triangles += mesh.count / 3;
    }
    return meta;
};

const fromGlb = (json: any): ModelMeta => {
    let vertices = 0;
    let triangles = 0;
    let meshCompression: ModelMeta['meshCompression'] = 'none';
    const attributes: Record<string, number> = {};
    const seen = new Set<number>();
    for (const mesh of json.meshes) {
        for (const prim of mesh.primitives) {
            const pos = prim.attributes.POSITION;
            if (pos != null && !seen.has(pos)) {
                vertices += json.accessors[pos].count;
                seen.add(pos);
            }

            // only an explicit TRIANGLES mode counts, as on the server
            if (prim.mode === 4) {
                const idx = prim.indices == null ? pos : prim.indices;
                if (idx != null) {
                    triangles += json.accessors[idx].count / 3;
                }
            }
            for (const key of Object.keys(prim.attributes)) {
                attributes[key] = (attributes[key] ?? 0) + 1;
            }
            if (prim?.extensions?.KHR_draco_mesh_compression) {
                meshCompression = 'draco';
            }
        }
    }

    const names: (string | undefined)[] = [];
    for (const node of json.nodes) {
        if (Object.hasOwn(node, 'mesh') && node.mesh !== null) {
            for (let i = 0; i < json.meshes[node.mesh].primitives.length; i++) {
                names.push(node.name);
            }
        }
    }

    return {
        meshes: json.meshes.reduce((n: number, mesh: any) => n + mesh.primitives.length, 0),
        meshInstances: json.nodes.reduce(
            (n: number, node: any) => n + (node.mesh != null ? json.meshes[node.mesh].primitives.length : 0),
            0
        ),
        meshInstancesNames: names,
        nodes: json.nodes.length,
        skins: json.nodes.filter((node: any) => node.skin != null).length,
        vertices,
        triangles,
        attributes,
        meshCompression
    };
};

/**
 * The meta the server's model meta job would write (without the server-owned userMapping). Throws where
 * the job would fail.
 *
 * @param bytes - a json or glb model file
 * @param name - file name; the server reads a .json file as json and anything else as a GLB
 */
export const modelMeta = (bytes: Uint8Array, name = '') => (isJson(name) ? fromJson(json(bytes)) : fromGlb(glbJson(bytes)));
