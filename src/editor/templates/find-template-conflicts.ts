editor.once('load', () => {
    class MergePathStore {
        store: Record<string, number>;

        constructor() {
            this.store = {};
        }

        add(path: string[]): void {
            const key = editor.call('template:utils', 'pathToStr', path);

            this.store[key] = 1;
        }

        includes(path: string[]): boolean {
            const key = editor.call('template:utils', 'pathToStr', path);

            return !!this.store[key];
        }
    }

    class StartRecursiveTraversal {
        data: Record<string, unknown>;

        constructor(data: Record<string, unknown>) {
            this.data = data;
        }

        run(): void {
            this.knownResultPaths = new MergePathStore();

            ['src', 'dst'].forEach(this.handleType, this);
        }

        handleType(type: string): void {
            const h = {
                type1: type,

                path: [],

                knownResultPaths: this.knownResultPaths
            };

            Object.assign(h, this.data);

            editor.call('assets:templateNodeTraversal', h);
        }
    }

    class TemplateTraversal {
        ent: Record<string, unknown>;
        typeToNode: Record<string, unknown>;
        scriptAttrs: Record<string, unknown>;
        conflicts: Record<string, unknown>[];

        constructor(ent: Record<string, unknown>, typeToNode: Record<string, unknown>, scriptAttrs: Record<string, unknown>) {
            this.ent = ent;

            this.typeToNode = typeToNode;

            this.scriptAttrs = scriptAttrs;

            this.conflicts = [];
        }

        run(): Record<string, unknown>[] { // ent is always from src
            this.runTraversal();

            this.conflicts.forEach((h) => {
                h.resource_id = this.ent.resource_id;
            });

            return this.conflicts;
        }

        runTraversal(): void {
            const h = {
                typeToRoot: this.typeToNode,
                conflicts: this.conflicts,
                entityResourceId: this.ent.resource_id,
                scriptAttrs: this.scriptAttrs
            };

            new StartRecursiveTraversal(h).run();
        }
    }

    class FindTemplateConflicts {
        typeToInstData: Record<string, unknown>;
        typeToIdToTempl: Record<string, unknown>;
        scriptAttrs: Record<string, unknown>;
        visitedIds: Record<string, number>;
        result: Record<string, unknown>;

        constructor(typeToInstData: Record<string, unknown>, typeToIdToTempl: Record<string, unknown>, scriptAttrs: Record<string, unknown>) {
            this.typeToInstData = typeToInstData;

            this.typeToIdToTempl = typeToIdToTempl;

            this.scriptAttrs = scriptAttrs;

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

        handleAllEnts(type: string): void {
            const a = this.typeToInstData[type].entities;

            a.forEach(ent => this.handleEntity(type, ent));
        }

        handleEntity(type: string, ent: Record<string, unknown>): void {
            const id = this.getTemplId(type, ent);

            if (!this.visitedIds[id]) {
                this.handleUnvisited(type, ent);

                this.visitedIds[id] = 1;
            }
        }

        handleUnvisited(type: string, ent: Record<string, unknown>): void {
            const typeToNode = this.makeTypeToNode(type, ent);

            if (typeToNode.dst && typeToNode.src) {
                this.useTraversal(ent, typeToNode);

            } else if (typeToNode.dst) {
                this.handleWholeEnt(ent, 'override_delete_entity', 'deletedEntities');

            } else if (typeToNode.src) {
                this.handleWholeEnt(ent, 'override_add_entity', 'addedEntities');
            }
        }

        makeTypeToNode(type1: string, ent: Record<string, unknown>): Record<string, unknown> {
            const h = {};

            h[type1] = ent;

            const type2 = editor.call('template:utils', 'getOtherType', type1);

            h[type2] = this.findMatchingEnt(type1, type2, ent);

            return h;
        }

        findMatchingEnt(type1: string, type2: string, ent: Record<string, unknown>): Record<string, unknown> | undefined {
            const id = this.getTemplId(type1, ent);

            return this.typeToInstData[type2].templIdToEntity[id];
        }

        getTemplId(type: string, ent: Record<string, unknown>): string {
            const id = ent.resource_id;

            return this.typeToIdToTempl[type][id] || id;
        }

        useTraversal(ent: Record<string, unknown>, typeToNode: Record<string, unknown>): void { // ent is always from src
            const conflicts = new TemplateTraversal(ent, typeToNode, this.scriptAttrs).run();

            Array.prototype.push.apply(this.result.conflicts, conflicts);
        }

        handleWholeEnt(ent: Record<string, unknown>, overrideType: string, resField: string): void {
            ent.override_type = overrideType;

            this.result[resField].push(ent);
        }
    }

    /**
     * Find template instance overrides via recursive traversal,
     * given data representing the instance and the template asset.
     *
     * @param typeToInstData - A map from type (src or dst)
     * to an object with the fields: entities, templIdToEntity, templIdToEntId
     * @param typeToIdToTempl - A map from type to a map from
     * instance id to template id.
     * @returns An object with fields 'conflicts',
     * 'addedEntities' and 'deletedEntities'
     */
    editor.method('template:findConflicts', (typeToInstData: Record<string, unknown>, typeToIdToTempl: Record<string, unknown>, scriptAttrs: Record<string, unknown>): Record<string, unknown> => {
        return new FindTemplateConflicts(typeToInstData, typeToIdToTempl, scriptAttrs).run();
    });
});
