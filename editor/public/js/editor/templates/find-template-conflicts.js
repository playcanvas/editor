editor.once('load', function() {
    'use strict';

    /**
     * Find template instance overrides via recursive traversal,
     * given data representing the instance and the template asset.
     * @param {Object} typeToInstData A map from type (src or dst)
     *    to an object with the fields: entities, templIdToEntity, templIdToEntId
     * @param {Object} typeToIdToTempl A map from type to a map from
     *    instance id to template id.
     * @returns {Object} An object with fields 'conflicts',
     *    'addedEntities' and 'deletedEntities'
     */
    editor.method('template:findConflicts', function (typeToInstData, typeToIdToTempl, attrStopPaths) {
        return new FindTemplateConflicts(typeToInstData, typeToIdToTempl, attrStopPaths).run();
    });

    class FindTemplateConflicts {
        constructor(typeToInstData, typeToIdToTempl, attrStopPaths) {
            this.typeToInstData = typeToInstData;

            this.typeToIdToTempl = typeToIdToTempl;

            this.attrStopPaths = attrStopPaths;

            this.visitedIds = {};

            this.result = {
                conflicts: [],
                addedEntities: [],
                deletedEntities: []
            };
        }

        run() {
            this.handleAllEnts('src'); // src first

            this.handleAllEnts('dst');

            return this.result;
        }

        handleAllEnts(type) {
            const a = this.typeToInstData[type].entities;

            a.forEach(ent => this.handleEntity(type, ent));
        }

        handleEntity(type, ent) {
            const id = this.getTemplId(type, ent);

            if (!this.visitedIds[id]) {
                this.handleUnvisited(type, ent);

                this.visitedIds[id] = 1;
            }
        }

        handleUnvisited(type, ent) {
            const typeToNode = this.makeTypeToNode(type, ent);

            if (typeToNode.dst && typeToNode.src) {
                this.useTraversal(ent, typeToNode);

            } else if (typeToNode.dst) {
                this.handleWholeEnt(ent, 'override_delete_entity', 'deletedEntities');

            } else if (typeToNode.src) {
                this.handleWholeEnt(ent, 'override_add_entity', 'addedEntities');
            }
        }

        makeTypeToNode(type1, ent) {
            const h = {};

            h[type1] = ent;

            const type2 = editor.call('template:utils', 'getOtherType', type1);

            h[type2] = this.findMatchingEnt(type1, type2, ent);

            return h;
        }

        findMatchingEnt(type1, type2, ent) {
            const id = this.getTemplId(type1, ent);

            return this.typeToInstData[type2].templIdToEntity[id];
        }

        getTemplId(type, ent) {
            const id = ent.resource_id;

            return this.typeToIdToTempl[type][id] || id;
        }

        useTraversal(ent, typeToNode) { // ent is always from src
            const conflicts = new TemplateTraversal(ent, typeToNode, this.attrStopPaths).run();

            Array.prototype.push.apply(this.result.conflicts, conflicts);
        }

        handleWholeEnt(ent, overrideType, resField) {
            ent.override_type = overrideType;

            this.result[resField].push(ent);
        }
    }

    class TemplateTraversal {
        constructor(ent, typeToNode, attrStopPaths) {
            this.ent = ent;

            this.typeToNode = typeToNode;

            this.attrStopPaths = attrStopPaths;

            this.conflicts = [];
        }

        run() { // ent is always from src
            this.runTraveral();

            this.conflicts.forEach(h => {
                h.resource_id = this.ent.resource_id;
            });

            return this.conflicts;
        }

        runTraveral() {
            const h = {
                typeToRoot: this.typeToNode,
                conflicts: this.conflicts,
                entityResourceId: this.ent.resource_id,
                attrStopPaths: this.attrStopPaths
            };

            new StartRecursiveTraversal(h).run();
        }
    }

    class StartRecursiveTraversal {
        constructor(data) {
            this.data = data;
        }

        run() {
            this.knownResultPaths = new MergePathStore();

            [ 'src', 'dst' ].forEach(this.handleType, this);
        }

        handleType(type) {
            const h = {
                type1: type,

                path: [],

                knownResultPaths: this.knownResultPaths
            };

            Object.assign(h, this.data);

            editor.call('assets:templateNodeTraversal', h);
        }
    }

    class MergePathStore {
        constructor() {
            this.store = {};
        }

        add(path) {
            const key = editor.call('template:utils', 'pathToStr', path);

            this.store[key] = 1;
        }

        includes(path) {
            const key = editor.call('template:utils', 'pathToStr', path);

            return this.store[key];
        }
    }
});

