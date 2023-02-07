Object.assign(pcui, (function () {
    const CLASS_ROOT = 'component-inspector';
    const CLASS_COMPONENT_ICON = 'component-icon-prefix';
    const CLASS_ENABLED = CLASS_ROOT + '-enabled';

    class ComponentInspector extends pcui.Panel {
        constructor(args) {
            args = Object.assign({}, args);
            args.flex = true;
            super(args);

            this.class.add(CLASS_ROOT);
            this.class.add(args.component + '-' + CLASS_ROOT);

            this._component = args.component;

            // add common component icon class for header
            this.header.class.add(CLASS_COMPONENT_ICON);
            this.header.class.add(`type-${args.component}`);

            let title = args.component.toUpperCase();
            if (args.component === 'animation' ||
                args.component === 'model') {
                title += ' (LEGACY)';
            }
            this.headerText = title;

            this._history = args.history;

            // tooltips
            this._tooltipGroup = new pcui.TooltipGroup();

            // reference
            const ref = editor.call('attributes:reference:get', `${args.component}:component`);
            if (ref) {
                const tooltip = new pcui.TooltipReference({
                    reference: ref,
                    hidden: false
                });

                this._tooltipGroup.append(tooltip);
            }

            this._tooltipGroup.attach({
                target: this._labelTitle,
                elementForHorizontalAlign: this.header
            });

            this._fieldEnable = new pcui.BooleanInput({
                type: 'toggle',
                binding: new pcui.BindingTwoWay({
                    history: args.history
                })
            });

            const enableGroup = new pcui.LabelGroup({
                text: 'ON',
                class: CLASS_ENABLED,
                field: this._fieldEnable
            });
            this.header.append(enableGroup);

            this._fieldEnable.on('change', (value) => {
                enableGroup.text = value ? 'ON' : 'OFF';
            });

            // add cog button
            this._btnCog = new pcui.Button({
                icon: 'E134'
            });
            this._btnCog.style.fontSize = '16px';
            this.header.append(this._btnCog);

            this._localStorage = new api.LocalStorage();
            this._contextMenu = this._createContextMenu(this._btnCog);

            this._templateOverridesInspector = args.templateOverridesInspector;
            if (this._templateOverridesInspector) {
                this._templateOverridesInspector.registerElementForPath(`components.${this._component}`, this, this._tooltipGroup);
                this._templateOverridesInspector.registerElementForPath(`components.${this._component}.enabled`, enableGroup);
            }

            this._entities = null;
            this._entityEvents = [];
        }

        _createContextMenu(target) {
            const menu = new pcui.Menu({
                items: [{
                    text: 'Copy',
                    icon: 'E351',
                    onSelect: this._onClickCopy.bind(this),
                    onIsEnabled: () => {
                        return (this._entities && this._entities.length === 1);
                    }
                }, {
                    text: 'Paste',
                    icon: 'E348',
                    onSelect: this._onClickPaste.bind(this),
                    onIsEnabled: () => {
                        return this._localStorage.has('copy-component') &&
                               this._localStorage.get('copy-component-name') === this._component;
                    }
                }, {
                    text: 'Delete',
                    icon: 'E124',
                    onSelect: this._onClickDelete.bind(this)
                }]
            });

            editor.call('layout.root').append(menu);

            target.on('click', () => {
                const rect = target.dom.getBoundingClientRect();
                menu.hidden = false;
                menu.position(rect.right, rect.bottom);
            });

            return menu;
        }

        _onClickCopy() {
            const data = this._entities[0].get('components.' + this._component);
            this._localStorage.set('copy-component', JSON.stringify(data));
            this._localStorage.set('copy-component-name', this._component);
        }

        _onClickPaste() {
            let data = this._localStorage.get('copy-component');
            if (!data) return;

            data = JSON.parse(data);

            editor.call('entities:pasteComponent', this._entities, this._component, data);
        }

        // Remove component on click
        _onClickDelete() {
            if (!this._entities) return;

            // make copy of entities for undo / redo
            const entities = this._entities.slice();

            let oldValues = {};

            const undo = () => {
                for (let i = 0; i < entities.length; i++) {
                    const entity = entities[i].latest();
                    if (!entity) return;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    if (!entity.has(`components.${this._component}`) && oldValues[entity.get('resource_id')]) {
                        entity.set(`components.${this._component}`, oldValues[entity.get('resource_id')]);
                    }
                    entity.history.enabled = history;
                }
            };

            const redo = () => {
                oldValues = {};

                for (let i = 0; i < entities.length; i++) {
                    const entity = entities[i].latest();
                    if (!entity) return;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    if (entity.has(`components.${this._component}`)) {
                        oldValues[entity.get('resource_id')] = entity.get(`components.${this._component}`);
                        entity.unset(`components.${this._component}`);
                    }
                    entity.history.enabled = history;
                }
            };

            redo();

            if (this._history) {
                this._history.add({
                    name: `entities.set[components.${this._component}]`,
                    undo: undo,
                    redo: redo
                });
            }
        }

        link(entities) {
            this.unlink();
            this._entities = entities;

            const path = `components.${this._component}.enabled`;
            this._fieldEnable.link(entities, path);
        }

        unlink() {
            this._fieldEnable.unlink();

            this._entityEvents.forEach(e => e.unbind());
            this._entityEvents.length = 0;
            this._entities = null;
        }

        destroy() {
            if (this._destroyed) return;

            if (this._templateOverridesInspector) {
                this._templateOverridesInspector.unregisterElementForPath(`components.${this._component}`);
                this._templateOverridesInspector.unregisterElementForPath(`components.${this._component}.enabled`);
            }

            this._contextMenu.destroy();

            super.destroy();
        }
    }

    return {
        ComponentInspector: ComponentInspector
    };
})());
