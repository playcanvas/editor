editor.once('load', function () {
    'use strict';

    class AttributesFromScriptAssets {
        constructor(assets) {
            this.assets = assets;

            this.scriptNameToAttributes = {};
        }

        run() {
            this.assets.forEach(this.handleScriptData, this);

            return this.scriptNameToAttributes;
        }

        handleScriptData(asset) {
            const data = asset.get('data') || {};

            const scripts = data.scripts || {};

            const names = Object.keys(scripts);

            names.forEach((name) => {
                const attrs = scripts[name].attributes;

                this.scriptNameToAttributes[name] = attrs;
            });
        }
    }

    class GetScriptAttributes {
        constructor(entities) {
            this.entities = entities;

            this.assets = [];
        }

        run() {
            this.entities.forEach(this.handleEntity, this);

            return new AttributesFromScriptAssets(this.assets).run();
        }

        handleEntity(ent) {
            const path = ['components', 'script'];

            const comp = editor.call('template:utils', 'getNodeAtPath', ent, path);

            if (comp) {
                const names = Object.keys(comp.scripts);

                names.forEach(this.handleCompName, this);
            }
        }

        handleCompName(name) {
            const asset = editor.call('assets:scripts:assetByScript', name);

            if (asset) {
                this.assets.push(asset);
            }
        }
    }

    /**
     * Given an array of entities, return data about all their
     * script attributes by script name
     *
     * @param {object[]} entities - The entities
     * @returns {object} Data about script attributes by script name
     */
    editor.method('template:getScriptAttributes', function (entities) {
        return new GetScriptAttributes(entities).run();
    });
});
