editor.once('load', () => {
    /**
     * Given asset and instance entity data, and the guid of the instance root,
     * return data about the instance's overrides.
     *
     * @param asset - Asset data
     * @param instance - Instance data
     * @param instRootId - The guid of the instance root
     * @returns An object with fields 'conflicts',
     * 'addedEntities' and 'deletedEntities'
     */
    class FindInstanceOverrides {
        asset: Record<string, unknown>;
        instance: Record<string, unknown>;
        instRootId: string;
        overrides: Record<string, unknown>;
        srcToDst: Record<string, string>;
        typeToInstData: Record<string, unknown>;
        assetIdentity: Record<string, string>;

        constructor(asset: Record<string, unknown>, instance: Record<string, unknown>, instRootId: string) {
            this.asset = asset;

            this.instance = instance;

            this.instRootId = instRootId;
        }

        run() {
            this.initMaps();

            this.setScriptAttrs();

            this.setOverrides();

            this.filterInvalidConflicts();

            this.addMapToTemplIdConflicts();

            return this.overrides;
        }

        initMaps() {
            const rootEnt = this.instance.entities[this.instRootId];

            this.srcToDst = rootEnt.template_ent_ids;

            this.typeToInstData = {
                src: this.makeInstData(),

                dst: this.makeAssetData()
            };

            this.typeToIdToTempl = {
                src: this.srcToDst,

                dst: this.assetIdentity
            };
        }

        makeInstData() {
            return editor.call(
                'template:utils',
                'makeInstanceData',
                this.instance.entities,
                this.srcToDst
            );
        }

        makeAssetData() {
            this.assetIdentity = editor.call(
                'template:utils',
                'makeIdToIdMap',
                this.asset.entities
            );

            return editor.call(
                'template:utils',
                'makeInstanceData',
                this.asset.entities,
                this.assetIdentity
            );
        }

        setScriptAttrs() {
            const a = Object.values(this.instance.entities);

            this.scriptAttrs = editor.call('template:getScriptAttributes', a);
        }

        setOverrides() {
            this.overrides = editor.call(
                'template:findConflicts',
                this.typeToInstData,
                this.typeToIdToTempl,
                this.scriptAttrs
            );

            this.overrides.typeToInstData = this.typeToInstData;

            this.overrides.srcToDst = this.srcToDst;

            this.overrides.conflicts.forEach((h) => {
                h.srcToDst = this.srcToDst;
            });
        }

        filterInvalidConflicts() {
            this.overrides.conflicts.forEach(this.markEntityReference, this);

            this.overrides.conflicts = this.overrides.conflicts.filter((h) => {
                return editor.call(
                    'template:isValidTemplateConflict',
                    h,
                    this.instRootId,
                    this.srcToDst,
                    this.scriptAttrs
                );
            });
        }

        markEntityReference(conflict: Record<string, unknown>): void {
            editor.call(
                'template:utils',
                'setEntReferenceIfNeeded',
                conflict,
                this.scriptAttrs
            );
        }

        addMapToTemplIdConflicts() {
            const a = this.overrides.conflicts.filter((h) => {
                return h.path === 'template_id';
            });

            a.forEach((h) => {
                const id = h.srcToDst[h.resource_id];

                const m = id && this.asset.entities[id].template_ent_ids;

                h.idMapInAsset = m || {};
            });
        }
    }

    const getAssetData = function (id) {
        const asset = editor.call('assets:get', id);
        return asset && asset.get('data');
    };

    /**
     * Find all descendant entities and put them in an object under
     * the key 'entities' (so that the format is consistent with
     * template asset data).
     *
     * @param root - The root entity of a template instance
     * @param root.get - Method to get property values by key
     * @returns Instance data
     */
    const getInstanceData = function (root: { get: (key: string) => unknown }): Record<string, unknown> {
        const ents = editor.call('template:utils', 'getAllEntitiesInSubtree', root, []);

        const h = { entities: {} };

        ents.forEach((ent) => {
            const id = ent.get('resource_id') as string;

            h.entities[id] = ent.json();
        });

        return h;
    };

    /**
     * Given the root entity of a template instance, compute
     * and return data about its overrides by comparing it
     * with the corresponding template asset.
     *
     * @param root - The root entity of a template instance
     * @returns An object with fields 'conflicts',
     * 'addedEntities' and 'deletedEntities'. Return null if template asset not found.
     */
    editor.method('templates:computeOverrides', (root: { get: (key: string) => unknown }): Record<string, unknown> | null => {
        const templateId = root.get('template_id');

        const asset = getAssetData(templateId);
        if (!asset) {
            return null;
        }

        const instance = getInstanceData(root);

        const instRootId = root.get('resource_id');

        return new FindInstanceOverrides(asset, instance, instRootId).run();
    });
});
