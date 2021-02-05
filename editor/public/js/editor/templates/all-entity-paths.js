editor.once('load', function () {
    'use strict';

    const parentChildren = ['parent', 'children'];

    /**
     * Given an entity and data about all declared script attribute types
     * (by script name), return an array of paths to all entity references
     * inside the provided entity.
     *
     * @param {object} entity - The entity
     * @param {object} scriptAttrs - Data about script attributes by script name
     * @returns {object[]} An array of paths
     */
    editor.method('template:allEntityPaths', function (entity, scriptAttrs) {
        const paths1 = new ComponentEntityPaths(entity).run();

        const paths2 = new ScriptAttrEntityPaths(entity, scriptAttrs).run();

        const result = paths1.concat(paths2);

        parentChildren.forEach(field => addIfPresent(entity, field, result));

        return result || [];
    });

    const addIfPresent = function (entity, field, result) {
        if (entity[field]) {
            const path = [field];

            result.push(path);
        }
    };

    /**
     * Given an entity, return an array of paths to all entity references inside
     * its components, other than script attributes.
     *
     * @param {object} entity - The entity
     * @returns {object[]} An array of paths
     */
    class ComponentEntityPaths {
        constructor(entity) {
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

        handleCompName(compName) {
            const fields = editor.call('components:getFieldsOfType', compName, 'entity');

            fields.forEach(field => this.addPathToRes(compName, field));
        }

        addPathToRes(compName, field) {
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
     * @param {object} entity - The entity
     * @param {object} scriptAttrs - Data about script attributes by script name
     * @returns {object[]} An array of paths
     */
    class ScriptAttrEntityPaths {
        constructor(entity, scriptAttrs) {
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

        handleScriptName(scrName) {
            const data = this.scripts[scrName] || {};

            const attrs = data.attributes || {};

            const attrNames = Object.keys(attrs);

            attrNames.forEach(attrName => this.handleAttr(attrName, scrName, attrs[attrName]));
        }

        handleAttr(attrName, scrName, attrInEnt) {
            let h = this.scriptAttrs[scrName] || {};

            h = h[attrName] || {};

            if (h.type === 'entity') {
                this.addRegularPath(scrName, attrName);

            } else if (editor.call('template:attrUtils', 'isJsonScriptAttr', h)) {
                this.addJsonPaths(scrName, attrName, h, attrInEnt);
            }
        }

        addRegularPath(scrName, attrName) {
            const a = this.makeRegularPath(scrName, attrName);

            this.result.push(a);
        }

        addJsonPaths(scrName, attrName, attrObj, attrInEnt) {
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

        makeRegularPath(scrName, attrName) {
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
});
