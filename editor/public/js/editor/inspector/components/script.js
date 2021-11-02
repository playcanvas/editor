Object.assign(pcui, (function () {
    'use strict';

    const CLASS_SCRIPT_CONTAINER = 'script-component-inspector-scripts';
    const CLASS_SCRIPT = 'script-component-inspector-script';
    const CLASS_SCRIPT_ENABLED = CLASS_SCRIPT + '-enabled';
    const CLASS_SCRIPT_VALID = CLASS_SCRIPT + '-valid';
    const CLASS_SCRIPT_INVALID = CLASS_SCRIPT + '-invalid';

    const ATTRIBUTE_SUBTITLES = {
        boolean: '{Boolean}',
        number: '{Number}',
        string: '{String}',
        json: '{Object}',
        asset: '{pc.Asset}',
        entity: '{pc.Entity}',
        rgb: '{pc.Color}',
        rgba: '{pc.Color}',
        vec2: '{pc.Vec2}',
        vec3: '{pc.Vec3}',
        vec4: '{pc.Vec4}',
        curve: '{pc.Curve}'
    };

    class ScriptInspector extends pcui.Panel {
        constructor(args) {
            super(args);

            this._componentInspector = args.componentInspector;
            this._scriptName = args.scriptName;

            this.containerErrors = new pcui.Container({
                hidden: true,
                class: pcui.CLASS_ERROR
            });
            this.append(this.containerErrors);

            this._attributesInspector = null;

            this._history = args.history;
            this._argsAssets = args.assets;
            this._argsEntities = args.entities;
            this._templateOverridesInspector = args.templateOverridesInspector;

            this._asset = editor.call('assets:scripts:assetByScript', this._scriptName);

            if (this._asset) {
                this._initializeScriptAttributes();
            }

            this._labelTitle.on('click', this._onClickTitle.bind(this));

            const doesScriptNameCollide = editor.call('assets:scripts:collide', this._scriptName);

            if (!this._asset || doesScriptNameCollide) {
                this.class.add(CLASS_SCRIPT_INVALID);
            }

            this._btnEdit = new pcui.Button({
                icon: 'E130',
                class: CLASS_SCRIPT_VALID,
                enabled: true,
                ignoreParent: true
            });
            this._btnEdit.dom.tabIndex = -1;
            this._btnEdit.style.fontSize = '15px';
            this.header.append(this._btnEdit);
            this._btnEdit.on('click', this._onClickEdit.bind(this));

            const tooltipEdit = Tooltip.attach({
                target: this._btnEdit.dom,
                text: editor.call('permissions:write') ? 'Edit' : 'View',
                align: 'bottom',
                root: editor.call('layout.root')
            });
            this._btnEdit.once('destroy', () => {
                tooltipEdit.destroy();
            });

            this._btnParse = new pcui.Button({
                icon: 'E128',
                class: CLASS_SCRIPT_VALID
            });
            this._btnParse.dom.tabIndex = -1;
            this._btnParse.style.marginRight = '6px';
            this._btnParse.style.fontSize = '15px';
            this.header.append(this._btnParse);
            this._btnParse.on('click', this._onClickParse.bind(this));

            const tooltipParse = Tooltip.attach({
                target: this._btnParse.dom,
                text: 'Parse',
                align: 'bottom',
                root: editor.call('layout.root')
            });
            this._btnParse.on('destroy', () => {
                tooltipParse.destroy();
            });

            this._fieldEnable = new pcui.BooleanInput({
                type: 'toggle',
                binding: new pcui.BindingTwoWay({
                    history: args.history
                })
            });

            const enableGroup = new pcui.LabelGroup({
                text: 'On',
                class: CLASS_SCRIPT_ENABLED,
                field: this._fieldEnable
            });
            this.header.append(enableGroup);

            this._fieldEnable.on('change', value => {
                enableGroup.text = value ? 'On' : 'Off';
            });

            if (this._templateOverridesInspector) {
                this._templateOverridesInspector.registerElementForPath(`components.script.scripts.${this._scriptName}.enabled`, enableGroup);

                enableGroup.once('destroy', () => {
                    this._templateOverridesInspector.unregisterElementForPath(`components.script.scripts.${this._scriptName}.enabled`);
                });
            }

            this._labelInvalid = new pcui.Label({
                text: '!',
                class: CLASS_SCRIPT_INVALID
            });
            this.header.appendBefore(this._labelInvalid, this._labelTitle);

            this._tooltipInvalid = new pcui.TooltipReference({
                title: 'Invalid',
                description: this._getInvalidTooltipText()
            });
            this._tooltipInvalid.attach({
                target: this._labelInvalid,
                elementForHorizontalAlign: this
            });

            this._entities = null;
            this._entityEvents = [];
            this._editorEvents = [];

            this._timeoutChangeAttributes = null;
            this._changedAttributes = {};

            this._editorEvents.push(editor.on(`assets:scripts[${this._scriptName}]:attribute:set`, this._onAddAttribute.bind(this)));
            this._editorEvents.push(editor.on(`assets:scripts[${this._scriptName}]:attribute:unset`, this._onRemoveAttribute.bind(this)));
            this._editorEvents.push(editor.on(`assets:scripts[${this._scriptName}]:attribute:change`, this._onChangeAttribute.bind(this)));
            this._editorEvents.push(editor.on(`assets:scripts[${this._scriptName}]:attribute:move`, this._onMoveAttribute.bind(this)));
            this._editorEvents.push(editor.on(`assets:scripts[${this._scriptName}]:primary:set`, this._onPrimaryScriptSet.bind(this)));
            this._editorEvents.push(editor.on(`assets:scripts[${this._scriptName}]:primary:unset`, this._onPrimaryScriptUnset.bind(this)));
        }

        _initializeScriptAttributes() {
            const attributes = this._asset.get(`data.scripts.${this._scriptName}.attributes`);
            if (!attributes) return;

            const order = this._asset.get(`data.scripts.${this._scriptName}.attributesOrder`) || [];

            // script attributes inspector
            const inspectorAttributes = order.map(attribute => {
                return this._convertAttributeDataToInspectorData(attribute, attribute, attributes[attribute]);
            });

            if (this._attributesInspector) {
                this._attributesInspector.destroy();
            }

            this._attributesInspector = new pcui.AttributesInspector({
                attributes: inspectorAttributes,
                history: this._history,
                assets: this._argsAssets,
                entities: this._argsEntities,
                templateOverridesInspector: this._templateOverridesInspector
            });

            if (this._entities) {
                this._attributesInspector.link(this._entities);
            }

            this.append(this._attributesInspector);
        }

        _getInvalidTooltipText() {
            if (editor.call('assets:scripts:collide', this._scriptName)) {
                return `'${this._scriptName}' Script Object is defined in multiple preloaded assets. Please uncheck preloading for undesirable script assets.`;
            } else if (!this._asset) {
                return `'${this._scriptName}' Script Object is not defined in any preloaded script assets.`;
            }

            return '';
        }

        _onClickTitle(evt) {
            evt.stopPropagation();
            evt.preventDefault();

            if (this._asset) {
                editor.call('selector:set', 'asset', [this._asset]);
            }
        }

        _onClickEdit(evt) {
            if (this._asset) {
                editor.call('assets:edit', this._asset);
            }
        }

        _onClickParse(evt) {
            if (!this._asset) return;

            this._componentInspector.clearParseErrors();
            this.containerErrors.hidden = true;
            this.containerErrors.clear();

            this._btnParse.enabled = false;
            this._btnParse.class.remove(pcui.CLASS_ERROR);

            editor.call('scripts:parse', this._asset, (error, result) => {
                if (this.destroyed) return; // inspector might have been destroyed while waiting for parse results
                this._btnParse.enabled = true;

                if (error) {
                    this._btnParse.class.add(pcui.CLASS_ERROR);

                    this._componentInspector.onParseError(error.message, this._scriptName);
                } else {
                    result.scriptsInvalid.forEach(invalidScript => {
                        this._componentInspector.onParseError(invalidScript, this._scriptName);
                    });

                    for (const scriptName in result.scripts) {
                        var attrInvalid = result.scripts[scriptName].attributesInvalid;
                        attrInvalid.forEach(err => {
                            this._componentInspector.onParseError(err, scriptName);
                        });
                    }
                }
            });
        }

        _onClickRemove(evt) {
            super._onClickRemove(evt);

            if (!this._entities) return;

            editor.entities.removeScript(this._entities.map(e => e.apiEntity), this._scriptName);
        }

        _convertAttributeDataToInspectorData(attributeName, attributePath, attributeData) {
            let type = attributeData.type;

            let fieldArgs = {};

            // figure out attribute type
            if (attributeData.enum) {
                type = 'select';
                const selectInputArgs = {
                    type: attributeData.type,
                    options: []
                };

                for (let i = 0; i < attributeData.enum.order.length; i++) {
                    const key = attributeData.enum.order[i];
                    selectInputArgs.options.push({
                        v: attributeData.enum.options[key],
                        t: key
                    });
                }

                if (attributeData.array) {
                    fieldArgs.elementArgs = selectInputArgs;
                } else {
                    fieldArgs = selectInputArgs;
                }

            } else if (attributeData.color) {
                type = 'gradient';
                if (attributeData.color.length) {
                    fieldArgs.channels = attributeData.color.length;
                }
            } else if (type === 'curve') {
                type = 'curveset';
                fieldArgs.curves = attributeData.curves || ['Value'];
                fieldArgs.hideRandomize = true;
            } else if (type === 'asset') {
                if (attributeData.assetType) {
                    fieldArgs.assetType = attributeData.assetType;
                }
            } else if (type === 'number') {
                if (typeof(attributeData.min) === 'number' && typeof(attributeData.max) === 'number') {
                    type = 'slider';
                }
            } else if (type === 'json') {
                if (attributeData.array) {
                    // array attributes
                    fieldArgs.usePanels = true;

                    // create default value from schema
                    fieldArgs.getDefaultFn = () => {
                        const result = {};

                        if (attributeData.schema) {
                            attributeData.schema.forEach(field => {
                                if (field.hasOwnProperty('default')) {
                                    result[field.name] = utils.deepCopy(field.default);
                                } else {
                                    if (field.array) {
                                        result[field.name] = [];
                                    } else {
                                        const value = utils.deepCopy(pcui.DEFAULTS[field.type]);
                                        if (field.type === 'curve') {
                                            if (field.color || field.curves) {
                                                var len = field.color ? field.color.length : field.curves.length;
                                                var v = field.color ? 1 : 0;
                                                value.keys = [];
                                                for (var c = 0; c < len; c++) {
                                                    value.keys.push([0, v]);
                                                }
                                            }
                                        }
                                        result[field.name] = value;
                                    }
                                }
                            });
                        }
                        return result;
                    };

                    // attribute inspector attributes for each array element
                    if (!fieldArgs.elementArgs) {
                        fieldArgs.elementArgs = {};
                    }
                    fieldArgs.elementArgs.attributes = attributeData.schema.map(field => {
                        return this._convertAttributeDataToInspectorData(field.name, `${attributePath}.${field.name}`, field);
                    });
                    fieldArgs.elementArgs.history = this._history;
                    fieldArgs.elementArgs.assets = this._argsAssets;
                    fieldArgs.elementArgs.entities = this._argsEntities;
                    fieldArgs.elementArgs.templateOverridesInspector = this._templateOverridesInspector;

                } else {
                    fieldArgs.attributes = attributeData.schema.map(field => {
                        return this._convertAttributeDataToInspectorData(field.name, `${attributePath}.${field.name}`, field);
                    });
                    fieldArgs.history = this._history;
                    fieldArgs.assets = this._argsAssets;
                    fieldArgs.entities = this._argsEntities;
                    fieldArgs.templateOverridesInspector = this._templateOverridesInspector;
                }
            }

            if (attributeData.array) {
                type = 'array:' + type;
            }

            const data = {
                label: attributeData.title || attributeName,
                type: type,
                path: `components.script.scripts.${this._scriptName}.attributes.${attributePath}`,
                tooltip: {
                    title: attributeName,
                    subTitle: this._getAttributeSubtitle(attributeData),
                    description: attributeData.description || ''
                },
                args: fieldArgs
            };

            if (attributeData.default !== undefined) {
                data.value = attributeData.default;
            }

            // add additional properties
            ['precision', 'step', 'min', 'max', 'placeholder'].forEach(field => {
                if (attributeData.hasOwnProperty(field)) {
                    data.args[field] = attributeData[field];
                }
            });

            return data;
        }

        _getAttributeSubtitle(attributeData) {
            let subTitle = ATTRIBUTE_SUBTITLES[attributeData.type];

            if (attributeData.type === 'curve') {
                if (attributeData.color) {
                    if (attributeData.color.length > 1) {
                        subTitle = '{pc.CurveSet}';
                    }
                } else if (attributeData.curves && attributeData.curves.length > 1) {
                    subTitle = '{pc.CurveSet}';
                }
            }

            if (attributeData.array) {
                subTitle = '[ ' + subTitle + ' ]';
            }

            return subTitle;
        }

        _onAddAttribute(asset, name, index) {
            if (this._asset !== asset || !this._asset) return;

            const data = this._asset.get(`data.scripts.${this._scriptName}.attributes.${name}`);
            if (!data) return;

            const inspectorData = this._convertAttributeDataToInspectorData(name, name, data);
            this._attributesInspector.addAttribute(inspectorData, index);
        }

        _onRemoveAttribute(asset, name) {
            if (this._asset !== asset || !this._asset) return;

            this._attributesInspector.removeAttribute(`components.script.scripts.${this._scriptName}.attributes.${name}`);
        }

        _onChangeAttribute(asset, name) {
            if (this._asset !== asset || !this._asset) return;

            this._changedAttributes[name] = true;

            if (this._timeoutChangeAttributes) {
                clearTimeout(this._timeoutChangeAttributes);
                this._timeoutChangeAttributes = null;
            }

            this._timeoutChangeAttributes = setTimeout(() => {
                this._timeoutChangeAttributes = null;
                if (this._asset !== asset || !this._asset) return;

                const order = this._asset.get(`data.scripts.${this._scriptName}.attributesOrder`);

                for (const attr in this._changedAttributes) {
                    const index = order.indexOf(attr);
                    if (index >= 0) {
                        this._onRemoveAttribute(asset, attr);
                        this._onAddAttribute(asset, attr, index);
                    }
                }

                this._changedAttributes = {};
            });
        }

        _onMoveAttribute(asset, name, index) {
            if (this._asset !== asset || !this._asset) return;

            this._attributesInspector.moveAttribute(`components.script.scripts.${this._scriptName}.attributes.${name}`, index);
        }

        _onPrimaryScriptSet(asset) {
            this._asset = asset;
            this.class.remove(CLASS_SCRIPT_INVALID);
            this._initializeScriptAttributes();
        }

        _onPrimaryScriptUnset() {
            this.class.add(CLASS_SCRIPT_INVALID);
            this._asset = null;
            if (this._attributesInspector) {
                this._attributesInspector.destroy();
                this._attributesInspector = null;
            }

            this._tooltipInvalid.description = this._getInvalidTooltipText();
        }

        link(entities) {
            this.unlink();

            this._entities = entities;

            if (this._attributesInspector) {
                this._attributesInspector.link(entities);
            }
            this._fieldEnable.link(entities, `components.script.scripts.${this._scriptName}.enabled`);
        }

        unlink() {
            if (!this._entities) return;

            this._entities = null;

            if (this._attributesInspector) {
                this._attributesInspector.unlink();
            }
            this._fieldEnable.unlink();

            if (this._timeoutChangeAttributes) {
                clearTimeout(this._timeoutChangeAttributes);
                this._timeoutChangeAttributes = null;
            }

            this._changedAttributes = {};
        }

        destroy() {
            if (this._destroyed) return;

            this._editorEvents.forEach(e => e.unbind());
            this._editorEvents.length = 0;

            super.destroy();
        }
    }

    class ScriptComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'script';

            super(args);

            this._scriptPanels = {};

            this._argsAssets = args.assets;
            this._argsEntities = args.entities;

            this._editorEvents = [];

            this._selectScript = new pcui.SelectInput({
                placeholder: '+ ADD SCRIPT',
                allowInput: true,
                allowCreate: true,
                createLabelText: 'Create Script',
                createFn: this._onCreateScript.bind(this),
                optionsFn: this._updateDropDown.bind(this)
            });
            this.append(this._selectScript);

            this._selectScript.on('change', this._onSelectScript.bind(this));

            this._containerScripts = new pcui.Container({
                flex: true,
                class: CLASS_SCRIPT_CONTAINER
            });
            this._containerScripts.style.margin = '6px';
            this.append(this._containerScripts);

            this._containerScripts.on('child:dragend', this._onDragEnd.bind(this));

            this._dirtyScripts = new Set();
            this._dirtyScriptsTimeout = null;

            if (this._templateOverridesInspector) {
                this._templateOverridesInspector.registerElementForPath(`components.script.order`, this, this._tooltipGroup);
            }

            this._updateScriptsTimeout = null;
        }

        _createScriptPanel(scriptName) {
            const panel = new ScriptInspector({
                componentInspector: this,
                scriptName: scriptName,
                flex: true,
                collapsible: true,
                removable: true,
                assets: this._argsAssets,
                entities: this._argsEntities,
                templateOverridesInspector: this._templateOverridesInspector,
                history: this._history,
                class: CLASS_SCRIPT
            });

            this._scriptPanels[scriptName] = panel;

            if (this._templateOverridesInspector) {
                this._templateOverridesInspector.registerElementForPath(`components.script.scripts.${scriptName}`, panel);
                panel.once('destroy', () => {
                    this._templateOverridesInspector.unregisterElementForPath(`components.script.scripts.${scriptName}`);
                });
            }

            this._containerScripts.append(panel);

            return panel;
        }

        _deferUpdateDirtyScripts() {
            if (this._dirtyScriptsTimeout) {
                cancelAnimationFrame(this._dirtyScriptsTimeout);
            }

            this._dirtyScriptsTimeout = requestAnimationFrame(this._updateDirtyScripts.bind(this));
        }

        _updateDirtyScripts() {
            if (this._dirtyScriptsTimeout) {
                cancelAnimationFrame(this._dirtyScriptsTimeout);
            }

            this._dirtyScriptsTimeout = null;

            if (this._dirtyScripts.size) {
                this._updateScripts(this._dirtyScripts);
            }

            this._dirtyScripts = new Set();
        }

        _updateScripts(filterScriptsSet) {
            if (!this._entities) return;

            const entitiesPerScript = {};

            this._entities.forEach((e, i) => {
                const order = e.get('components.script.order');
                if (!order) return;

                order.forEach((script, j) => {
                    if (filterScriptsSet && !filterScriptsSet.has(script)) return;

                    if (!entitiesPerScript[script]) {
                        entitiesPerScript[script] = [e];
                    } else {
                        entitiesPerScript[script].push(e);
                    }

                    if (!this._scriptPanels[script]) {
                        this._createScriptPanel(script);
                    }

                    if (i === 0) {
                        this._containerScripts.move(this._scriptPanels[script], j);
                    }
                });
            });

            for (const script in entitiesPerScript) {
                const panel = this._scriptPanels[script];
                panel.sortable = this._entities.length === 1;
                panel.headerText = entitiesPerScript[script].length === this._entities.length ? script : script + ' *';
                panel.link(entitiesPerScript[script]);
            }

            if (filterScriptsSet) {
                filterScriptsSet.forEach(script => {
                    if (!entitiesPerScript[script]) {
                        this._scriptPanels[script].destroy();
                        delete this._scriptPanels[script];
                    }
                });
            }
        }

        _updateDropDown() {
            if (!this._entities) return [];

            const unparsed = this._findUnparsedScripts();

            this._parseUnparsedScripts(unparsed);

            return this._findDropdownScripts();
        }

        _findUnparsedScripts() {
            let assets = this._argsAssets.array();

            assets = assets.filter(a => a.get('type') === 'script');

            return assets.filter(a => {
                return a.get('data.lastParsedHash') === '0' &&
                    a.get('file.hash');
            });
        }

        _parseUnparsedScripts(assets) {
            assets.forEach(a => editor.call('scripts:parse', a, err => {
                a.set('data.lastParsedHash', a.get('file.hash'));
            }));
        }

        _findDropdownScripts() {
            const scripts = editor.call('assets:scripts:list');

            // do not allow scripts that already exist to be created
            this._selectScript.invalidOptions = scripts;

            // remove scripts that are added in all entities
            const counts = {};
            this._entities.forEach(e => {
                const order = e.get('components.script.order');
                if (!order) return;

                order.forEach(script => {
                    if (!counts[script]) {
                        counts[script] = 1;
                    } else {
                        counts[script]++;
                    }
                });
            });

            // sort list
            scripts.sort((a, b) => {
                if (a.toLowerCase() > b.toLowerCase()) {
                    return 1;
                } else if (a.toLowerCase() < b.toLowerCase()) {
                    return -1;
                }

                return 0;
            });

            const result = scripts.filter(s => {
                return counts[s] !== this._entities.length;
            }).map(s => {
                return {
                    v: s,
                    t: s
                };
            });

            return result;
        }

        _onSelectScript(script) {
            if (!script) return;

            this._selectScript.value = null;

            this._selectScript.blur();

            this._addScriptToEntities(script);
        }

        _onCreateScript(script) {
            this._selectScript.blur();

            const filename = editor.call('picker:script-create:validate', script);
            const folder = editor.call('assets:panel:currentFolder');

            const onFilename = (filename) => {
                editor.assets.createScript({
                    folder: folder && folder.apiAsset,
                    filename: filename
                })
                .then(asset => {
                    const scripts = asset.get('data.scripts');
                    if (scripts) {
                        const keys = Object.keys(scripts);
                        if (keys.length === 1) {
                            this._addScriptToEntities(keys[0]);
                        }
                    }
                })
                .catch(err => {
                    editor.call('status:error', err);
                });
            };

            if (filename) {
                onFilename(filename);
            } else {
                editor.call('picker:script-create', onFilename, script);
            }
        }

        _addScriptToEntities(script) {
            editor.entities.addScript(this._entities.map(e => e.apiEntity), script);
        }

        _onDragEnd(scriptInspector, newIndex, oldIndex) {
            if (!this._entities || this._entities.length !== 1 || newIndex === oldIndex) return;

            this._entities[0].move('components.script.order', oldIndex, newIndex);
        }

        _onScriptAddOrRemove() {
            if (this._updateScriptsTimeout) return;

            this._updateScriptsTimeout = setTimeout(() => {
                this._updateScriptsTimeout = null;
                this._selectScript.options = this._findDropdownScripts();
            });
        }

        clearParseErrors() {
            for (const key in this._scriptPanels) {
                this._scriptPanels[key].containerErrors.clear();
                this._scriptPanels[key].containerErrors.hidden = true;
            }
        }

        onParseError(error, scriptName) {
            if (!this._scriptPanels[scriptName]) return;

            const label = new pcui.Label({
                class: pcui.CLASS_ERROR,
                text: error
            });

            this._scriptPanels[scriptName].containerErrors.append(label);
            this._scriptPanels[scriptName].containerErrors.hidden = false;
        }

        link(entities) {
            super.link(entities);

            this._updateScripts();

            entities.forEach(e => {
                this._entityEvents.push(e.on('components.script.order:remove', value => {
                    this._dirtyScripts.add(value);
                    this._deferUpdateDirtyScripts();
                }));

                this._entityEvents.push(e.on('components.script.order:insert', value => {
                    this._dirtyScripts.add(value);
                    this._deferUpdateDirtyScripts();
                }));

                this._entityEvents.push(e.on('components.script.order:move', value => {
                    this._dirtyScripts.add(value);
                    this._deferUpdateDirtyScripts();
                }));

                this._entityEvents.push(e.on('components.script.order:set', value => {
                    if (!value) return;

                    value.forEach(script => {
                        this._dirtyScripts.add(script);
                    });
                    this._deferUpdateDirtyScripts();
                }));
            });

            this._editorEvents.push(editor.on('assets:scripts:add', this._onScriptAddOrRemove.bind(this)));
            this._editorEvents.push(editor.on('assets:scripts:remove', this._onScriptAddOrRemove.bind(this)));
        }

        unlink() {
            super.unlink();

            this._editorEvents.forEach(evt => evt.unbind());
            this._editorEvents.length = 0;

            this._selectScript.close();
            this._selectScript.value = '';
            this._containerScripts.clear();
            this._scriptPanels = {};
            this._dirtyScripts = new Set();

            if (this._dirtyScriptsTimeout) {
                cancelAnimationFrame(this._dirtyScriptsTimeout);
            }

            if (this._updateScriptsTimeout) {
                clearTimeout(this._updateScriptsTimeout);
                this._updateScriptsTimeout = null;
            }
        }

        destroy() {
            if (this._destroyed) return;

            if (this._templateOverridesInspector) {
                this._templateOverridesInspector.unregisterElementForPath(`components.script.order`);
            }

            super.destroy();
        }
    }

    return {
        ScriptComponentInspector: ScriptComponentInspector
    };
})());
