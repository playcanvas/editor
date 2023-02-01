editor.once('load', function () {
    'use strict';

    /**
     * Given asset and instance entity data, and the guid of the instance root,
     * return data about the instance's overrides.
     *
     * @param {object} asset - Asset data
     * @param {object} instance - Instance data
     * @param {string} instRootId - The guid of the instance root
     * @returns {object} An object with fields 'conflicts',
     * 'addedEntities' and 'deletedEntities'
     */
    class FindInstanceOverrides {
        constructor(asset, instance, instRootId) {
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

        markEntityReference(conflict) {
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
     * @param {object} root - The root entity of a template instance
     * @returns {object} Instance data
     */
    const getInstanceData = function (root) {
        const ents = editor.call('template:utils', 'getAllEntitiesInSubtree', root, []);

        const h = { entities: {} };

        ents.forEach((ent) => {
            const id = ent.get('resource_id');

            h.entities[id] = ent.json();
        });

        return h;
    };

    /**
     * Given the root entity of a template instance, compute
     * and return data about its overrides by comparing it
     * with the corresponding template asset.
     *
     * @param {object} root - The root entity of a template instance
     * @returns {object} An object with fields 'conflicts',
     * 'addedEntities' and 'deletedEntities'. Return null if template asset not found.
     */
    editor.method('templates:computeOverrides', function (root) {
        const templateId = root.get('template_id');

        const asset = getAssetData(templateId);
        if (!asset) return null;

        const instance = getInstanceData(root);

        const instRootId = root.get('resource_id');

        return new FindInstanceOverrides(asset, instance, instRootId).run();
    });
});
