import { findEntityReferencesInComponents } from '../entities/references';
import { Entity } from '../entity';
import { globals as api } from '../globals';
import { Guid } from '../guid';

function createTemplate(rootEntity: Entity) {
    const entities: Record<string, any> = {};
    const oldToNewIds: Record<string, any> = {};
    const rootId = rootEntity.get('resource_id');

    // go through each entity and generate new resource_ids
    rootEntity.depthFirst((entity: Entity) => {
        const id = entity.get('resource_id');
        const newId = Guid.create();
        oldToNewIds[id] = newId;

        const json = entity.json() as any;
        json.resource_id = newId;

        // delete template_id and template_ent_ids
        // from root
        if (id === rootId) {
            json.parent = null;
            delete json.template_id;
            delete json.template_ent_ids;
        }

        // if we have any missing references in template_ent_ids
        // then generate new resource_ids for those
        if (json.template_ent_ids) {
            for (const key in json.template_ent_ids) {
                if (!oldToNewIds[key] && !api.entities.get(key)) {
                    oldToNewIds[key] = Guid.create();
                }
            }
        }

        const newEntity =  new Entity(json);
        newEntity.set('children', entity.get('children'));
        entities[newId] = newEntity;
    });

    // find component entity references
    const references: Record<string, any> = findEntityReferencesInComponents(rootEntity);
    for (const oldId in references) {
        const prevEntity = api.entities.get(oldId);
        const isExternalReference = (!prevEntity || (prevEntity !== rootEntity && !prevEntity.isDescendantOf(rootEntity)));

        const referencesToEntity = references[oldId];
        referencesToEntity.forEach((reference: { entityId: string; path: string; }) => {
            const entity = entities[oldToNewIds[reference.entityId]];
            if (entity) {
                let value = null;
                if (!isExternalReference && oldToNewIds[oldId])  {
                    value = oldToNewIds[oldId];
                }
                entity.set(reference.path, value);
            }
        });
    }

    // remap top level references
    for (const id in entities) {
        const parent = entities[id].get('parent');
        if (parent) {
            entities[id].set('parent', oldToNewIds[parent]);
        }
        entities[id].set('children', entities[id].get('children').map((child: string) => oldToNewIds[child]));

        const templateEntIds = entities[id].get('template_ent_ids');
        if (templateEntIds) {
            const newTemplateEntIds: Record<string, any> = {};
            for (const key in templateEntIds) {
                newTemplateEntIds[oldToNewIds[key]] = templateEntIds[key];
            }
            entities[id].set('template_ent_ids', newTemplateEntIds);
        }
    }

    // convert observers to json
    for (const id in entities) {
        entities[id] = entities[id].json();
    }

    return {
        entities,
        oldToNewIds
    };
}

export { createTemplate };
