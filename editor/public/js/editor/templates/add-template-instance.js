editor.once('load', function () {
    'use strict';

    editor.method('template:addInstance', function (asset, parent, desiredEntityResourceIds, desiredChildIndex) {
        if (! editor.call('permissions:write')) {
            return;
        }

        return new AddTemplateInstance(asset, parent, desiredEntityResourceIds, desiredChildIndex).run();
    });

    class AddTemplateInstance {
        constructor(asset, parent, desiredEntityResourceIds, desiredChildIndex) {
            this.asset = asset;

            this.parent = parent;

            this.desiredEntityResourceIds = desiredEntityResourceIds || {};

            this.desiredChildIndex = desiredChildIndex;

            this.dstEnts = {};

            this.srcToDst = {};

            this.dstToSrc = {};
        }

        run() {
            this.prepData();

            this.createDstEnts();

            this.remapAllEntIds();

            this.setRootFields();

            return this.addToScene(this.dstRootEnt, this.parent, this.desiredChildIndex);
        }

        prepData() {
            this.srcEnts = this.asset.get('data').entities;

            const a = Object.values(this.srcEnts);

            this.scriptAttrs = editor.call('template:getScriptAttributes', a);
        }

         createDstEnts() {
             const ids = Object.keys(this.srcEnts);

             ids.forEach(id => this.createEnt(id, this.srcEnts[id]));
         }

        createEnt(srcId, srcEnt) {
            const dstId = this.desiredEntityResourceIds[srcId] || pc.guid.create();

            const dstEnt = editor.call('template:utils', 'cloneWithId', srcEnt, dstId);

            this.updateMaps(srcId, dstId);

            if (!srcEnt.parent) {
                this.dstRootEnt = dstEnt;
            }

            this.dstEnts[dstId] = dstEnt;
        }

        updateMaps(srcId, dstId) {
            this.srcToDst[srcId] = dstId;

            this.dstToSrc[dstId] = srcId;
        }

        remapAllEntIds() {
            const ents = Object.values(this.dstEnts);

            ents.forEach(ent => {
                editor.call(
                    'template:remapEntityIds',
                    ent,
                    this.scriptAttrs,
                    this.srcToDst
                );
            });
        }

        setRootFields() {
            this.dstRootEnt.template_ent_ids = this.dstToSrc;

            this.dstRootEnt.parent = this.parent.get('resource_id');

            this.dstRootEnt.template_id = parseInt(this.asset.get('id'), 10);
        }

        addToScene(data, parent, childIndex) {
            const childrenCopy = data.children;

            data.children = [];

            const entity = this.addEntObserver(data, parent, childIndex);

            childrenCopy.forEach(childId => {
                this.addToScene(this.dstEnts[childId], entity);
            });

            return entity;
        }

        addEntObserver(data, parent, childIndex) {
            const entity = new Observer(data);
            editor.call('entities:addEntity', entity, parent, false, childIndex);
            return entity;
        }
    }
});
