editor.once('plugins:load:entities-to-obj', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    editor.method('plugins:entities-to-obj', (items) => {
        const entities = [];

        for (let i = 0; i < items.length; i++) {
            if (items[i].entity && items[i].entity.model) {
                entities.push(items[i].entity);
            }
        }

        if (!entities.length) {
            return null;
        }

        let j, k;
        const vec = new pc.Vec3();
        let u, v;
        let v0, v1, v2;
        let voffset = 1;
        let obj = '';

        for (let i = 0; i < entities.length; i++) {
            const model = entities[i].model;
            if (model) {
                const meshes = entities[i].model.model.meshInstances;
                for (j = 0; j < meshes.length; j++) {
                    const mesh = meshes[j].mesh;
                    const vb = mesh.vertexBuffer;
                    const elems = vb.format.elements;
                    const numVerts = vb.numVertices;
                    const vertSize = vb.format.size;
                    let offsetP, offsetN, offsetUv;
                    for (k = 0; k < elems.length; k++) {
                        if (elems[k].name === pc.SEMANTIC_POSITION) {
                            offsetP = elems[k].offset;
                        } else if (elems[k].name === pc.SEMANTIC_NORMAL) {
                            offsetN = elems[k].offset;
                        } else if (elems[k].name === pc.SEMANTIC_TEXCOORD0) {
                            offsetUv = elems[k].offset;
                        }
                    }
                    const dataF = new Float32Array(vb.storage);
                    const offsetPF = offsetP / 4;
                    const offsetNF = offsetN / 4;
                    const offsetUvF = offsetUv / 4;
                    const vertSizeF = vertSize / 4;
                    const ib = mesh.indexBuffer[0];
                    let dataIb = ib.storage;
                    if (ib.bytesPerIndex === 1) {
                        dataIb = new Uint8Array(dataIb);
                    } else if (ib.bytesPerIndex === 2) {
                        dataIb = new Uint16Array(dataIb);
                    } else if (ib.bytesPerIndex === 4) {
                        dataIb = new Uint32Array(dataIb);
                    }
                    const ibOffset = mesh.primitive[0].base;
                    const numTris = mesh.primitive[0].count / 3;
                    const transform = meshes[j].node.getWorldTransform();
                    obj += `g ${entities[i].name}_${meshes[j].node.name}_${i}_${j}\n`;
                    for (k = 0; k < numVerts; k++) {
                        vec.set(dataF[k * vertSizeF + offsetPF],
                            dataF[k * vertSizeF + offsetPF + 1],
                            dataF[k * vertSizeF + offsetPF + 2]);
                        transform.transformPoint(vec, vec);
                        obj += `v ${vec.x} ${vec.y} ${vec.z}\n`;
                    }
                    for (k = 0; k < numVerts; k++) {
                        vec.set(dataF[k * vertSizeF + offsetNF],
                            dataF[k * vertSizeF + offsetNF + 1],
                            dataF[k * vertSizeF + offsetNF + 2]);
                        transform.transformVector(vec, vec).normalize();
                        obj += `vn ${vec.x} ${vec.y} ${vec.z}\n`;
                    }
                    for (k = 0; k < numVerts; k++) {
                        u = dataF[k * vertSizeF + offsetUvF];
                        v = dataF[k * vertSizeF + offsetUvF + 1];
                        obj += `vt ${u} ${v}\n`;
                    }
                    for (k = 0; k < numTris; k++) {
                        v0 = dataIb[k * 3 + ibOffset] + voffset;
                        v1 = dataIb[k * 3 + 1 + ibOffset] + voffset;
                        v2 = dataIb[k * 3 + 2 + ibOffset] + voffset;
                        obj += `f ${v0}/${v0}/${v0} ${
                            v1}/${v1}/${v1} ${
                            v2}/${v2}/${v2}\n`;
                    }
                    voffset += numVerts;
                }
            }
        }

        return obj;
    });

    const onEntitiesLoaded = function () {
        editor.call('entities:contextmenu:add', {
            text: 'Export to OBJ',
            icon: 'E228',
            onSelect: function (selection) {
                const obj = editor.call('plugins:entities-to-obj', selection);
                if (!obj) {
                    return;
                }

                const element = document.createElement('a');
                element.href = window.URL.createObjectURL(new Blob([obj], { type: 'text/plain;charset=utf-8' }));
                element.download = 'model.obj';
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
            },
            onIsEnabled: function (selection) {
                for (let i = 0; i < selection.length; i++) {
                    if (selection[i].entity && selection[i].entity.model) {
                        return true;
                    }
                }
                return false;
            }
        });
    };

    if (editor.call('entities:loaded')) {
        onEntitiesLoaded();
    } else {
        editor.once('entities:load', onEntitiesLoaded);
    }
});
