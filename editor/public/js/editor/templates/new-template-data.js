editor.once('load', function () {
    'use strict';

    class NewTemplateData {
        constructor(root, srcEnts) {
            this.root = root;

            this.srcEnts = srcEnts;

            this.dstEnts = [];

            this.srcToDst = {};
        }

        run() {
            this.prepDstEnts();

            this.setScriptAttrs();

            this.dstEnts.forEach(this.remapIds, this);

            return this.prepResult();
        }

        prepDstEnts() {
            this.rootId = this.root.get('resource_id');

            this.srcEnts.forEach(this.handleSrcEnt, this);
        }

        handleSrcEnt(srcEnt) {
            const srcId = srcEnt.get('resource_id');

            const dstId = pc.guid.create();

            const dstEnt = srcEnt.json();

            dstEnt.resource_id = dstId;

            this.dstEnts.push(dstEnt);

            this.srcToDst[srcId] = dstId;

            if (srcId === this.rootId) {
                dstEnt.parent = null;

                // remove template fields if this is a template root
                delete dstEnt.template_id;
                delete dstEnt.template_ent_ids;
            }
        }

        setScriptAttrs() {
            this.scriptAttrs = editor.call(
                'template:getScriptAttributes', this.dstEnts);
        }

        remapIds(ent) {
            editor.call(
                'template:remapEntityIds',
                ent,
                this.scriptAttrs,
                this.srcToDst
            );
        }

        prepResult() {
            const ents = editor.call(
                'template:utils',
                'entArrayToMap',
                this.dstEnts
            );

            return {
                assetData: { entities: ents },
                srcToDst: this.srcToDst
            };
        }
    }

    /**
     * Given the root entity of an intended template, create
     * a json copy of it with new guids. All entity references inside are
     * updated to match new guids.
     *
     * @param {object} root - The root entity
     * @param {object[]} sceneEnts - All entities descending from the root
     * @returns {object} An object with fields
     *   'assetData' (for storing as data
     *       of the new template asset, it has the format
     *       { entities: <guid to entity map> }),
     *   and 'srcToDst' (a map from original to new guids)
     */
    editor.method('template:newTemplateData', function (root, sceneEnts) {
        return new NewTemplateData(root, sceneEnts).run();
    });
});
