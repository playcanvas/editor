editor.once('load', function() {
    'use strict';

    const IGNORE_ROOT_PATHS_FOR_OVERRIDES = {
        parent: 1,
        template_id: 1,
        position: 1,
        rotation: 1,
        name: 1
    };

    const IGNORE_ROOT_PATHS_FOR_REVERT = [
        'position',
        'rotation',
        'name'
    ];

    editor.method('template:utils', function () {
        const a = Array.from(arguments);

        const method = a[0];

        const args = a.slice(1);

        return TemplateUtils[method].apply(null, args);
    });

    const TemplateUtils = {
        stopAndReportAttrTypes: { 'curve' : 1 },

        SCRIPT_NAME_REG: /^components\.script\.scripts\.([^.]+)$/,

        getScriptNameReg: function() {
            return TemplateUtils.SCRIPT_NAME_REG;
        },

        isIgnoreRootOverride: function(path) {
            return IGNORE_ROOT_PATHS_FOR_OVERRIDES[path];
        },

        ignoreRootPathsForRevert: function() {
            return IGNORE_ROOT_PATHS_FOR_REVERT;
        },

        makeInstanceData: function (ents, idToTemplEntId) {
            const h = {
                entIdToEntity: ents,

                entities: Object.values(ents),

                templIdToEntity: {},

                templIdToEntId: {}
            };

            h.entities.forEach(ent => TemplateUtils.updateIdMaps(h, ent, idToTemplEntId));

            return h;
        },

        updateIdMaps: function (h, instEnt, idToTemplEntId) {
            const instId = instEnt.resource_id;

            const templId = idToTemplEntId[instId] || instId;

            h.templIdToEntity[templId] = instEnt;

            h.templIdToEntId[templId] = instId;
        },

        makeIdToIdMap: function (orig) {
            const h = {};

            const a = Object.keys(orig);

            a.forEach(id => {
                h[id] = id;
            });

            return h;
        },

        getOtherType: function (type1) {
            return type1 === 'src' ? 'dst' : 'src';
        },

        getNodeAtPath(node, path) {
            path.forEach(key => {
                if (TemplateUtils.isMapObj(node)) {
                    node = node[key];
                } else {
                    node = undefined;
                }
            });

            return node;
        },

        insertAtPath: function (node, path, val) {
            const lastIndex = path.length - 1;

            const lastKey = path[lastIndex];

            for (let i = 0; i < lastIndex; i++) { // exclude last key
                const key = path[i];

                node[key] = node[key] || {};

                node = node[key];
            }

            node[lastKey] = val;
        },

        isMapObj: function (obj) {
            const isObj = typeof obj === "object";

            const isNull = obj === null;

            return isObj && !isNull && !Array.isArray(obj);
        },

        pathToStr: function (path) {
            return path.join('.');
        },

        strToPath: function (s) {
            return s.split('.');
        },

        setEntReferenceIfNeeded: function (conflict, scriptAttrs) {
            const entity = TemplateUtils.makeTmpEntity(conflict);

            const entPaths = editor.call(
                'template:allEntityPaths',
                entity,
                scriptAttrs
            );

            conflict.is_entity_reference = entPaths.length &&
                !TemplateUtils.isMapObj(conflict.src_value); // if path is components.script
        },

        makeTmpEntity: function (conflict) {
            const entity = {
                components: {}
            };

            const p = TemplateUtils.strToPath(conflict.path);

            TemplateUtils.insertAtPath(entity, p, conflict.src_value);

            return entity;
        },

        getAllEntitiesInSubtree: function (entity, result) {
            result.push(entity);

            const children = TemplateUtils.getChildEntities(entity);

            children.forEach(ch => TemplateUtils.getAllEntitiesInSubtree(ch, result));

            return result;
        },

        getChildEntities: function (entity) {
            const ids = entity.get('children');

            return ids.map(function (id) {
                return editor.call('entities:get', id);
            });
        },

        remapEntAtPath: function (h, path, srcToDst) {
            const v1 = TemplateUtils.getNodeAtPath(h, path);

            if (v1) {
                const v2 = TemplateUtils.remapEntVal(v1, srcToDst);

                TemplateUtils.insertAtPath(h, path, v2);
            }
        },

        remapEntVal: function (v, srcToDst) {
            return Array.isArray(v) ?
                TemplateUtils.remapEntArray(v, srcToDst) :
                TemplateUtils.remapEntStr(v, srcToDst);
        },

        remapEntArray: function(a, srcToDst) {
            return a.map(v => TemplateUtils.remapEntStr(v, srcToDst));
        },

        remapEntStr: function (v, srcToDst) {
            return srcToDst[v] || null;
        },

        remapKeys: function(h1, srcToDst) {
            const h2 = {};

            const a = Object.keys(h1);

            a.forEach(k1 => {
                const k2 = srcToDst[k1];

                h2[k2] = h1[k1];
            });

            return h2;
        },

        entArrayToMap: function (ents) {
            const h = {};

            ents.forEach(e => {
                h[e.resource_id] = e;
            });

            return h;
        },

        strArrayToMap: function(a) {
            const h = {};

            a.forEach(s => {
                h[s] = 1;
            });

            return h;
        },

        isStopPathInSchema: function (path) {
            const s = TemplateUtils.pathToStr(path);

            const method = editor.call('schema:getMergeMethodForPath', config.schema.scene, s);

            return method === 'stop_and_report_conflict';
        },

        stopPathsFromAttrs: function (scriptAttrs) {
            const h = {};

            Object.keys(scriptAttrs).forEach(script => {
                const attrs = scriptAttrs[script];

                Object.keys(attrs).forEach(attr => {
                    const type = attrs[attr].type;

                    if (TemplateUtils.stopAndReportAttrTypes[type]) {
                        h[`components.script.scripts.${script}.attributes.${attr}`] = 1;
                    }
                });
            });

            return h;
        },

        deepClone: function (obj) {
            return JSON.parse(JSON.stringify(obj));
        },
        
        cloneWithId: function (ent, id) {
            const h = TemplateUtils.deepClone(ent);

            h.resource_id = id;

            return h;
        },

        invertMap: function (h1) {
            const h2 = {};

            Object.keys(h1).forEach(k => {
                const v = h1[k];

                h2[v] = k;
            });

            return h2;
        },

        rmFalsey: function (a) {
            return a.filter(v => v);
        },

        getDescendants: function (entity, idToEntity, result) {
            const id = entity && entity.resource_id;

            if (id && !result[id]) {
                result[id] = entity;

                TemplateUtils.addEntChildren(entity, idToEntity, result);
            }

            return result;
        },

        addEntChildren: function (entity, idToEntity, result) {
            entity.children.forEach(id => {
                const ch = idToEntity[id];

                TemplateUtils.getDescendants(ch, idToEntity, result);
            })
        },

        addEntitySubtree: function (entData, allEnts, parent, childIndex) {
            const childrenCopy = entData.children;

            entData.children = [];

            const entity = TemplateUtils.addEntObserver(entData, parent, childIndex);

            childrenCopy.forEach(childId => {
                TemplateUtils.addEntitySubtree(allEnts[childId], allEnts, entity);
            });

            return entity;
        },

        addEntObserver: function(data, parent, childIndex) {
            const entity = new Observer(data);

            editor.call('entities:addEntity', entity, parent, false, childIndex);

            return entity;
        },

        findIdWithoutParent: function(ents) {
            const ids = Object.keys(ents);

            return ids.find(id => !ents[id].parent);
        },

        selectPresentInSecond: function(a1, a2) {
            const h = TemplateUtils.strArrayToMap(a2);

            return a1.filter(s => h[s]);
        },

        matchFromRegex: function(s, r) {
            const match = r.exec(s);

            return match ? match[1] : match;
        },

        markAddRmScriptConflicts: function(overrides) {
            overrides.conflicts.forEach(TemplateUtils.setScriptName);

            const a = overrides.conflicts.filter(h => h.script_name);

            a.forEach(h => {
                if (h.missing_in_dst) {
                    h.override_type = 'override_add_script';

                } else if (h.missing_in_src) {
                    h.override_type = 'override_delete_script';

                    TemplateUtils.addScriptIndex(h, overrides);
                }
            });
        },

        setScriptName: function(h) {
            const s = TemplateUtils.matchFromRegex(h.path, TemplateUtils.getScriptNameReg());

            if (s) {
                h.script_name = s;
            }
        },

        addScriptIndex(h, overrides) {
            const dstId = overrides.srcToDst[h.resource_id];

            const ent = overrides.typeToInstData.dst.entIdToEntity[dstId];

            const a = TemplateUtils.getNodeAtPath(ent, ['components', 'script', 'order']);

            if (a) {
                h.order_index_in_asset = a.indexOf(h.script_name);
            }
        },

        remapOverrideForRevert(override) {
            const h = TemplateUtils.invertMap(override.srcToDst);

            return TemplateUtils.remapEntVal(override.dst_value, h);
        }
    };
});
