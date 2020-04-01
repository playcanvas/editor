Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-inspector';

    class AttributesInspector extends pcui.Container {
        constructor(args) {
            args = Object.assign({
                flex: true
            }, args);

            super(args);

            this.class.add(CLASS_ROOT);

            this._observers = null;

            this._history = args.history;
            this._assets = args.assets;
            this._entities = args.entities;
            this._settings = args.settings;
            this._projectSettings = args.projectSettings;
            this._userSettings = args.userSettings;
            this._sceneSettings = args.sceneSettings;

            this._fields = {};
            this._fieldAttributes = {};

            this._templateOverridesInspector = args.templateOverridesInspector;

            // entity attributes
            args.attributes.forEach(attr => {
                this.addAttribute(attr);
            });
        }

        _getFieldKey(attributeData) {
            if (attributeData.path) {
                return attributeData.path;
            } else if (attributeData.alias) {
                return attributeData.alias;
            } else if (attributeData.paths) {
                return attributeData.paths[0];
            }

            return null;
        }

        _createTooltipGroup(target, tooltipData) {
            const group = new pcui.TooltipGroup();

            if (tooltipData) {
                const tooltip = new pcui.TooltipReference({
                    reference: tooltipData,
                    hidden: false
                });

                group.append(tooltip);
            }

            let actualTarget = target;
            if (target instanceof pcui.LabelGroup) {
                actualTarget = target.label;
            } else if (target instanceof pcui.AssetInput) {
                actualTarget = target._label;
            }

            group.attach({
                target: actualTarget,
                elementForHorizontalAlign: this
            });

            return group;
        }

        addAttribute(attr, index) {
            try {
                const fieldArgs = Object.assign({
                    binding: new pcui.BindingTwoWay({
                        history: this._history
                    }),
                    assets: this._assets,
                    entities: this._entities,
                    projectSettings: this._projectSettings
                }, attr.args);

                const field = pcui.Element.create(attr.type, fieldArgs);

                const key = this._getFieldKey(attr);
                if (key) {
                    if (this._fields[key]) {
                        this._fields[key].destroy();
                    }

                    this._fields[key] = field;
                    if (attr.path || attr.paths) {
                        this._fieldAttributes[key] = attr;
                        if (this._observers) {
                            this._linkObservers(key);
                        }
                    }
                }

                let tooltipGroup;

                if (attr.type !== 'asset') {
                    if (attr.label) {
                        const labelGroup = new pcui.LabelGroup({
                            text: attr.label,
                            field: field,
                            labelAlignTop: attr.type === 'assets' || attr.type.startsWith('array') || attr.type === 'layers'
                        });

                        this.append(labelGroup);
                        if (index >= 0) {
                            this.move(labelGroup, index);
                        }

                        let tooltipData;
                        if (attr.reference) {
                            tooltipData = editor.call('attributes:reference:get', attr.reference);
                        } else if (attr.tooltip) {
                            tooltipData = attr.tooltip;
                        }

                        tooltipGroup = this._createTooltipGroup(labelGroup, tooltipData);
                    } else {
                        this.append(field);
                        if (index >= 0) {
                            this.move(field, index);
                        }
                    }
                } else {
                    field.text = attr.label;
                    this.append(field);
                    if (index >= 0) {
                        this.move(field, index);
                    }

                    let tooltipData;
                    if (attr.reference) {
                        tooltipData = editor.call('attributes:reference:get', attr.reference);
                    } else if (attr.tooltip) {
                        tooltipData = attr.tooltip;
                    }
                    tooltipGroup = this._createTooltipGroup(field, tooltipData);
                }

                if (this._templateOverridesInspector) {
                    if (attr.path) {
                        const field = this.getField(attr.path);
                        this._templateOverridesInspector.registerElementForPath(attr.path, attr.type === 'asset' ? field : field.parent, tooltipGroup);
                    } else if (attr.paths) {
                        attr.paths.forEach(path => {
                            // use first path to get field as subsequent paths
                            // are not going to be used to index the field in the attribute inspector
                            const field = this.getField(attr.paths[0]);
                            this._templateOverridesInspector.registerElementForPath(path, attr.type === 'asset' ? field : field.parent, tooltipGroup);
                        });
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }

        removeAttribute(path) {
            if (this._fields[path]) {
                if (this._fields[path] instanceof pcui.AssetInput) {
                    this._fields[path].destroy();
                } else {
                    this._fields[path].parent.destroy();
                }
                delete this._fields[path];
            }

            delete this._fieldAttributes[path];
        }

        moveAttribute(path, index) {
            let field = this._fields[path];
            if (!field) return;

            if (!(field instanceof pcui.AssetInput)) {
                field = field.parent;
            }

            this.move(field, index);
        }

        _linkObservers(key) {
            const field = this.getField(key);
            const attr = this._fieldAttributes[key];
            if (attr.observer) {
                const observer = this[`_${attr.observer}`];
                if (observer)
                    field.link([observer], attr.path || attr.paths);
                else
                    console.error(`This attributes inspector does not contain a valid observer for attr: "${key}". attr.observer is currently: "${attr.observer}".`);
            } else {
                field.link(this._observers, attr.path || attr.paths);
            }
        }

        link(observers) {
            this.unlink();

            this._observers = observers;

            for (const key in this._fieldAttributes) {
                this._linkObservers(key);
            }
        }

        unlink() {
            if (!this._observers) return;

            this._observers = null;

            for (const key in this._fieldAttributes) {
                const field = this.getField(key);
                field.unlink();
            }
        }

        getField(path) {
            return this._fields[path];
        }

        destroy() {
            if (this._destroyed) return;

            if (this._templateOverridesInspector) {
                for (const key in this._fieldAttributes) {
                    const attr = this._fieldAttributes[key];
                    if (attr.path) {
                        this._templateOverridesInspector.unregisterElementForPath(attr.path);
                    } else if (attr.paths) {
                        attr.paths.forEach(path => {
                            // use first path to get field as subsequent paths
                            // are not going to be used to index the field in the attribute inspector
                            this._templateOverridesInspector.unregisterElementForPath(path);
                        });
                    }
                }
            }

            super.destroy();
        }
    }

    return {
        AttributesInspector: AttributesInspector
    };
})());
