editor.once('load', () => {
    const parentChildren = ['parent', 'children'];

    const addIfPresent = function (entity: Record<string, unknown>, field: string, result: string[][]): void {
        if (entity[field]) {
            const path = [field];

            result.push(path);
        }
    };

    /**
     * Given an entity, return an array of paths to all entity references inside
     * its components, other than script attributes.
     *
     * @param entity - The entity
     * @returns An array of paths
     */
    class ComponentEntityPaths {
        entity: Record<string, unknown>;
        result: string[][];
        compNames: string[];

        constructor(entity: Record<string, unknown>) {
            this.entity = entity;

            this.result = [];
        }

        run() {
            this.setCompNames();

            this.compNames.forEach(this.handleCompName, this);

            return this.result;
        }

        setCompNames() {
            this.compNames = Object.keys(this.entity.components);
        }

        handleCompName(compName: string): void {
            const fields = editor.call('components:getFieldsOfType', compName, 'entity');

            fields.forEach(field => this.addPathToRes(compName, field));
        }

        addPathToRes(compName: string, field: string): void {
            const path = [
                'components',
                compName,
                field
            ];

            this.result.push(path);
        }
    }

    /**
     * Given an entity and data about all declared script attribute types
     * (by script name), return an array of paths to all entity references,
     * which are values of script attributes.
     *
     * @param entity - The entity
     * @param scriptAttrs - Data about script attributes by script name
     * @returns An array of paths
     */
    class ScriptAttrEntityPaths {
        entity: Record<string, unknown>;
        scriptAttrs: Record<string, unknown>;
        result: string[][];
        scripts: Record<string, unknown>;
        scriptNames: string[];

        constructor(entity: Record<string, unknown>, scriptAttrs: Record<string, unknown>) {
            this.entity = entity;

            this.scriptAttrs = scriptAttrs;

            this.result = [];
        }

        run() {
            this.setScriptData();

            this.scriptNames.forEach(this.handleScriptName, this);

            return this.result;
        }

        setScriptData() {
            const scriptComps = this.entity.components.script || {};

            this.scripts = scriptComps.scripts || {};

            this.scriptNames = Object.keys(this.scripts);
        }

        handleScriptName(scrName: string): void {
            const data = this.scripts[scrName] || {};

            const attrs = data.attributes || {};

            const attrNames = Object.keys(attrs);

            attrNames.forEach(attrName => this.handleAttr(attrName, scrName, attrs[attrName]));
        }

        handleAttr(attrName: string, scrName: string, attrInEnt: unknown): void {
            let h = this.scriptAttrs[scrName] || {};

            h = h[attrName] || {};

            if (h.type === 'entity') {
                this.addRegularPath(scrName, attrName);

            } else if (editor.call('template:attrUtils', 'isJsonScriptAttr', h)) {
                this.addJsonPaths(scrName, attrName, h, attrInEnt);
            }
        }

        addRegularPath(scrName: string, attrName: string): void {
            const a = this.makeRegularPath(scrName, attrName);

            this.result.push(a);
        }

        addJsonPaths(scrName: string, attrName: string, attrObj: Record<string, unknown>, attrInEnt: unknown): void {
            const pref = this.makeRegularPath(scrName, attrName);

            editor.call(
                'template:attrUtils',
                'addAllJsonEntPaths',
                this.result,
                attrObj,
                pref,
                attrInEnt
            );
        }

        makeRegularPath(scrName: string, attrName: string): string[] {
            return [
                'components',
                'script',
                'scripts',
                scrName,
                'attributes',
                attrName
            ];
        }
    }

    /**
     * Given an entity and data about all declared script attribute types
     * (by script name), return an array of paths to all entity references
     * inside the provided entity.
     *
     * @param entity - The entity
     * @param scriptAttrs - Data about script attributes by script name
     * @returns An array of paths
     */
    editor.method('template:allEntityPaths', (entity: unknown, scriptAttrs: Record<string, unknown>): unknown[] => {
        const paths1 = new ComponentEntityPaths(entity).run();

        const paths2 = new ScriptAttrEntityPaths(entity, scriptAttrs).run();

        const result = paths1.concat(paths2);

        parentChildren.forEach(field => addIfPresent(entity, field, result));

        return result || [];
    });
});
