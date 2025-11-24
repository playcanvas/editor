import { Entity } from '../entity';
import { globals as api } from '../globals';

async function addScript(entities: Entity[], scriptName: string, options: { enabled?: boolean, attributes?: any, index?: number, history?: boolean } = {}) {
    entities = entities.filter(e => !e.has(`components.script.scripts.${scriptName}`));
    if (!entities.length) return;

    const addedComponentsTo = new Set();

    entities.forEach((entity) => {
        const historyEnabled = entity.history.enabled;
        entity.history.enabled = false;

        // add script component
        if (!entity.has('components.script')) {
            entity.addComponent('script');
            addedComponentsTo.add(entity.get('resource_id'));
        }

        // add script data
        entity.set(`components.script.scripts.${scriptName}`, {
            enabled: options.enabled !== undefined ? options.enabled : true,
            attributes: options.attributes !== undefined ? options.attributes : {}
        });
        // add to script order
        entity.insert('components.script.order', scriptName, options.index);

        entity.history.enabled = historyEnabled;
    });

    // wait for scene script ops to finish before starting backend
    // for default attributes values
    await new Promise<void>((resolve) => {
        if (api.realtime.scenes.current) {
            api.realtime.scenes.current.whenNothingPending(resolve);
        } else {
            resolve();
        }
    });

    // setup promise
    const deferred: any = {
        resolve: null,
        reject: null
    };

    const promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    // start job
    const jobId = api.jobs.start((result: { status: string; }) => {
        if (result.status === 'success') {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    });

    // send backend message to set script attribute defaults
    api.realtime.connection.sendMessage('pipeline', {
        name: 'script-attributes',
        data: {
            script_task_type: 'set_entity_defaults',
            job_id: jobId,
            project_id: api.projectId,
            branch_id: api.branchId,
            script_added_to_ent: scriptName,
            dst_scene_id: api.realtime.scenes.current.id,
            dst_ent_ids: entities.map(e => e.get('resource_id'))
        }
    });

    // wait for messenger response
    api.messenger.once(`scriptAttrsFinished:${jobId}`, (msg) => {
        api.jobs.finish(jobId)(msg);
    });

    // add history action
    if (api.history && (options.history || options.history === undefined)) {
        // copy entities for undo / redo
        entities = entities.slice();

        api.history.add({
            name: `entities.components.script.scripts.${scriptName}`,
            combine: false,
            redo: () => {
                const newOptions = Object.assign({}, options);
                newOptions.history = false;

                entities = entities.map(e => e.latest()).filter(e => !!e);

                api.entities.addScript(entities, scriptName, newOptions).catch((err) => {
                    console.error(err);
                });
            },
            undo: () => {
                entities = entities.map(e => e.latest()).filter(e => !!e);

                api.entities.removeScript(entities, scriptName, {
                    history: false
                });

                entities.forEach((entity) => {
                    if (addedComponentsTo.has(entity.get('resource_id'))) {
                        const historyEnabled = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.removeComponent('script');
                        entity.history.enabled = historyEnabled;
                    }
                });
            }
        });
    }

    await promise;
}

function removeScript(entities: Entity[], scriptName: string, options: { history?: boolean } = {}) {
    const history = (options.history || options.history === undefined);

    let prev: Record<string, any> = {};

    if (history) {
        entities.forEach((entity) => {
            let prevIndex;
            const order = entity.get('components.script.order');
            if (order) {
                prevIndex = order.indexOf(scriptName);
            }

            const prevScript = entity.get(`components.script.scripts.${scriptName}`);

            prev[entity.get('resource_id')] = { prevIndex, prevScript };
        });

        // copy entities for undo / redo
        entities = entities.slice();
    }

    entities.forEach((entity) => {
        const historyEnabled = entity.history.enabled;
        entity.history.enabled = false;
        entity.unset(`components.script.scripts.${scriptName}`);
        entity.removeValue('components.script.order', scriptName);
        entity.history.enabled = historyEnabled;
    });

    if (api.history && history) {
        api.history.add({
            name: `entities.components.script.scripts.${scriptName}`,
            combine: false,
            undo: () => {
                entities = entities.map(e => e.latest()).filter(e => e && e.has('components.script') && prev[e.get('resource_id')]);

                entities.forEach((entity) => {
                    const prevData = prev[entity.get('resource_id')];
                    entity.addScript(scriptName, {
                        history: false,
                        index: prevData.prevIndex,
                        ...prevData.prevScript
                    }).catch((err) => {
                        console.error(err);
                    });
                });
            },
            redo: () => {
                prev = {};

                entities = entities.map(e => e.latest()).filter(e => !!e);
                if (!entities.length) return;

                entities.forEach((entity) => {
                    let prevIndex;
                    const order = entity.get('components.script.order');
                    if (order) {
                        prevIndex = order.indexOf(scriptName);
                    }

                    const prevScript = entity.get(`components.script.scripts.${scriptName}`);
                    prev[entity.get('resource_id')] = { prevIndex, prevScript };
                });

                const newOptions = Object.assign({}, options);
                newOptions.history = false;
                api.entities.removeScript(entities, scriptName, newOptions);
            }
        });
    }
}

export {
    addScript,
    removeScript
};
