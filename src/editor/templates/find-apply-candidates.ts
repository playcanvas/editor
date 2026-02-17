import type { Observer, ObserverList } from '@playcanvas/observer';

editor.once('load', () => {
    /**
     * Finds all the templates that an override could be applied to.
     *
     * @param override - The override (as returned by templates:computeOverrides).
     * @param entities - The entities observer list
     * @param templateInstanceRoot - The template instance that we are interested in. We are not going to search above this
     * entity when looking for candidates. Can be null to check up to the root of the scene.
     */
    editor.method('templates:findApplyCandidatesForOverride', (override: Record<string, unknown>, entities: ObserverList, templateInstanceRoot: Observer | null): Observer[] => {
        entities = entities || editor.call('entities:raw');

        const result = [];
        let entity = entities.get(override.resource_id);
        while (entity) {
            if (entity.get('template_id') && entity.has(`template_ent_ids.${override.resource_id}`)) {
                // if this entity is the same entity as the override is referring to
                // and this entity is a template then do not consider it a candidate
                // if the path of the override is not supposed to be considered a valid
                // override for a template root
                if (entity.get('resource_id') !== override.resource_id || !editor.call('template:utils', 'isIgnoreRootOverride', override.path)) {
                    result.push(entity);
                }
            }

            // do not go further than the specified template instance root
            if (entity === templateInstanceRoot) {
                break;
            }

            entity = entities.get(entity.get('parent'));
        }

        return result;

    });

    /**
     * Finds all the templates that a new entity override could be applied to.
     *
     * @param templateInstanceRoot - The template instance that we are interested in. We are not going to search above this
     * entity when looking for candidates.
     * @param newEntityData - The new entity in JSON.
     * @param entities - The entities observer list
     */
    editor.method('templates:findApplyCandidatesForNewEntity', (templateInstanceRoot: Observer, newEntityData: Record<string, unknown>, entities: ObserverList): Observer[] => {
        entities = entities || editor.call('entities:raw');

        const result = [];
        let entity = entities.get(newEntityData.parent);
        while (entity) {
            if (entity.get('template_id')) {
                result.push(entity);
            }

            // do not go further than the specified template instance root
            if (entity === templateInstanceRoot) {
                break;
            }

            entity = entities.get(entity.get('parent'));
        }

        return result;
    });

    /**
     * Finds all the templates that a deleted entity override could be applied to.
     *
     * @param templateInstanceRoot - The template instance that we are interested in. We are not going to search above this
     * entity when looking for candidates.
     * @param deletedEntityData - The deleted entity in JSON.
     * @param entities - The entities observer list
     */
    editor.method('templates:findApplyCandidatesForDeletedEntity', (templateInstanceRoot: Observer, deletedEntityData: Record<string, unknown>, entities: ObserverList): Observer[] => {
        entities = entities || editor.call('entities:raw');

        const templateEntityIds = templateInstanceRoot.get('template_ent_ids');
        // find the parent of the deleted entity in the template instance
        // and also find the resource id of the deleted entity in the template instance
        let parent = templateInstanceRoot;
        let instanceResourceId;
        for (const key in templateEntityIds) {
            if (templateEntityIds[key] === deletedEntityData.parent) {
                parent = entities.get(key);
            } else if (templateEntityIds[key] === deletedEntityData.resource_id) {
                instanceResourceId = key;
            }
        }

        const result = [];

        // start from the parent and find all template roots up to currently selected entity
        // that have the deleted entity in their template_ent_ids
        while (parent) {
            if (parent.get('template_id') && parent.has(`template_ent_ids.${instanceResourceId}`)) {
                result.push(parent);

                if (parent === templateInstanceRoot) {
                    break;
                }
            }

            parent = entities.get(parent.get('parent'));
        }

        return result;
    });
});
