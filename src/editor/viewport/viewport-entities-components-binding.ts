import { BoundingBox, Vec3 } from 'playcanvas';

editor.once('load', () => {
    // converts the data to runtime types
    const runtimeComponentData = function (component, data) {
        const result = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                result[key] = editor.call('components:convertValue', component, key, data[key]);
            }
        }

        return result;
    };

    const approxEqual = function (a, b) {
        return Math.abs(a - b) < 1e-4;
    };

    editor.on('entities:add', (obj) => {
        let app;

        function setProperty(entity, component, property, value) {
            let callSetter = true;
            // edit component property
            value = obj.get(`components.${component}.${property}`);

            if (component === 'particlesystem') {
                if (property === 'enabled') {
                    value = false;
                } else if (property === 'autoPlay') {
                    value = true;
                }
            } else if (component === 'animation') {
                if (property === 'enabled') {
                    value = false;
                }
            } else if (component === 'sprite') {
                if (property === 'autoPlayClip') {
                    // stop current clip so that we can show the new one
                    if (entity.sprite) {
                        entity.sprite.stop();
                    }
                }
            } else if (component === 'camera') {
                // do not let cameras get enabled by changes to the observer
                // because we want to control which cameras are being rendered manually
                if (property === 'enabled') {
                    value = false;
                }
            } else if (component === 'element') {
                // Only propagate values to the margin or anchor if the value has
                // actually been modified. Doing so in other cases gives the element
                // the impression that the user has intentionally changed the margin,
                // which in turn will change its width/height unnecessarily.
                if (property === 'margin' || property === 'anchor') {
                    const existing = entity.element[property];

                    if (approxEqual(value[0], existing.x) &&
                        approxEqual(value[1], existing.y) &&
                        approxEqual(value[2], existing.z) &&
                        approxEqual(value[3], existing.w)) {
                        callSetter = false;
                    }
                } else if (property === 'type') {
                    // Changing an element's 'type' fundamentally changes the way it renderers and uses its configuration.
                    // In order to make sure all textures and other resources are cleared, we'll remove the component
                    // and add it again. Note that, since all properties were already saved at the 'scene' level,
                    // the new component will retain all user data.
                    entity.removeComponent('element');
                    entity.addComponent('element', obj.get('components.element'));
                    // no need to call setter because the new 'element' component was already created with the correct 'type'
                    callSetter = false;
                }
            } else if (component === 'model' || component === 'render') {
                if (property === 'aabbCenter' || property === 'aabbHalfExtents') {
                    const aabbCenter = obj.get(`components.${component}.aabbCenter`);
                    const aabbHalfExtents = obj.get(`components.${component}.aabbHalfExtents`);

                    if (aabbCenter && aabbHalfExtents) {
                        entity[component].customAabb = new BoundingBox(new Vec3(aabbCenter), new Vec3(aabbHalfExtents));
                    }
                    callSetter = false;
                }
            }

            if (callSetter) {
                entity[component][property] = editor.call('components:convertValue', component, property, value);
            }

            // render
            editor.call('viewport:render');
        }

        // subscribe to changes
        obj.on('*:set', (path, value) => {
            if (obj._silent || !path.startsWith('components')) {
                return;
            }

            const entity = obj.entity;
            if (!entity) {
                return;
            }

            const parts = path.split('.');
            const component = parts[1];
            const property = parts[2];

            // ignore script component
            if (component === 'script') {
                return;
            }

            if (!entity[component]) {
                if (!property) {
                    // add component
                    const data = runtimeComponentData(component, value);

                    // override particlesystem
                    if (component === 'particlesystem') {
                        data.enabled = false;
                        data.autoPlay = true;
                    } else if (component === 'animation') {
                        data.enabled = false;
                    }

                    app = editor.call('viewport:app');
                    if (!app) {
                        return;
                    } // webgl not available
                    app.systems[component].addComponent(entity, data);

                    // render
                    editor.call('viewport:render');
                }
            } else if (!property) {
                for (const field in value) {
                    setProperty(entity, component, field, value[field]);
                }
            } else {
                setProperty(entity, component, property, value);
            }
        });

        const onInsertOrRemove = function (path, value) {
            if (obj._silent || !path.startsWith('components')) {
                return;
            }

            const entity = obj.entity;
            if (!entity) {
                return;
            }

            const parts = path.split('.');
            const component = parts[1];
            const property = parts[2];

            // ignore script component
            if (component === 'script') {
                return;
            }

            if (property) {
                // edit component property
                value = obj.get(`components.${component}.${property}`);
                entity[component][property] = editor.call('components:convertValue', component, property, value);

                // render
                editor.call('viewport:render');
            }
        };

        obj.on('*:insert', onInsertOrRemove);
        obj.on('*:remove', onInsertOrRemove);

        obj.on('*:unset', (path) => {
            if (obj._silent || !path.startsWith('components')) {
                return;
            }

            const entity = obj.entity;
            if (!entity) {
                return;
            }

            const parts = path.split('.');
            const component = parts[1];
            const property = parts[2];

            if (component === 'script') {
                return;
            }

            if (component === 'model' || component === 'render') {
                if (property === 'aabbCenter' || property === 'aabbHalfExtents') {
                    entity[component].customAabb = null;
                }
            }

            if (property) {
                // edit component property
                const value = obj.get(`components.${component}.${property}`);
                entity[component][property] = editor.call('components:convertValue', component, property, value);
            } else if (entity[component]) {
                // remove component
                const app = editor.call('viewport:app');
                if (!app) {
                    return;
                } // webgl not available

                app.systems[component].removeComponent(entity);
            }

            // render
            editor.call('viewport:render');
        });
    });

    function resolveEntityReference(app, entity, component, field) {
        if (!entity[component]) {
            return;
        }
        if (entity[component][field] && typeof entity[component][field] === 'string') {
            const resolvedEntity = app.root.findByGuid(entity[component][field]);
            if (resolvedEntity) {
                entity[component][field] = resolvedEntity;
            }
        }
    }

    function recurseFindGuids(entity, result) {
        result[entity.get('resource_id')] = true;
        const children = entity.getRaw('children');
        children.forEach((child) => {
            result[child] = true;
        });

        children.forEach((child) => {
            const curChild = editor.call('entities:get', child);
            if (curChild) {
                recurseFindGuids(curChild, result);
            }
        });
    }

    editor.method('viewport:resolveEntityReferences', (entity) => {
        const app = editor.call('viewport:app');
        if (!app) {
            return;
        }

        const guids = {};
        if (entity) {
            recurseFindGuids(entity, guids);
        }

        const components = editor.call('components:list');
        components.forEach((component) => {
            const store = app.systems[component]?.store;
            if (store) {
                const entityFields = editor.call('components:getFieldsOfType', component, 'entity');
                entityFields.forEach((field) => {
                    if (entity) {
                        for (const id in guids) {
                            if (!store[id]) {
                                continue;
                            }
                            resolveEntityReference(app, store[id].entity, component, field);
                        }
                    } else {
                        for (const id in store) {
                            resolveEntityReference(app, store[id].entity, component, field);
                        }
                    }
                });
            }
        });
    });
});
