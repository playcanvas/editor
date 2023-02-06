editor.once('load', function () {
    if (!editor.call('users:hasFlag', 'hasFixCorruptedTemplates')) return;
    if (!editor.call('permissions:write')) return;

    let entitiesLoaded = false;
    let assetsLoaded = false;
    let canceledMigrationInThisSession = false;

    let evtEntitiesLoad = editor.on('entities:load', () => {
        entitiesLoaded = true;
        if (assetsLoaded) {
            onEntitiesAndAssetsLoaded();
        }
    });

    let evtAssetsLoad = editor.once('assets:load', () => {
        assetsLoaded = true;
        if (entitiesLoaded) {
            onEntitiesAndAssetsLoaded();
        }
    });

    let evtErrors = [];
    let evtConfirm, evtCancel, evtFindIssues;

    // used to cache paths
    let parentPathIndex = {};

    // set to true if an error happened to stop migrating further
    let stopMigration = false;

    // search template assets and current scene for corrupted template instances
    // and if any are found then open the migration popup and
    // start migrating all scenes if user clicks OK
    function onEntitiesAndAssetsLoaded() {
        if (canceledMigrationInThisSession || stopMigration) return;

        const foundCorrupted = detectCorruptedTemplateInstances();
        // if (!foundCorrupted) {
        //     foundCorrupted = detectCorruptedTemplateAssets();
        // }

        // report corrupted assets but don't show popup just for them
        detectCorruptedTemplateAssets();

        if (!foundCorrupted) return;

        evtConfirm = editor.once('picker:fixCorruptedTemplates:confirm', () => {
            runMigration(false);
        });

        evtFindIssues = editor.once('picker:fixCorruptedTemplates:findIssues', () => {
            runMigration(true);
        });

        evtCancel = editor.once('picker:fixCorruptedTemplates:cancel', () => {
            canceledMigrationInThisSession = true;
            onStopMigration();
        });

        editor.call('picker:fixCorruptedTemplates');
    }

    // Clean up events
    function onStopMigration() {
        parentPathIndex = {};

        if (evtErrors) {
            evtErrors.forEach(evt => evt.unbind());
            evtErrors = [];
        }

        if (evtConfirm) {
            evtConfirm.unbind();
            evtConfirm = null;
        }

        if (evtFindIssues) {
            evtFindIssues.unbind();
            evtFindIssues = null;
        }

        if (evtEntitiesLoad) {
            evtEntitiesLoad.unbind();
            evtEntitiesLoad = null;
        }

        if (evtAssetsLoad) {
            evtAssetsLoad.unbind();
            evtAssetsLoad = null;
        }

        if (evtCancel) {
            evtCancel.unbind();
            evtCancel = null;
        }
    }

    // Show progress text in migration popup
    function onProgress(text) {
        editor.emit('picker:fixCorruptedTemplates:progress', text);
    }

    // Gets entity path
    function getEntityPath(entity) {
        let path = parentPathIndex[entity.get('parent')];
        if (!path) {
            path = '';
            let parent = entity.parent;
            while (parent) {
                path = parent.get('name') + '/' + path;
                parent = parent.parent;
            }

            parentPathIndex[entity.get('parent')] = path;
        }

        return path + entity.get('name');
    }

    // Checks current scene for corrupted template instances
    function detectCorruptedTemplateInstances() {
        const entities = editor.entities.list();
        for (const entity of entities) {
            if (isCorruptedTemplateInstance(entity)) {
                return true;
            }
        }

        return false;
    }

    // Checks template assets for corruptions
    function detectCorruptedTemplateAssets() {
        const corrupted = editor.assets.filter((asset) => {
            return asset.get('type') === 'template' && isCorruptedTemplateAsset(asset);
        });

        corrupted.forEach((asset) => {
            console.error(`Template asset ${asset.get('id')} has invalid nested templates and needs to be recreated`);
        });

        return corrupted && corrupted.length;
    }

    // Runs migration - if dryRun is true then
    // only report is compiled without making any modifications
    function runMigration(dryRun) {
        if (stopMigration) {
            onStopMigration();
            return;
        }

        // stop triggering migration popup
        // every time we load entities from now on.
        // The entities:load event will be handled later
        if (evtEntitiesLoad) {
            evtEntitiesLoad.unbind();
            evtEntitiesLoad = null;
        }

        // stop migration if any realtime errors occur
        evtErrors = ['realtime:disconnected', 'realtime:error', 'realtime:scene:error'].map((name) => {
            return editor.once(name, () => {
                stopMigration = true;
            });
        });

        fixCorrupted(dryRun)
        .finally(() => {
            if (!dryRun) {
                onStopMigration();
            }
        });
    }

    // Checks if template_ent_ids are invalid
    function areTemplateEntIdsCorrupted(entityId, templateEntIds) {
        // entity must be in template_ent_ids
        if (!templateEntIds[entityId]) {
            return true;
        }

        // template_ent_ids must not point to the same entity in the template asset
        const duplicates = new Set();
        for (const key in templateEntIds) {
            if (duplicates.has(templateEntIds[key])) {
                return true;
            }

            duplicates.add(templateEntIds[key]);
        }
    }

    // Checks if entity has invalid template ent ids
    function isCorruptedTemplateInstance(entity) {
        const templateEntIds = entity.get('template_ent_ids');
        if (!templateEntIds) return false;

        const id = entity.get('resource_id');
        if (areTemplateEntIdsCorrupted(id, templateEntIds)) {
            return true;
        }
    }

    // Checks if asset has corrupted nested templates
    function isCorruptedTemplateAsset(asset) {
        const entities = asset.get('data.entities');
        if (!entities) return;

        for (const id in entities) {
            const templateEntIds = entities[id].template_ent_ids;
            if (!templateEntIds) continue;

            if (areTemplateEntIdsCorrupted(id, templateEntIds)) {
                return true;
            }
        }
    }

    // For corrupted template instances: Unlink them from the template asset
    // For corrupted template assets: Make nested templates be regular entities
    // and do the same for entities that are linked to these corrupted template assets
    async function fixCorrupted(dryRun) {
        editor.emit('editor:fixCorruptedTemplates:start');

        // disable relay server for scenes
        editor.call('whoisonline:scene:enabled', false);

        const report = {
            projectId: config.project.id,
            branchId: config.self.branch.id,
            scenes: {},
            assets: {}
        };

        // fix assets first - the ones that were modified
        // will end up in the report
        fixAssets(dryRun, report);

        // get all scenes
        const scenes = await listScenes();

        try {
            for (let i = 0; i < scenes.length; i++) {
                // eslint-disable-next-line
                await fixScene(scenes[i], dryRun, report);
            }

            editor.emit('editor:fixCorruptedTemplates:end', report);
        } catch (err) {
            console.error(err);
            editor.emit('editor:fixCorruptedTemplates:error', err);
        }
    }

    // Lists all scenes in current branch
    async function listScenes() {
        const scenes = await new Promise((resolve) => {
            editor.call('scenes:list', (scenes) => {
                resolve(scenes);
            });
        });

        // sort scenes so that current scene is last
        // we do that so that we end up with the same scene URL
        // as the one we started
        const current = parseInt(config.scene.id, 10);
        scenes.sort((a, b) => {
            if (a.id === current) {
                return 1;
            } else if (b.id === current) {
                return -1;
            }

            return 0;
        });

        return scenes;
    }

    // loads a scene from collab-server
    async function loadScene(scene) {
        await new Promise((resolve, reject) => {
            try {
                if (parseInt(config.scene.id, 10) === parseInt(scene.id, 10)) {
                    resolve();
                    return;
                }

                onProgress('Processing scene ' + scene.id + '...');

                editor.once('entities:load', () => {
                    setTimeout(() => {
                        resolve();
                    }, 500);
                });

                editor.call('scene:load', scene.uniqueId);
            } catch (err) {
                reject(err);
            }
        });
    }

    // Checks all template assets for corruptions and migrates them
    function fixAssets(dryRun, report) {
        const assets = editor.assets.filter(asset => asset.get('type') === 'template');

        function getEntityPathInAsset(entity, entities) {
            let path = entity.name;
            let parent = entity.parent;
            while (parent && entities[parent]) {
                path = entities[parent].name + '/' + path;
                parent = entities[parent].parent;
            }

            return path;
        }

        assets.forEach((asset) => {
            const entities = asset.get('data.entities');
            for (const id in entities) {
                const templateEntIds = entities[id].template_ent_ids;
                if (!templateEntIds) continue;

                if (areTemplateEntIdsCorrupted(id, templateEntIds)) {
                    if (!dryRun) {
                        // const history = asset.history.enabled;
                        // asset.history.enabled = false;
                        // const p = `data.entities.${id}.`;
                        // asset.unset(p + 'template_id');
                        // asset.unset(p + 'template_ent_ids');
                        // asset.history.enabled = history;
                    }

                    const assetId = asset.get('id');
                    if (!report.assets[assetId]) {
                        report.assets[assetId] = {
                            affectedEntities: {}
                        };
                    }

                    report.assets[assetId].affectedEntities[id] = getEntityPathInAsset(entities[id], entities);
                }
            }
        });
    }

    // load scene and fix it
    async function fixScene(scene, dryRun, report) {
        function checkStop() {
            if (stopMigration) {
                onStopMigration();
                throw new Error('Migration was interrupted by an external error. Please reload the Editor to try again.');
            }
        }

        function unlinkEntityAndAddToReport(entity) {
            if (!dryRun) {
                const history = entity.history.enabled;
                entity.history.enabled = false;
                entity.unset('template_id');
                entity.unset('template_ent_ids');
                entity.history.enabled = history;
            }

            if (!report.scenes[scene.id]) {
                report.scenes[scene.id] = {
                    affectedEntities: {}
                };
            }

            report.scenes[scene.id].affectedEntities[entity.get('resource_id')] = getEntityPath(entity);
        }

        checkStop();

        await loadScene(scene);

        // const foundCorruptedAssets = Object.keys(report.assets).length > 0;

        const entities = editor.entities.list();
        for (const entity of entities) {
            checkStop();

            let templateEntIds;

            // // check if entity is linked to any modified template asset
            // if (foundCorruptedAssets) {
            //     const templateId = entity.get('template_id');
            //     if (templateId && report.assets[templateId]) {
            //         // check entity's template_ent_ids to find the child
            //         // of the entity that is no longer a nested template and unlink it
            //         templateEntIds = entity.get('template_ent_ids');
            //         if (templateEntIds) {
            //             for (const key in templateEntIds) {
            //                 if (report.assets[templateId].affectedEntities[templateEntIds[key]]) {
            //                     const affectedEntity = editor.entities.get(key);
            //                     if (affectedEntity) {
            //                         unlinkEntityAndAddToReport(affectedEntity);
            //                     }
            //                 }
            //             }
            //         }
            //     }
            // }

            // if corrupted then unlink entity from template
            if (!templateEntIds) {
                templateEntIds = entity.get('template_ent_ids');
            }

            if (templateEntIds && areTemplateEntIdsCorrupted(entity.get('resource_id'), templateEntIds)) {
                unlinkEntityAndAddToReport(entity);
            }
        }
    }
});
