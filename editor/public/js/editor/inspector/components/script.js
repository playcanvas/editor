Object.assign(pcui, (function () {
    'use strict';

    const CLASS_SCRIPT_CONTAINER = 'script-component-inspector-scripts';
    const CLASS_SCRIPT = 'script-component-inspector-script';
    const CLASS_SCRIPT_ENABLED = CLASS_SCRIPT + '-enabled';
    const CLASS_SCRIPT_VALID = CLASS_SCRIPT + '-valid';
    const CLASS_SCRIPT_INVALID = CLASS_SCRIPT + '-invalid';

    class ScriptComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'script';

            super(args);

            this._scriptPanels = {};

            this._argsAssets = args.assets;
            this._argsEntities = args.entities;

            this._selectScript = new pcui.SelectInput({
                placeholder: '+ ADD SCRIPT',
                allowInput: true,
                allowCreate: true,
                createLabelText: 'Create Script',
                createFn: this._onCreateScript.bind(this),
                optionsFn: this._getDropdownScripts.bind(this)
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
        }

        _createScriptPanel(scriptName) {
            const panel = new ScriptInspector({
                scriptName: scriptName,
                flex: true,
                collapsible: true,
                removable: true,
                assets: this._argsAssets,
                entities: this._argsEntities,
                history: this._history,
                class: CLASS_SCRIPT
            });

            this._scriptPanels[scriptName] = panel;

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

        _getDropdownScripts() {
            if (!this._entities) return [];

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

            const onFilename = (filename) => {
                editor.call('assets:create:script', {
                    filename: filename,
                    boilerplate: true,
                    noSelect: true,
                    callback: (err, asset, result) => {
                        if (result && result.scripts) {
                            const keys = Object.keys(result.scripts);
                            if (keys.length === 1) {
                                this._addScriptToEntities(keys[0]);
                            }
                        }
                    }
                });
            };

            if (filename) {
                onFilename(filename);
            } else {
                editor.call('picker:script-create', onFilename, script);
            }
        }

        _addScriptToEntities(script) {
            const entities = this._entities.slice();

            let changed = {};

            const undo = () => {
                entities.forEach(e => {
                    e = e.latest();
                    if (!e || !changed[e.get('resource_id')] || !e.has('components.script')) return;

                    const history = e.history.enabled;
                    e.history.enabled = false;
                    e.unset(`components.script.scripts.${script}`);
                    e.removeValue('components.script.order', script);
                    e.history.enabled = history;
                });

            };

            const redo = () => {
                changed = {};
                entities.forEach(e => {
                    e = e.latest();
                    if (!e || !e.has('components.script') || e.has(`components.script.scripts.${script}`)) return;

                    changed[e.get('resource_id')] = true;
                    const history = e.history.enabled;
                    e.history.enabled = false;
                    e.set(`components.script.scripts.${script}`, {
                        enabled: true,
                        attributes: {}
                    });
                    e.insert('components.script.order', script);
                    e.history.enabled = history;
                });
            };

            redo();

            if (this._history && Object.keys(changed).length) {
                this._history.add({
                    name: 'entities.components.script.scripts.' + script,
                    undo: undo,
                    redo: redo
                });
            }
        }

        _onDragEnd(scriptInspector, newIndex, oldIndex) {
            if (!this._entities || this._entities.length !== 1 || newIndex === oldIndex) return;

            this._entities[0].move('components.script.order', oldIndex, newIndex);
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
        }

        unlink() {
            super.unlink();

            this._selectScript.close();
            this._selectScript.value = '';
            this._containerScripts.clear();
            this._scriptPanels = {};
            this._dirtyScripts = new Set();

            if (this._dirtyScriptsTimeout) {
                cancelAnimationFrame(this._dirtyScriptsTimeout);
            }
        }
    }

    class ScriptInspector extends pcui.Panel {
        constructor(args) {
            super(args);
            this._scriptName = args.scriptName;

            this._attributesInspector = null;

            this._history = args.history;
            this._argsAssets = args.assets;
            this._argsEntities = args.entities;

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
                class: CLASS_SCRIPT_VALID
            });
            this._btnEdit.dom.tabIndex = -1;
            this._btnEdit.style.fontSize = '15px';
            this.header.append(this._btnEdit);
            this._btnEdit.on('click', this._onClickEdit.bind(this));

            const tooltipEdit = Tooltip.attach({
                target: this._btnEdit.dom,
                text: 'Edit',
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

            this._labelInvalid = new pcui.Label({
                text: '!',
                class: CLASS_SCRIPT_INVALID
            });
            this.header.appendBefore(this._labelInvalid, this._labelTitle);

            this._tooltipInvalid = editor.call('attributes:reference', {
                title: 'Invalid',
                description: this._getInvalidTooltipText()
            });
            this._tooltipInvalid.attach({
                target: this,
                element: this._labelInvalid.dom
            });

            this._labelInvalid.on('destroy', () => {
                this._tooltipInvalid.destroy();
            });

            this._entities = null;
            this._entityEvents = [];
            this._editorEvents = [];

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
                return this._convertAttributeDataToInspectorData(attribute, attributes[attribute]);
            });

            if (this._attributesInspector) {
                this._attributesInspector.destroy();
            }

            this._attributesInspector = new pcui.AttributesInspector({
                attributes: inspectorAttributes,
                history: this._history,
                assets: this._argsAssets,
                entities: this._argsEntities
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

            this._btnParse.enabled = false;
            editor.call('scripts:parse', this._asset, err => {
                this._btnParse.enabled = true;
                if (err) {
                    this._btnParse.class.add(pcui.CLASS_ERROR);
                } else {
                    this._btnParse.class.remove(pcui.CLASS_ERROR);
                }
            });
        }

        _onClickRemove(evt) {
            super._onClickRemove(evt);

            if (!this._entities) return;

            const entities = this._entities.slice();

            let prev = {};

            const undo = () => {
                entities.forEach(e => {
                    e = e.latest();
                    if (!e) return;

                    if (!prev[e.get('resource_id')]) return;
                    if (!e.has('components.script') || e.get('components.script.order').indexOf(this._scriptName) !== -1) return;

                    const history = e.history.enabled;
                    e.history.enabled = false;
                    e.set(`components.script.scripts.${this._scriptName}`, prev[e.get('resource_id')].script);
                    e.insert('components.script.order', this._scriptName, prev[e.get('resource_id')].order);
                    e.history.enabled = history;
                });
            };

            const redo = () => {
                prev = {};
                entities.forEach(e => {
                    e = e.latest();
                    if (!e) return;

                    if (!e.has(`components.script.scripts.${this._scriptName}`)) return;

                    prev[e.get('resource_id')] = {
                        script: e.get(`components.script.scripts.${this._scriptName}`),
                        order: e.get('components.script.order').indexOf(this._scriptName)
                    };

                    const history = e.history.enabled;
                    e.history.enabled = false;
                    e.unset(`components.script.scripts.${this._scriptName}`);
                    e.removeValue('components.script.order', this._scriptName);
                    e.history.enabled = history;
                });
            };

            redo();

            if (this._history) {
                this._history.add({
                    name: 'entities.components.script.scripts.' + this._scriptName,
                    undo: undo,
                    redo: redo
                });
            }
        }

        _convertAttributeDataToInspectorData(attributeName, attributeData) {
            let type = attributeData.type;

            const fieldArgs = {};

            // figure out attribute type
            if (attributeData.enum) {
                type = 'select';
                fieldArgs.type = attributeData.type;
                fieldArgs.options = [];
                for (let i = 0; i < attributeData.enum.order.length; i++) {
                    const key = attributeData.enum.order[i];
                    fieldArgs.options.push({
                        v: attributeData.enum.options[key],
                        t: key
                    });
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
            }

            if (attributeData.array) {
                type = 'array:' + type;
            }

            const data = {
                label: attributeData.title || attributeName,
                type: type,
                path: `components.script.scripts.${this._scriptName}.attributes.${attributeName}`,
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

        _onAddAttribute(asset, name, index) {
            if (this._asset !== asset || !this._asset) return;

            const data = this._asset.get(`data.scripts.${this._scriptName}.attributes.${name}`);
            if (!data) return;

            const inspectorData = this._convertAttributeDataToInspectorData(name, data);
            this._attributesInspector.addAttribute(inspectorData, index);
        }

        _onRemoveAttribute(asset, name) {
            if (this._asset !== asset || !this._asset) return;
            this._attributesInspector.removeAttribute(`components.script.scripts.${this._scriptName}.attributes.${name}`);
        }

        _onChangeAttribute(asset, name) {
            if (this._asset !== asset || !this._asset) return;

            const order = this._asset.get(`data.scripts.${this._scriptName}.attributesOrder`);
            const index = order.indexOf(name);
            if (index >= 0) {
                this._onRemoveAttribute(asset, name);
                this._onAddAttribute(asset, name, index);
            }
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

            this._tooltipInvalid.html = editor.call('attributes:reference:template', {
                title: 'Invalid',
                description: this._getInvalidTooltipText()
            });
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
        }

        destroy() {
            if (this._destroyed) return;

            this._editorEvents.forEach(e => e.unbind());
            this._editorEvents.length = 0;

            super.destroy();
        }
    }

    return {
        ScriptComponentInspector: ScriptComponentInspector
    };
})());
