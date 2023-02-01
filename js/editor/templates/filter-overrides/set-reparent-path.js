editor.once('load', function () {
    'use strict';

    class SetReparentPath {
        constructor(conflict, overrides) {
            this.conflict = conflict;

            this.overrides = overrides;

            this.path_data = {
                src: { ids: [], names: [] },
                dst: { ids: [], names: [] }
            };
        }

        run() {
            this.setPaths();

            this.conflict.override_type = 'override_reparent_entity';

            this.conflict.path_data = this.path_data;
        }

        setPaths() {
            const srcId = this.conflict.resource_id;

            this.findPathFromId('src', srcId);

            const dstId = this.overrides.srcToDst[srcId];

            this.findPathFromId('dst', dstId);
        }

        findPathFromId(type, id) {
            const ent = this.findEnt(type, id);

            this.findPathFromEnt(type, ent);
        }

        findPathFromEnt(type, ent) {
            this.path_data[type].ids.unshift(ent.resource_id);

            this.path_data[type].names.unshift(ent.name);

            const parent = this.findEnt(type, ent.parent);

            if (parent) {
                this.findPathFromEnt(type, parent);
            }
        }

        findEnt(type, id) {
            return this.overrides.typeToInstData[type].entIdToEntity[id];
        }
    }

    editor.method('templates:setReparentPath', function (conflict, overrides) {
        return new SetReparentPath(conflict, overrides).run();
    });
});
