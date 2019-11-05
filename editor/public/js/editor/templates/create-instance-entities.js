editor.once('load', function () {
    'use strict';

    editor.method('template:createInstanceEntities', function (srcEnts, srcToDst, dstToSrc, scriptAttrs) {

        return new CreateInstanceEntities(srcEnts, srcToDst, dstToSrc, scriptAttrs).run();
    });

    class CreateInstanceEntities {
        constructor(srcEnts, srcToDst, dstToSrc, scriptAttrs) {
            this.srcEnts = srcEnts;

            this.srcToDst = srcToDst;

            this.dstToSrc = dstToSrc;

            this.scriptAttrs = scriptAttrs;

            this.dstEnts = {};
        }

        run() {
            this.createAllEnts(); // updates maps

            this.remapAllEntIds();

            return this.dstEnts;
        }

        createAllEnts() {
            const ids = Object.keys(this.srcEnts);

            ids.forEach(id => this.createEnt(id, this.srcEnts[id]));
        }

        createEnt(srcId, srcEnt) {
            const dstId = this.srcToDst[srcId] || pc.guid.create();

            const dstEnt = editor.call('template:utils', 'cloneWithId', srcEnt, dstId);

            this.updateMaps(srcId, dstId);

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
    }
});
