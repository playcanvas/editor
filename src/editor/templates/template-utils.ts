import { guid } from 'playcanvas';

editor.once('load', () => {
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

    const TemplateUtils = {
        STOP_TEMPL_ATTR_TYPES: {
            curve: 1,
            json: 1
        },

        SCRIPT_NAME_REG: /^components\.script\.scripts\.([^.]+)$/,

        ALL_DIGITS_REG: /^\d+$/,

        MAX_SCHEMA_QRY_PATH_LENGTH: 8,

        getScriptNameReg: function () {
            return TemplateUtils.SCRIPT_NAME_REG;
        },

        isIgnoreRootOverride: function (path: string): boolean {
            return IGNORE_ROOT_PATHS_FOR_OVERRIDES[path];
        },

        ignoreRootPathsForRevert: function () {
            return IGNORE_ROOT_PATHS_FOR_REVERT;
        },

        makeInstanceData: function (ents: Record<string, Record<string, unknown>>, idToTemplEntId: Record<string, string>): Record<string, unknown> {
            const h = {
                entIdToEntity: ents,

                entities: Object.values(ents),

                templIdToEntity: {},

                templIdToEntId: {}
            };

            h.entities.forEach(ent => TemplateUtils.updateIdMaps(h, ent, idToTemplEntId));

            return h;
        },

        updateIdMaps: function (h: Record<string, unknown>, instEnt: Record<string, unknown>, idToTemplEntId: Record<string, string>): void {
            const instId = instEnt.resource_id;

            const templId = idToTemplEntId[instId] || instId;

            h.templIdToEntity[templId] = instEnt;

            h.templIdToEntId[templId] = instId;
        },

        makeIdToIdMap: function (orig: Record<string, unknown>): Record<string, string> {
            const h = {};

            const a = Object.keys(orig);

            a.forEach((id) => {
                h[id] = id;
            });

            return h;
        },

        getOtherType: function (type1: string): string {
            return type1 === 'src' ? 'dst' : 'src';
        },

        getNodeAtPath(node: unknown, path: string[]): unknown {
            path.forEach((k) => {
                const useKey = TemplateUtils.isMapObj(node) ||
                    TemplateUtils.isArIndex(node, k);

                if (useKey) {
                    node = node[k];
                } else {
                    node = undefined;
                }
            });

            return node;
        },

        getParentAtPath: function (node: unknown, path: string[]): unknown {
            path = path.slice(0, path.length - 1);

            return TemplateUtils.getNodeAtPath(node, path);
        },

        insertAtPath: function (node: Record<string, unknown>, path: string[], val: unknown): void {
            const lastIndex = path.length - 1;

            const lastKey = path[lastIndex];

            for (let i = 0; i < lastIndex; i++) { // exclude last key
                const key = path[i];

                node[key] = node[key] || {};

                node = node[key];
            }

            node[lastKey] = val;
        },

        isArIndex: function (node: unknown, k: string): boolean {
            return Array.isArray(node) &&
                TemplateUtils.ALL_DIGITS_REG.test(k);
        },

        isMapObj: function (obj: unknown): boolean {
            const isObj = typeof obj === 'object';

            const isNull = obj === null;

            return isObj && !isNull && !Array.isArray(obj);
        },

        pathToStr: function (path: string[]): string {
            return path.join('.');
        },

        strToPath: function (s: string): string[] {
            return s.split('.');
        },

        setEntReferenceIfNeeded: function (conflict: Record<string, unknown>, scriptAttrs: Record<string, unknown>): void {
            const entity = TemplateUtils.makeTmpEntity(conflict, 'src_value');

            const entPaths = editor.call(
                'template:allEntityPaths',
                entity,
                scriptAttrs
            );

            conflict.entity_ref_paths = entPaths.length && entPaths;
        },

        isValidEntRef: function (v: unknown): boolean {
            return TemplateUtils.isSimpleValidEntRef(v) ||
                (Array.isArray(v) && v.every(TemplateUtils.isSimpleValidEntRef));
        },

        isSimpleValidEntRef: function (v: unknown): boolean {
            return v === null || v === undefined || typeof v === 'string';
        },

        makeTmpEntity: function (conflict: Record<string, unknown>, field: string): Record<string, unknown> {
            const entity = {
                components: {}
            };

            const p = TemplateUtils.strToPath(conflict.path);

            TemplateUtils.insertAtPath(entity, p, conflict[field]);

            return entity;
        },

        getAllEntitiesInSubtree: function (entity: { get: (key: string) => unknown }, result: { get: (key: string) => unknown }[]): void {
            result.push(entity);

            const children = TemplateUtils.getChildEntities(entity);

            children.forEach(ch => TemplateUtils.getAllEntitiesInSubtree(ch, result));

            return result;
        },

        getChildEntities: function (entity: { get: (key: string) => unknown }): { get: (key: string) => unknown }[] {
            const ids = entity.get('children');

            return ids.map((id) => {
                return editor.call('entities:get', id);
            });
        },

        remapEntAtPath: function (h: Record<string, unknown>, path: string[], srcToDst: Record<string, string>): void {
            const v1 = TemplateUtils.getNodeAtPath(h, path);

            if (v1) {
                const v2 = TemplateUtils.remapEntVal(v1, srcToDst);

                TemplateUtils.insertAtPath(h, path, v2);
            }
        },

        remapEntVal: function (v: unknown, srcToDst: Record<string, string>): unknown {
            return Array.isArray(v) ?
                TemplateUtils.remapEntArray(v, srcToDst) :
                TemplateUtils.remapEntStr(v, srcToDst);
        },

        remapEntArray: function (a: unknown[], srcToDst: Record<string, string>): unknown[] {
            return a.map(v => TemplateUtils.remapEntStr(v, srcToDst));
        },

        remapEntStr: function (v: string, srcToDst: Record<string, string>): string | null {
            return srcToDst[v] || null;
        },

        remapOrAssignKeys: function (h1: Record<string, unknown>, srcToDst: Record<string, string>): Record<string, unknown> {
            const h2 = {};

            const a = Object.keys(h1);

            a.forEach((k1) => {
                const k2 = srcToDst[k1] || guid.create();

                h2[k2] = h1[k1];
            });

            return h2;
        },

        entArrayToMap: function (ents: Record<string, unknown>[]): Record<string, unknown> {
            const h = {};

            ents.forEach((e) => {
                h[e.resource_id] = e;
            });

            return h;
        },

        strArrayToMap: function (a: string[]): Record<string, number> {
            const h = {};

            a.forEach((s) => {
                h[s] = 1;
            });

            return h;
        },

        isPathInSchema: function (path: string[], method: string): boolean {
            path = path.slice(0, TemplateUtils.MAX_SCHEMA_QRY_PATH_LENGTH);

            const s = TemplateUtils.pathToStr(path);

            const m = editor.call('schema:getMergeMethodForPath', config.schema.scene, s);

            return m === method;
        },

        deepClone: function (obj: unknown): unknown {
            return JSON.parse(JSON.stringify(obj));
        },

        cloneWithId: function (ent: Record<string, unknown>, id: string): Record<string, unknown> {
            const h = TemplateUtils.deepClone(ent);

            h.resource_id = id;

            return h;
        },

        invertMap: function (h1: Record<string, string>): Record<string, string> {
            const h2 = {};

            Object.keys(h1).forEach((k) => {
                const v = h1[k];

                h2[v] = k;
            });

            return h2;
        },

        rmFalsey: function (a: unknown[]): unknown[] {
            return a.filter(v => v);
        },

        selectPresentInSecond: function (a1: string[], a2: string[]): string[] {
            const h = TemplateUtils.strArrayToMap(a2);

            return a1.filter(s => h[s]);
        },

        matchFromRegex: function (s: string, r: RegExp): string | null {
            const match = r.exec(s);

            return match ? match[1] : match;
        },

        markAddRmScriptConflicts: function (overrides: Record<string, unknown>): void {
            overrides.conflicts.forEach(TemplateUtils.setScriptName);

            const a = overrides.conflicts.filter(h => h.script_name);

            a.forEach((h) => {
                if (h.missing_in_dst) {
                    h.override_type = 'override_add_script';

                } else if (h.missing_in_src) {
                    h.override_type = 'override_delete_script';

                    TemplateUtils.addScriptIndex(h, overrides);
                }
            });
        },

        setScriptName: function (h: Record<string, unknown>): void {
            const s = TemplateUtils.matchFromRegex(h.path, TemplateUtils.getScriptNameReg());

            if (s) {
                h.script_name = s;
            }
        },

        addScriptIndex(h: Record<string, unknown>, overrides: Record<string, unknown>): void {
            const dstId = overrides.srcToDst[h.resource_id];

            const ent = overrides.typeToInstData.dst.entIdToEntity[dstId];

            const a = TemplateUtils.getNodeAtPath(ent, ['components', 'script', 'order']);

            if (a) {
                h.order_index_in_asset = a.indexOf(h.script_name);
            }
        }
    };

    const AttrUtils = {
        INDEXES_IN_PATH: { // path here is shorter by 2
            ENTITY_SCRIPT_NAME: 3,
            ENTITY_SCRIPT_ATTR_NAME: 5,
            JSON_NON_ARRAY_ATTR_PROPERTY: 6,
            JSON_ARRAY_ATTR_PROPERTY: 7
        },

        isJsonMapNode: function (data: Record<string, unknown>): boolean {
            return AttrUtils.checkScriptAttr(data, { needMaps: true });
        },

        isJsonArrayNode: function (data: Record<string, unknown>) {
            return AttrUtils.checkScriptAttr(data, { needArrays: true });
        },

        checkScriptAttr: function (data: Record<string, unknown>, opts: { needArrays?: boolean; needMaps?: boolean }) {
            const h = AttrUtils.findAttrObj(data);

            return h &&
                AttrUtils.isJsonScriptAttr(h) &&
                !AttrUtils.jsonAttrPropertyData(h, data.path) && // not inside json attr
                (!opts.needArrays || (AttrUtils.areBothNodesArs(data) && AttrUtils.isArrayAttr(h))) &&
                (!opts.needMaps || AttrUtils.areBothNodesMapObjs(data));
        },

        findAttrObj: function (data: Record<string, unknown>) {
            const scriptName = data.path[AttrUtils.INDEXES_IN_PATH.ENTITY_SCRIPT_NAME];

            const attrName = data.path[AttrUtils.INDEXES_IN_PATH.ENTITY_SCRIPT_ATTR_NAME];

            const h = data.scriptAttrs[scriptName];

            return h && h[attrName];
        },

        jsonAttrPropertyData: function (attrObj: Record<string, unknown>, path: string[]) {
            const ind = AttrUtils.isArrayAttr(attrObj) ?
                AttrUtils.INDEXES_IN_PATH.JSON_ARRAY_ATTR_PROPERTY :
                AttrUtils.INDEXES_IN_PATH.JSON_NON_ARRAY_ATTR_PROPERTY;

            const name = path[ind];

            return AttrUtils.isJsonScriptAttr(attrObj) &&
                name &&
                AttrUtils.findInAttrSchema(attrObj, name);
        },

        findInAttrSchema: function (attrObj: Record<string, unknown>, name: string) {
            const a = attrObj.schema || [];

            return a.find(h => h.name === name);
        },

        isJsonScriptAttr: function (attrObj: Record<string, unknown>) {
            return attrObj.type === 'json' &&
                attrObj.schema;
        },

        isArrayAttr: function (h: Record<string, unknown>): boolean {
            return h.array === true;
        },

        arrayToIndexStrs: function (a: unknown[]): string[] {
            return a.map((elt, ind) => ind.toString());
        },

        objIntKeys: function (h: Record<string, unknown> | unknown): string[] | false {
            const a = TemplateUtils.isMapObj(h) && Object.keys(h);

            const allDigits = a && a.every(s => TemplateUtils.ALL_DIGITS_REG.test(s));

            return allDigits && a;
        },

        addAllJsonEntPaths: function (dst: string[][], attrObj: Record<string, unknown>, pref: string[], attrInEnt: unknown): void {
            const names = AttrUtils.allJsonEntNames(attrObj.schema);

            const inds = AttrUtils.arrayIndsFromAttr(attrInEnt);

            if (inds) {
                AttrUtils.addPathsForJsonAr(dst, names, pref, inds);
            } else {
                AttrUtils.addEntNamePaths(dst, names, pref, null);
            }
        },

        arrayIndsFromAttr: function (attrInEnt: unknown): string[] | undefined {
            return (Array.isArray(attrInEnt) && AttrUtils.arrayToIndexStrs(attrInEnt)) ||
                AttrUtils.objIntKeys(attrInEnt);
        },

        addPathsForJsonAr: function (dst: string[][], names: string[], pref: string[], inds: string[]): void {
            inds.forEach((i) => {
                AttrUtils.addEntNamePaths(dst, names, pref, i);
            });
        },

        addEntNamePaths: function (dst: string[][], names: string[], pref: string[], index: string | null): void {
            names.forEach((n) => {
                const a = index === null ? [n] : [index, n];

                const p = pref.concat(a);

                dst.push(p);
            });
        },

        allJsonEntNames: function (schema: Record<string, unknown>[]): string[] {
            const a = schema.filter(h => h.type === 'entity');

            return a.map(h => h.name);
        },

        valsEqualAfterRemap: function (h: Record<string, unknown>, srcToDst: Record<string, string>, scriptAttrs: Record<string, unknown>): boolean {
            let srcEnt = TemplateUtils.makeTmpEntity(h, 'src_value');

            srcEnt = TemplateUtils.deepClone(srcEnt);

            editor.call(
                'template:remapEntityIds',
                srcEnt,
                scriptAttrs,
                srcToDst
            );

            const dstEnt = TemplateUtils.makeTmpEntity(h, 'dst_value');

            return editor.call('assets:isDeepEqual', srcEnt, dstEnt);
        },

        remapDstForRevert: function (h: Record<string, unknown>): unknown { // conflict
            const dstToSrc = TemplateUtils.invertMap(h.srcToDst);

            let dstEnt = TemplateUtils.makeTmpEntity(h, 'dst_value');

            dstEnt = TemplateUtils.deepClone(dstEnt);

            h.entity_ref_paths.forEach((p) => {
                TemplateUtils.remapEntAtPath(dstEnt, p, dstToSrc);
            });

            const path = TemplateUtils.strToPath(h.path);

            return TemplateUtils.getNodeAtPath(dstEnt, path);
        },

        remapNestedIdMap: function (override: Record<string, unknown>): Record<string, string> {
            const dstToSrc = TemplateUtils.invertMap(override.srcToDst);

            return TemplateUtils.remapOrAssignKeys(override.idMapInAsset, dstToSrc);
        },

        insideArrayAtMissingIndex: function (data: Record<string, unknown>): boolean {
            const p1 = data.parent1;

            const p2 = data.parent2;

            const i = AttrUtils.lastArrayElt(data.path);

            return Array.isArray(p1) &&
                Array.isArray(p2) &&
                AttrUtils.indexOutOfBounds(i, p1.length, p2.length);
        },

        lastArrayElt: function (a: string[]): string {
            return a[a.length - 1];
        },

        indexOutOfBounds: function (i: number, len1: number, len2: number): boolean {
            const lastInd = Math.min(len1, len2) - 1;

            return i > lastInd;
        },

        conflictFieldsForAttr: function (data: Record<string, unknown>): Record<string, unknown> {
            const h = AttrUtils.findAttrObj(data);

            return h ? AttrUtils.makeAttrFields(h, data.path) : {};
        },

        makeAttrFields: function (attrObj: Record<string, unknown>, path: string[]): Record<string, unknown> {
            const h = {};

            ['src', 'dst'].forEach((type) => {
                const field = `${type}_type`;

                h[field] = AttrUtils.attrToTypeStr(attrObj, path);
            });

            return h;
        },

        attrToTypeStr: function (attrObj: Record<string, unknown>, path: string[]): string {
            const h = AttrUtils.jsonAttrPropertyData(attrObj, path) || attrObj;

            const pref = AttrUtils.isArrayAttr(h) ? 'array:' : '';

            return pref + h.type;
        },

        areBothNodesMapObjs: function (data: Record<string, unknown>): boolean {
            return TemplateUtils.isMapObj(data.node1) &&
                TemplateUtils.isMapObj(data.node2);
        },

        areBothNodesArs: function (data: Record<string, unknown>): boolean {
            return Array.isArray(data.node1) &&
                Array.isArray(data.node2);
        }
    };

    editor.method('utils:callMethod', (klass: Record<string, (...args: unknown[]) => unknown>, args: unknown[]) => {
        const method = args[0];

        const rest = args.slice(1);

        return klass[method].apply(null, rest);
    });

    editor.method('template:utils', function () {
        const a = Array.from(arguments);

        return editor.call('utils:callMethod', TemplateUtils, a);
    });

    editor.method('template:attrUtils', function () {
        const a = Array.from(arguments);

        return editor.call('utils:callMethod', AttrUtils, a);
    });
});
