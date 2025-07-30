editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available

    const assignAttributesToScript = pc.ScriptAttributes.assignAttributesToScript;

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

    editor.on('entities:add', (obj) => {

        function onSetProperty(entity, component, property, parts, value) {
            // edit component property
            if (component === 'script' && property === 'scripts' && !editor.call('settings:project').get('useLegacyScripts')) {
                /* eslint-disable-next-line no-empty */
                if (parts.length <= 2) {

                } else if (parts.length === 3) {
                    for (let i = entity.script.scripts.length - 1; i >= 0; i--) {
                        entity.script.destroy(entity.script.scripts[i].__scriptType);
                    }

                    for (const script in value) {
                        entity.script.create(script, value[script]);
                    }
                } else {
                    const script = entity.script[parts[3]];

                    if (parts.length === 4) {
                        // new script
                        const data = obj.get(`components.script.scripts.${parts[3]}`);
                        entity.script.create(parts[3], data);
                    } else if (script && parts.length === 5 && parts[4] === 'enabled') {
                        // enabled
                        script.enabled = value;
                    } else if (script && parts.length >= 6 && parts[4] === 'attributes' && !pc.createScript.reservedAttributes[parts[5]]) {
                        // set attribute
                        const scriptName = parts[3];
                        const attributeName = parts[5];
                        const newValue = parts.length > 6 ? obj.get(`components.script.scripts.${parts[3]}.attributes.${parts[5]}`) : value;

                        // If a ScriptType, we just need to assign the value. The copy operation happens in ScriptAttributes
                        if (script instanceof pc.ScriptType) {
                            script[attributeName] = newValue;

                        } else if (pc.Script && script instanceof pc.Script) { // otherwise we need to manually assign the value

                            // Script has not been initialized yet
                            if (!script.app) return;

                            const schema = script.app.scripts.getSchema(scriptName);
                            const attributeSchema = schema.attributes[attributeName];
                            assignAttributesToScript(script.app, { [attributeName]: attributeSchema }, { [attributeName]: newValue }, script);

                        } else {
                            console.error(`The script '${scriptName}' does not inherit from pc.Script or pc.ScriptType. Unable to set attribute '${parts[5]}'`);
                        }
                    }
                }
            } else {
                if (component === 'element') {
                    if (property === 'width') {
                        // do not set width for elements with autoWidth or split horizontal anchors
                        if (entity.element.autoWidth || Math.abs(entity.element.anchor.x - entity.element.anchor.z) > 0.001) {
                            return;
                        }
                    } else if (property === 'height') {
                        // do not set height for elements with autoHeight or split vertical anchors
                        if (entity.element.autoHeight || Math.abs(entity.element.anchor.y - entity.element.anchor.w) > 0.001) {
                            return;
                        }
                    }
                } else if (component === 'model' || component === 'render') {
                    if (property === 'aabbCenter' || property === 'aabbHalfExtents') {
                        const aabbCenter = obj.get(`components.${component}.aabbCenter`);
                        const aabbHalfExtents = obj.get(`components.${component}.aabbHalfExtents`);
                        if (aabbCenter && aabbHalfExtents) {
                            entity[component].customAabb = new pc.BoundingBox(new pc.Vec3(aabbCenter), new pc.Vec3(aabbHalfExtents));
                        }
                        return;
                    }
                } else if (component === 'collision') {
                    if (property === 'angularOffset') {
                        const v = obj.get(`components.${component}.angularOffset`);
                        const q = entity[component].angularOffset;
                        q.setFromEulerAngles(v[0], v[1], v[2]);
                        entity[component].angularOffset = q;
                        return;
                    }
                }

                value = obj.get(`components.${component}.${property}`);
                entity[component][property] = editor.call('components:convertValue', component, property, value);
            }
        }

        // subscribe to changes
        obj.on('*:set', (path, value) => {
            if (obj._silent || !path.startsWith('components')) {
                return;
            }

            const entity = app.root.findByGuid(obj.get('resource_id'));
            if (!entity) {
                return;
            }

            const parts = path.split('.');
            const component = parts[1];
            const property = parts[2];

            if (!entity[component]) {
                if (!property) {
                    // add component
                    const data = runtimeComponentData(component, value);
                    app.systems[component].addComponent(entity, data);

                    // render
                    editor.call('viewport:render');
                }
            } else if (!property) {
                for (const field in value) {
                    onSetProperty(entity, component, field, [parts[0], parts[1], field], value[field]);
                }
            } else {
                onSetProperty(entity, component, property, parts, value);
            }
        });


        obj.on('*:unset', (path) => {
            if (obj._silent || !path.startsWith('components')) {
                return;
            }

            const entity = app.root.findByGuid(obj.get('resource_id'));
            if (!entity) return;

            const parts = path.split('.');
            const component = parts[1];
            const property = parts[2];

            if (property) {
                if (component === 'script' && property === 'scripts' && !editor.call('settings:project').get('useLegacyScripts')) {
                    if (!entity.script || parts.length <= 3) {
                        return;
                    }

                    const script = entity.script[parts[3]];
                    if (!script) {
                        return;
                    }

                    if (parts.length === 4) {
                        // remove script
                        entity.script.destroy(parts[3]);
                    } else if (parts.length === 6 && parts[4] === 'attributes' && !pc.createScript.reservedAttributes[parts[5]]) {
                        // unset attribute
                        delete script[parts[5]];
                        delete script.__attributes[parts[5]];
                    } else if (parts.length > 6 && parts[4] === 'attributes' && !pc.createScript.reservedAttributes[parts[5]]) {
                        // update attribute
                        script[parts[5]] = obj.get(`components.script.scripts.${parts[3]}.attributes.${parts[5]}`);
                    }
                } else if ((component === 'model' || component === 'render') && (property === 'aabbCenter' || property === 'aabbHalfExtents')) {
                    entity[component].customAabb = null;
                } else {
                    // edit component property
                    const value = obj.get(`components.${component}.${property}`);
                    entity[component][property] = editor.call('components:convertValue', component, property, value);
                }
            } else if (entity[component]) {
                // remove component
                app.systems[component].removeComponent(entity);
            }
        });

        const setComponentProperty = function (path, value, ind) {
            if (obj._silent || !path.startsWith('components')) {
                return;
            }

            const entity = app.root.findByGuid(obj.get('resource_id'));
            if (!entity) return;

            const parts = path.split('.');
            const component = parts[1];
            const property = parts[2];

            if (property) {
                if (component === 'script') {
                    if (property === 'order') {
                        // update script order
                        entity.script.move(value, ind);
                    } else if (property === 'scripts') {
                        if (!entity.script || parts.length <= 3) {
                            return;
                        }

                        const script = entity.script[parts[3]];
                        if (!script) {
                            return;
                        }

                        if (parts.length > 6 && parts[4] === 'attributes' && !pc.createScript.reservedAttributes[parts[5]]) {
                            // update attribute
                            script[parts[5]] = obj.get(`components.script.scripts.${parts[3]}.attributes.${parts[5]}`);
                        }
                    }
                } else {
                    // edit component property
                    value = obj.get(`components.${component}.${property}`);
                    entity[component][property] = editor.call('components:convertValue', component, property, value);
                }
            }
        };

        obj.on('*:insert', setComponentProperty);
        obj.on('*:remove', setComponentProperty);
        obj.on('*:move', setComponentProperty);
    });
});
