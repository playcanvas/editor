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
            this._projectSettings = args.projectSettings;

            this._fields = {};
            this._fieldAttributes = {};

            this._templateOverridesSidebar = args.templateOverridesSidebar;

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

        _createTooltip(label, tooltipData) {
            const tooltip = editor.call('attributes:reference', {
                element: label.dom,
                title: tooltipData.title,
                subTitle: tooltipData.subTitle,
                description: tooltipData.description
            });

            tooltip.attach({
                target: label,
                element: label.dom
            });

            label.once('destroy', () => {
                tooltip.destroy();
            });
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
                            field.link(this._observers, attr.path || attr.paths);
                        }
                    }
                }

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

                        if (attr.reference) {
                            editor.call('attributes:reference:attach', attr.reference, labelGroup.label);
                        } else if (attr.tooltip) {
                            this._createTooltip(labelGroup.label, attr.tooltip);
                        }
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

                    if (attr.reference) {
                        editor.call('attributes:reference:attach', attr.reference, field._label);
                    } else if (attr.tooltip) {
                        this._createTooltip(field._label, attr.tooltip);
                    }
                }

                if (this._templateOverridesSidebar) {
                    if (attr.path) {
                        const field = this.getField(attr.path);
                        this._templateOverridesSidebar.registerElementForPath(attr.path, attr.type === 'asset' ? field.dom : field.parent.dom);
                    } else if (attr.paths) {
                        attr.paths.forEach(path => {
                            // use first path to get field as subsequent paths
                            // are not going to be used to index the field in the attribute inspector
                            const field = this.getField(attr.paths[0]);
                            this._templateOverridesSidebar.registerElementForPath(path, attr.type === 'asset' ? field.dom : field.parent.dom);
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

        link(observers) {
            this.unlink();

            this._observers = observers;

            for (const key in this._fieldAttributes) {
                const attr = this._fieldAttributes[key];
                const field = this.getField(key);
                field.link(observers, attr.path || attr.paths);
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

            if (this._templateOverridesSidebar) {
                for (const key in this._fieldAttributes) {
                    const attr = this._fieldAttributes[key];
                    if (attr.path) {
                        this._templateOverridesSidebar.unregisterElementForPath(attr.path);
                    } else if (attr.paths) {
                        attr.paths.forEach(path => {
                            // use first path to get field as subsequent paths
                            // are not going to be used to index the field in the attribute inspector
                            this._templateOverridesSidebar.unregisterElementForPath(path);
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
