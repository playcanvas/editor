Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'template-overrides';
    const CLASS_TOP_HEADER = CLASS_ROOT + '-top-header';
    const CLASS_BUTTON_CLOSE = CLASS_ROOT + '-btn-close';
    const CLASS_CONTAINER = CLASS_ROOT + '-container';
    const CLASS_ENTITY = CLASS_ROOT + '-entity';
    const CLASS_COLUMN_LEFT = CLASS_ROOT + '-column-left';
    const CLASS_COLUMN_RIGHT = CLASS_ROOT + '-column-right';
    const CLASS_COLUMN_APPLY = CLASS_ROOT + '-column-apply';
    const CLASS_COLUMN_NO_TOP_PADDING = CLASS_ROOT + '-column-no-top-padding';
    const CLASS_MARGIN_LEFT = CLASS_ROOT + '-margin-left';
    const CLASS_COMPONENT_NAME = CLASS_ROOT + '-component-name';
    const CLASS_COMPONENT_NEW = CLASS_ROOT + '-component-new';
    const CLASS_COMPONENT_REMOVED = CLASS_ROOT + '-component-removed';
    const CLASS_LABEL_TOP = CLASS_ROOT + '-label-top';
    const CLASS_COMPONENT_ICON = 'component-icon-prefix';
    const CLASS_OVERRIDE_MARKER = CLASS_ROOT + '-override-marker';
    const CLASS_OVERRIDE_MARKER_HIDDEN = CLASS_ROOT + '-override-marker-hidden';
    const CLASS_OVERRIDE_GROUP = CLASS_ROOT + '-override-group';
    const CLASS_OVERRIDE_GROUP_NOT_FIRST = CLASS_OVERRIDE_GROUP + '-not-first';
    const CLASS_OVERRIDE_GROUP_PLACEHOLDER = CLASS_OVERRIDE_GROUP + '-placeholder';
    const CLASS_OVERRIDE_GROUP_CONTENT = CLASS_OVERRIDE_GROUP + '-content';
    const CLASS_OVERRIDE_GROUP_ICON = CLASS_OVERRIDE_GROUP + '-icon';
    const CLASS_OVERRIDE_GROUP_NAME = CLASS_OVERRIDE_GROUP + '-name';
    const CLASS_OVERRIDE_GROUP_ACTION = CLASS_OVERRIDE_GROUP + '-action';
    const CLASS_OVERRIDE_GROUP_ATTRIBUTE = CLASS_OVERRIDE_GROUP + '-attribute';
    const CLASS_OVERRIDE_GROUP_ATTRIBUTE_FIRST = CLASS_OVERRIDE_GROUP_ATTRIBUTE + '-first';
    const CLASS_OVERRIDE_GROUP_ATTRIBUTE_LAST = CLASS_OVERRIDE_GROUP_ATTRIBUTE + '-last';
    const CLASS_OVERRIDE_SINGLE_LABEL = CLASS_ROOT + '-override-single-label';
    const CLASS_DROPDOWN_MENU = CLASS_ROOT + '-dropdown';

    // prettier component names for multiple words
    const COMPONENT_TITLES = {
        'audiolistener': 'AUDIO LISTENER',
        'audiosource': 'AUDIO SOURCE',
        'layoutchild': 'LAYOUT CHILD',
        'layoutgroup': 'LAYOUT GROUP',
        'particlesystem': 'PARTICLE SYSTEM',
        'rigidbody': 'RIGID BODY',
        'scrollview': 'SCROLL VIEW'
    };

    const ICONS = {
        script: '&#57910;',
        sound: '&#57751;',
        sprite: '&#58261;',
        model: '&#57749;'
    };

    class TemplateOverridesView extends pcui.Container {
        constructor(args) {
            super(args);

            this.class.add(CLASS_ROOT);

            this._overrides = null;
            this._templateAsset = null;
            this._entity = null;

            this._assets = args.assets;
            this._entities = args.entities;
            this._templateEntities = new ObserverList({
                index: 'resource_id'
            });
            this._projectSettings = args.projectSettings;

            // top header
            const topHeader = new pcui.Container({
                class: CLASS_TOP_HEADER,
                flex: true
            });
            topHeader.append(new pcui.Label({
                text: 'TEMPLATE ASSET'
            }));

            topHeader.append(new pcui.Label({
                text: 'TEMPLATE INSTANCE',
                class: CLASS_MARGIN_LEFT
            }));
            this.append(topHeader);

            const btnClose = new pcui.Button({
                text: 'Close',
                class: CLASS_BUTTON_CLOSE
            });
            topHeader.append(btnClose);
            btnClose.on('click', () => {
                this.hidden = true;
            });

            this._containerOverrides = new pcui.Container({
                class: CLASS_CONTAINER,
                flex: true,
                scrollable: true
            });
            this.append(this._containerOverrides);

            this._dropdownMenu = new pcui.Container({
                class: CLASS_DROPDOWN_MENU,
                flex: true,
                hidden: true
            });

            this.append(this._dropdownMenu);

            this._dropdownMarker = null;

            this.on('hide', () => {
                this._overrides = null;
            });

            this._evtWindowClick = this._onWindowClick.bind(this);

            this._dropdownMenu.on('show', () => {
                window.addEventListener('click', this._evtWindowClick);
            });

            this._dropdownMenu.on('hide', () => {
                window.removeEventListener('click', this._evtWindowClick);
            });
        }

        _onWindowClick(e) {
            if (this._dropdownMarker && this._dropdownMarker.dom.contains(e.target)) {
                return;
            }

            this._dropdownMenu.hidden = true;
        }

        _appendLeft(panel, element) {
            element.class.add(CLASS_COLUMN_LEFT);
            panel.append(element);
        }

        _appendRight(panel, element) {
            element.class.add(CLASS_COLUMN_RIGHT);
            panel.append(element);
        }

        _appendMarker(panel, element) {
            const container = new pcui.Container({
                class: CLASS_COLUMN_APPLY,
                flex: true
            });
            container.append(element);
            panel.append(container);
        }

        _layerName(id) {
            return this._projectSettings.get(`layers.${id}.name`) || id;
        }

        _batchGroupName(id) {
            return this._projectSettings.get(`batchGroups.${id}.name`) || id;
        }

        _createLabelGroup(name, type, value, isArray, entities) {
            let field;

            if (type.startsWith('array:') && type !== 'array:asset') {
                type = type.substring('array:'.length);
                isArray = true;
            }

            if (type === 'layer') {
                // convert layers from ids to names
                if (value) {
                    if (isArray) {
                        value = value.map(this._layerName.bind(this));
                    } else {
                        value = this._layerName(value);
                    }
                }
            } else if (type === 'batchGroup'){
                // convert batch groups to names
                if (isArray) {
                    value = value.map(this._batchGroupName.bind(this));
                } else {
                    value = this._batchGroupName(value);
                }
            }

            if (isArray) {
                field = new pcui.ArrayInput({
                    value: value,
                    type: type === 'curve' ? 'curveset' : type,
                    readOnly: true,
                    elementArgs: {
                        assets: this._assets,
                        entities: entities || this._entities
                    }
                });
            } else {

                switch (type) {
                    case 'asset':
                        field = new pcui.AssetInput({
                            value: value,
                            readOnly: true,
                            assets: this._assets,
                            text: this._prettifyName(name)
                        });
                        break;
                    case 'array:asset':
                        field = new pcui.AssetList({
                            value: value,
                            readOnly: true,
                            assets: this._assets
                        });
                        break;
                    case 'curve':
                    case 'curveset':
                        if (name === 'colorGraph') {
                            field = new pcui.GradientInput({
                                value: value,
                                text: this._prettifyName(name),
                                readOnly: true
                            });
                        } else {
                            field = new pcui.CurveInput({
                                value: value,
                                text: this._prettifyName(name),
                                readOnly: true
                            });
                        }
                        break;
                    case 'entity':
                        field = new pcui.EntityInput({
                            value: value,
                            readOnly: true,
                            entities: entities || this._entities
                        });
                        break;
                    case 'vec2':
                        field = new pcui.VectorInput({
                            value: value,
                            dimensions: 2,
                            readOnly: true
                        });
                        break;
                    case 'vec3':
                        field = new pcui.VectorInput({
                            value: value,
                            dimensions: 3,
                            readOnly: true
                        });
                        break;
                    case 'vec4':
                        field = new pcui.VectorInput({
                            value: value,
                            dimensions: 4,
                            readOnly: true
                        });
                        break;
                    case 'rgb':
                        field = new pcui.ColorInput({
                            value: value,
                            channels: 3,
                            readOnly: true
                        });
                        break;
                    case 'rgba':
                        field = new pcui.ColorInput({
                            value: value,
                            channels: 4,
                            readOnly: true
                        });
                        break;
                    case 'boolean':
                        field = new pcui.BooleanInput({
                            value: value,
                            readOnly: true
                        });
                        break;
                    case 'number':
                        field = new pcui.NumericInput({
                            value: value,
                            allowNull: true,
                            readOnly: true
                        });
                        break;
                    case 'sublayer': // todo
                    case 'object': // todo
                    default:
                        field = new pcui.TextInput({
                            value: value,
                            readOnly: true
                        });
                        break;
                }
            }

            let result = field;

            if (type !== 'asset' || isArray) {
                result = new pcui.LabelGroup({
                    text: this._prettifyName(name),
                    field: field,
                    nativeTooltip: true
                });
            }

            if (type === 'array:asset' || isArray) {
                result.class.add(CLASS_LABEL_TOP);
            }

            return result;
        }

        // Converts values like so: thisIsSomeValue to this: This Is Some Value
        _prettifyName(name) {
            const firstLetter = name[0];
            const rest = name.slice(1);
            return firstLetter.toUpperCase() +
            rest
            // insert a space before all caps and numbers
            .replace(/([A-Z0-9])/g, ' $1')
            // replace special characters with spaces
            .replace(/[^a-zA-Z0-9](.)/g, (match, group) => {
                return ' ' + group.toUpperCase();
            });
        }

        _createOverrideMarker(override, type) {
            const label = new pcui.Label({
                class: CLASS_OVERRIDE_MARKER,
                text: override ? '&#58208;' : '',
                unsafe: true
            });

            if (override) {
                label.on('click', (e) => {
                    this._dropdownMenu.clear();

                    if (this._dropdownMarker === label) {
                        this._dropdownMenu.hidden = !this._dropdownMenu.hidden;
                    } else {
                        this._dropdownMenu.hidden = false;
                    }

                    if (this._dropdownMenu.hidden) {
                        this._dropdownMarker = null;
                        return;
                    }

                    this._dropdownMarker = label;

                    let templates;
                    if (type === 'addedEntity') {
                        templates = editor.call('templates:findApplyCandidatesForNewEntity', this._entity, override, this._entities);
                    } else if (type === 'deletedEntity') {
                        templates = editor.call('templates:findApplyCandidatesForDeletedEntity', this._entity, override, this._entities);
                    } else {
                        templates = editor.call('templates:findApplyCandidatesForOverride', override, this._entities, this._entity);
                    }

                    templates.forEach(template => {
                        const apply = new pcui.Label({
                            text: `Apply to ${template.get('name')}`
                        });

                        apply.on('click', () => {
                            this._dropdownMenu.hidden = true;
                            apply.enabled = false;
                            if (!editor.call('templates:applyOverride', template, override)) {
                                apply.enabled = true;
                            }
                        });

                        this._dropdownMenu.append(apply);
                    });

                    const revert = new pcui.Label({
                        text: 'Revert'
                    });

                    revert.on('click', () => {
                        this._dropdownMenu.hidden = true;

                        if (type === 'addedEntity') {
                            editor.call('templates:revertNewEntity', override.resource_id, this._entities);
                        } else if (type === 'deletedEntity') {
                            editor.call('templates:revertDeletedEntity', override, this._entity, this._entities);
                        } else {
                            editor.call('templates:revertOverride', override, this._entities);
                        }
                    });

                    this._dropdownMenu.append(revert);

                    this._positionDropdown(e);

                });
            } else {
                label.class.add(CLASS_OVERRIDE_MARKER_HIDDEN);
            }

            return label;
        }

        _positionDropdown(e) {
            const parentRect = this.dom.getBoundingClientRect();
            this._dropdownMenu.style.top = `${e.clientY - parentRect.top}px`;
            this._dropdownMenu.style.right = '20px';
        }

        // Creates 2 label groups one for the left side (template asset) and
        // one for the right side (template instance). Also creates an override marker
        // on the 3rd column
        _createGridLine(name, type, override, isArray) {
            let dstValue = override.dst_value;
            let srcValue = override.src_value;

            if (name === 'path' && override.path_data) {
                dstValue = override.path_data.dst.names.join('/');
                srcValue = override.path_data.src.names.join('/');
            }

            return [
                // left side uses dst_value and the entities from the template asset
                this._createLabelGroup(name, type, dstValue, isArray, this._templateEntities),
                // right side uses src_value and the entities from the scene
                this._createLabelGroup(name, type, srcValue, isArray, this._entities),
                // marker to apply or revert override
                this._createOverrideMarker(override)
            ];
        }

        // Creates an override group for the left and right sides
        _handleOverrideGroup(name, override, result) {
            let markerOverride = override;

            if (override.missing_in_dst) {
                result.push(new OverrideGroup({
                    mode: 'empty'
                }));
                result.push(new OverrideGroup({
                    name: name,
                    mode: 'new'
                }));
            } else if (override.missing_in_src) {
                result.push(new OverrideGroup({
                    name: name
                }));
                result.push(new OverrideGroup({
                    name: name,
                    mode: 'removed'
                }));
            } else {
                // for this case we are only adding a header on each side
                // so do not show an override marker for this
                markerOverride = null;

                result.push(new OverrideGroup({
                    name: name
                }));
                result.push(new OverrideGroup({
                    name: name
                }));
            }

            result.push(this._createOverrideMarker(markerOverride));
        }

        _handleScriptComponent(result, override, pathParts) {
            if (pathParts[2] === 'scripts') {
                const scriptName = pathParts[3];
                if (!result.overrideGroups) {
                    result.overrideGroups = {};
                }

                if (!result.overrideGroups[scriptName]) {
                    result.overrideGroups[scriptName] = {
                        header: [],
                        properties: []
                    };

                    this._handleOverrideGroup(
                        scriptName,
                        override,
                        result.overrideGroups[scriptName].header
                    );
                }

                let attributeName;
                let type = 'string';
                let isArray = false;

                if (pathParts.length === 6 && pathParts[4] === 'attributes') {
                    attributeName = pathParts[5];

                    const scriptAsset = editor.call('assets:scripts:assetByScript', scriptName);
                    if (scriptAsset) {
                        // get attribute type
                        const attributeOptions = scriptAsset.get(`data.scripts.${scriptName}.attributes.${attributeName}`);
                        if (attributeOptions) {
                            isArray = attributeOptions.array;
                            type = attributeOptions.type;
                        }
                    }
                } else if (pathParts.length === 5) {
                    attributeName = pathParts[4];
                    type = editor.call('schema:getTypeForPath', config.schema.scene, `entities.$.${override.path}`);
                }

                if (attributeName) {
                    const pair = this._createGridLine(attributeName, type, override, isArray);
                    pair[0].class.add(CLASS_OVERRIDE_GROUP_ATTRIBUTE);
                    pair[1].class.add(CLASS_OVERRIDE_GROUP_ATTRIBUTE);
                    result.overrideGroups[scriptName].properties.push(...pair);
                }
            }
        }

        _handleSoundComponent(result, override, pathParts) {
            let soundSlotName;
            if (pathParts.length === 4) {
                if (override.dst_value) {
                    soundSlotName = override.dst_value.name;
                } else if (override.src_value) {
                    soundSlotName = override.src_value.name;
                }
            } else {
                const entity = this._entities.get(override.resource_id);
                if (entity) {
                    soundSlotName = entity.get(`components.sound.slots.${pathParts[3]}.name`);
                }
            }

            if (!soundSlotName) {
                soundSlotName = `Slot ${pathParts[3]}`;
            }

            if (!result.overrideGroups) {
                result.overrideGroups = {};
            }

            if (!result.overrideGroups[soundSlotName]) {
                result.overrideGroups[soundSlotName] = {
                    header: [],
                    properties: []
                };

                this._handleOverrideGroup(
                    soundSlotName,
                    override,
                    result.overrideGroups[soundSlotName].header
                );
            }

            if (pathParts.length === 4) {
                if (override.missing_in_dst) {
                    result.overrideGroups[soundSlotName].missingInDst = true;
                } else if (override.missing_in_src) {
                    result.overrideGroups[soundSlotName].missingInSrc = true;
                }
            } else {
                const type = editor.call('schema:getTypeForPath', config.schema.scene, `entities.$.${override.path}`);
                const field = pathParts[4];
                result.overrideGroups[soundSlotName].properties.push(...this._createGridLine(field, type, override, false));
            }
        }

        _handleSpriteComponent(result, override, pathParts) {
            let clipName;
            if (pathParts.length === 4) {
                if (override.dst_value) {
                    clipName = override.dst_value.name;
                } else if (override.src_value) {
                    clipName = override.src_value.name;
                }
            } else {
                const entity = this._entities.get(override.resource_id);
                if (entity) {
                    clipName = entity.get(`components.sprite.clips.${pathParts[3]}.name`);
                }
            }

            if (!clipName) {
                clipName = `Clip ${pathParts[3]}`;
            }

            if (!result.overrideGroups) {
                result.overrideGroups = {};
            }

            if (!result.overrideGroups[clipName]) {
                result.overrideGroups[clipName] = {
                    header: [],
                    properties: []
                };

                this._handleOverrideGroup(
                    clipName,
                    override,
                    result.overrideGroups[clipName].header
                );
            }

            if (pathParts.length === 4) {
                if (override.missing_in_dst) {
                    result.overrideGroups[clipName].missingInDst = true;
                } else if (override.missing_in_src) {
                    result.overrideGroups[clipName].missingInSrc = true;
                }
            } else {
                const type = editor.call('schema:getTypeForPath', config.schema.scene, `entities.$.${override.path}`);
                const field = pathParts[4];
                result.overrideGroups[clipName].properties.push(...this._createGridLine(field, type, override, false));
            }

        }

        _handleModelComponent(result, override, pathParts) {
            if (pathParts[2] !== 'mapping') return;

            if (!result.overrideGroups) {
                result.overrideGroups = {};
            }

            const name = pathParts.length === 3 ? 'Entity Materials' : `Mesh ${pathParts[3]} Material`;
            result.overrideGroups[name] = {
                header: [],
                properties: []
            };

            this._handleOverrideGroup(
                name,
                override,
                result.overrideGroups[name].header
            );

            if (!override.missing_in_dst && !override.missing_in_src) {
                result.overrideGroups[name].properties.push(...this._createGridLine('Material', 'asset', override, false));
            }
        }

        _showOverrides() {
            // clear all overrides
            this._dropdownMarker = null;
            this._dropdownMenu.hidden = true;
            this._containerOverrides.clear();

            // build an entity observer list from the entities of the template asset
            this._templateEntities.clear();
            const templateEntities = this._templateAsset.get('data.entities');
            for (const resourceId in templateEntities) {
                this._templateEntities.add(new Observer(templateEntities[resourceId]));
            }

            const sorted = this._getSortedOverrides();

            sorted.forEach(entry => {
                if (entry.addedEntity) {
                    this._showAddedEntity(entry.addedEntity);
                }
                if (entry.deletedEntity) {
                    this._showDeletedEntity(entry.deletedEntity);
                }
                if (entry.conflicts) {
                    this._showConflicts(entry.resourceId, entry.conflicts);
                }
            });
        }

        _getSortedOverrides() {
            const resourceIds = {};
            const result = [];

            function getEntry(resourceId, name) {
                let entry = resourceIds[resourceId];
                if (!entry) {
                    entry = {
                        resourceId: resourceId,
                        name: name.toLowerCase()
                    };
                    resourceIds[resourceId] = entry;
                    result.push(entry);
                }

                return entry;
            }

            this._overrides.addedEntities.forEach(e => {
                const entry = getEntry(e.resource_id, e.name);
                entry.addedEntity = e;
            });

            this._overrides.deletedEntities.forEach(e => {
                const entry = getEntry(e.resource_id, e.name);
                entry.deletedEntity = e;
            });

            this._overrides.conflicts.forEach(override => {
                const entity = this._entities.get(override.resource_id);
                const entry = getEntry(override.resource_id, entity ? entity.get('name') : override.resource_id);
                if (!entry.conflicts) {
                    entry.conflicts = [];
                }

                entry.conflicts.push(override);
            });

            result.sort((a, b) => {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            });

            result.forEach(entry => {
                if (entry.conflicts) {
                    entry.conflicts.sort((a, b) => {
                        if (a.path < b.path) return -1;
                        if (a.path > b.path) return 1;
                        return 0;
                    });
                }
            });

            return result;
        }

        _showAddedEntity(entityOverride) {
            const panel = new pcui.Panel({
                class: CLASS_ENTITY,
                grid: true,
                headerText: entityOverride.name,
                collapsible: true
            });

            this._appendLeft(panel, new pcui.Label({
                text: 'NO ENTITY',
                class: CLASS_OVERRIDE_SINGLE_LABEL
            }));

            this._appendRight(panel, new pcui.Label({
                text: 'NEW ENTITY',
                class: CLASS_OVERRIDE_SINGLE_LABEL
            }));

            this._appendMarker(panel, this._createOverrideMarker(entityOverride, 'addedEntity'));

            this._containerOverrides.append(panel);
        }

        _showDeletedEntity(entityOverride) {
            const panel = new pcui.Panel({
                class: CLASS_ENTITY,
                grid: true,
                headerText: entityOverride.name,
                collapsible: true
            });

            this._appendLeft(panel, new pcui.Label({
                text: 'ENTITY EXISTS',
                class: CLASS_OVERRIDE_SINGLE_LABEL
            }));

            this._appendRight(panel, new pcui.Label({
                text: 'ENTITY REMOVED',
                class: CLASS_OVERRIDE_SINGLE_LABEL
            }));

            this._appendMarker(panel, this._createOverrideMarker(entityOverride, 'deletedEntity'));

            this._containerOverrides.append(panel);
        }

        _showConflicts(resourceId, conflicts) {
            const entity = this._entities.get(resourceId);

            const fields = {
                properties: [],
                components: {}
            };

            const panel = new pcui.Panel({
                class: CLASS_ENTITY,
                grid: true,
                headerText: entity.get('name'),
                collapsible: true
            });


            // eslint-disable-next-line no-loop-func
            conflicts.forEach(override => {
                const parts = override.path.split('.');
                let type;
                let field;

                if (parts.length === 1) {
                    if (parts[0] === 'parent') {
                        field = 'path';
                        type = 'string';
                    } else {
                        field = parts[0];
                        type = editor.call('schema:getTypeForPath', config.schema.scene, `entities.$.${parts[0]}`);
                    }

                    fields.properties.push(...this._createGridLine(field, type, override, false));

                } else {
                    if (parts[0] === 'components') {
                        const component = parts[1];

                        if (!fields.components[component]) {
                            fields.components[component] = {
                                properties: []
                            };
                        }

                        if (parts.length === 2) {
                            if (override.missing_in_dst) {
                                fields.components[component].missingInDst = true;
                            }

                            if (override.missing_in_src) {
                                fields.components[component].missingInSrc = true;
                            }

                            fields.components[component].override = override;

                        } else if (parts.length === 3) {
                            if (component === 'model' && parts[2] === 'mapping') {
                                this._handleModelComponent(fields.components.model, override, parts);
                            } else {
                                type = editor.call('schema:getTypeForPath', config.schema.scene, `entities.$.components.${parts[1]}.${parts[2]}`);
                                field = parts[2];
                                fields.components[component].properties.push(...this._createGridLine(field, type, override, false));
                            }

                        } else if (parts.length > 3) {
                            if (component === 'script') {
                                this._handleScriptComponent(fields.components.script, override, parts);
                            } else if (component === 'sound') {
                                this._handleSoundComponent(fields.components.sound, override, parts);
                            } else if (component === 'sprite') {
                                this._handleSpriteComponent(fields.components.sprite, override, parts);
                            } else if (component === 'model') {
                                this._handleModelComponent(fields.components.model, override, parts);
                            }

                        }
                    }
                }
            });

            this._appendFields(fields, panel);

            this._containerOverrides.append(panel);
        }

        _appendFields(fields, panel) {
            let props = fields.properties;

            for (let i = 0; i < props.length; i += 3) {
                if (i > 0) {
                    props[i].class.add(CLASS_COLUMN_NO_TOP_PADDING);
                    props[i + 1].class.add(CLASS_COLUMN_NO_TOP_PADDING);
                }

                this._appendLeft(panel, props[i]);
                this._appendRight(panel, props[i + 1]);
                this._appendMarker(panel, props[i + 2]);
            }

            for (const component in fields.components) {
                let label = new pcui.Label({
                    text: COMPONENT_TITLES[component] || component.toUpperCase(),
                    class: [CLASS_COMPONENT_NAME, CLASS_COMPONENT_ICON, `type-${component}`]
                });
                this._appendLeft(panel, label);

                label = new pcui.Label({
                    text: COMPONENT_TITLES[component] || component.toUpperCase(),
                    class: [CLASS_COMPONENT_NAME, CLASS_COMPONENT_ICON, `type-${component}`]
                });

                this._appendRight(panel, label);

                const componentOverride = fields.components[component].override;
                if (componentOverride) {
                    if (componentOverride.missing_in_dst) {
                        label.class.add(CLASS_COMPONENT_NEW);
                    } else if (componentOverride.missing_in_src) {
                        label.class.add(CLASS_COMPONENT_REMOVED);
                    }
                }

                this._appendMarker(panel, this._createOverrideMarker(componentOverride));

                props = fields.components[component].properties;

                for (let i = 0; i < props.length; i += 3) {
                    if (i > 0) {
                        props[i].class.add(CLASS_COLUMN_NO_TOP_PADDING);
                        props[i + 1].class.add(CLASS_COLUMN_NO_TOP_PADDING);
                    }

                    this._appendLeft(panel, props[i]);
                    this._appendRight(panel, props[i + 1]);
                    this._appendMarker(panel, props[i + 2]);
                }

                if (fields.components[component].overrideGroups) {
                    var groups = Object.keys(fields.components[component].overrideGroups);

                    for (let j = 0; j < groups.length; j++) {
                        const name = groups[j];
                        props = fields.components[component].overrideGroups[name].header;
                        for (let i = 0; i < props.length; i += 3) {
                            if (j > 0) {
                                props[i].class.add(CLASS_OVERRIDE_GROUP_NOT_FIRST);
                                props[i + 1].class.add(CLASS_OVERRIDE_GROUP_NOT_FIRST);
                            }

                            props[i].icon = ICONS[component];
                            props[i + 1].icon = ICONS[component];

                            this._appendLeft(panel, props[i]);
                            this._appendRight(panel, props[i + 1]);
                            this._appendMarker(panel, props[i + 2]);
                        }

                        props = fields.components[component].overrideGroups[name].properties;
                        for (let i = 0; i < props.length; i += 3) {
                            if (i === 0) {
                                props[i].class.add(CLASS_OVERRIDE_GROUP_ATTRIBUTE_FIRST);
                                props[i + 1].class.add(CLASS_OVERRIDE_GROUP_ATTRIBUTE_FIRST);
                            } else {
                                props[i].class.add(CLASS_COLUMN_NO_TOP_PADDING);
                                props[i + 1].class.add(CLASS_COLUMN_NO_TOP_PADDING);
                            }

                            if (i === props.length - 2) {
                                props[i].class.add(CLASS_OVERRIDE_GROUP_ATTRIBUTE_LAST);
                                props[i + 1].class.add(CLASS_OVERRIDE_GROUP_ATTRIBUTE_LAST);
                            }
                            this._appendLeft(panel, props[i]);
                            this._appendRight(panel, props[i + 1]);
                            this._appendMarker(panel, props[i + 2]);
                        }
                    }
                }
            }
        }

        showOverrides(overrides, templateAsset, templateInstance) {
            this._overrides = overrides;
            console.log(overrides);
            this._templateAsset = templateAsset;
            this._entity = templateInstance;

            if (this.hidden) return;

            this._showOverrides();
        }

        destroy() {
            if (this._destroyed) return;

            window.removeEventListener('click', this._evtWindowClick);

            super.destroy();
        }
    }

    class OverrideGroup extends pcui.Container {
        constructor(args) {
            super(args);

            this.class.add(CLASS_OVERRIDE_GROUP);

            const inner = new pcui.Container({
                flex: true,
                flexDirection: 'row'
            });

            this.append(inner);

            if (args.mode === 'empty') {

                inner.class.add(CLASS_OVERRIDE_GROUP_PLACEHOLDER);
            } else {
                inner.class.add(CLASS_OVERRIDE_GROUP_CONTENT);

                const icon = new pcui.Label({
                    class: CLASS_OVERRIDE_GROUP_ICON,
                    flexShrink: 0,
                    unsafe: true
                });
                this._icon = icon;

                const name = new pcui.Label({
                    text: args.name,
                    flexShrink: 1,
                    class: CLASS_OVERRIDE_GROUP_NAME
                });

                inner.append(icon);
                inner.append(name);

                if (args.mode === 'new' || args.mode === 'removed') {
                    const action = new pcui.Label({
                        flexShrink: 0,
                        text: args.mode.toUpperCase(),
                        class: CLASS_OVERRIDE_GROUP_ACTION
                    });

                    inner.append(action);
                }
            }
        }

        set icon(value) {
            if (this._icon) {
                this._icon.text = value;
            }
        }
    }

    return {
        TemplateOverridesView: TemplateOverridesView
    };
})());
