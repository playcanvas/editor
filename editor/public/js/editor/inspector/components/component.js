Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'component-inspector';
    const CLASS_COMPONENT_ICON = 'component-icon-prefix';
    const CLASS_ENABLED = CLASS_ROOT + '-enabled';

    class ComponentInspector extends pcui.Panel {
        constructor(args) {
            args = Object.assign({}, args);
            args.flex = true;
            args.removable = true;
            super(args);

            this.class.add(CLASS_ROOT);
            this.class.add(args.component + '-' + CLASS_ROOT);

            this._component = args.component;

            // add common component icon class for header
            this.header.class.add(CLASS_COMPONENT_ICON);
            this.header.class.add(`type-${args.component}`);

            this.headerText = args.component.toUpperCase();

            this._history = args.history;

            // reference
            editor.call('attributes:reference:attach', `${args.component}:component`, this.header, this._labelTitle.dom);

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

            this._fieldEnable.on('change', value => {
                enableGroup.text = value ? 'ON' : 'OFF';
            });

            this._templateOverridesSidebar = args.templateOverridesSidebar;
            if (this._templateOverridesSidebar) {
                this._templateOverridesSidebar.registerElementForPath(`components.${this._component}`, this.dom);
                this._templateOverridesSidebar.registerElementForPath(`components.${this._component}.enabled`, this._fieldEnable.dom);
            }

            this._entities = null;
            this._entityEvents = [];
        }

        // Remove component on click
        _onClickRemove(evt) {
            super._onClickRemove(evt);

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

            if (this._templateOverridesSidebar) {
                this._templateOverridesSidebar.unregisterElementForPath(`components.${this._component}`);
                this._templateOverridesSidebar.unregisterElementForPath(`components.${this._component}.enabled`);
            }

            super.destroy();
        }
    }

    return {
        ComponentInspector: ComponentInspector
    };
})());
