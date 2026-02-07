import type { EventHandle, Observer } from '@playcanvas/observer';
import { BindingTwoWay, BooleanInput, Button, Container, Label, LabelGroup, Menu, Panel } from '@playcanvas/pcui';

import { tooltip, tooltipRefItem } from '@/common/tooltips';
import { LocalStorage } from '@playcanvas/editor-api';

import type { TemplateOverrideInspector } from '../../templates/templates-override-inspector.js';

const CLASS_ROOT = 'component-inspector';
const CLASS_COMPONENT_ICON = 'component-icon';
const CLASS_ENABLED = `${CLASS_ROOT}-enabled`;

class ComponentInspector extends Panel {
    _component: string;

    _localStorage: LocalStorage;

    _entities: Observer[] | null = null;

    _entityEvents: EventHandle[] = [];

    private _templateOverridesInspector: TemplateOverrideInspector;

    private _tooltipGroup: Container;

    private _fieldEnable: BooleanInput;

    private _btnHelp: Button;

    private _btnMenu: Button;

    private _contextMenu: Menu;

    constructor(args) {
        args = Object.assign({}, args);
        args.flex = true;
        args.collapsible = true;
        super(args);

        this.class.add(CLASS_ROOT);
        this.class.add(`${args.component}-${CLASS_ROOT}`);

        this._component = args.component;

        // add component icon as a separate element (to the right of the collapse arrow)
        const iconLabel = new Label({
            class: [CLASS_COMPONENT_ICON, `type-${args.component}`]
        });
        this.header.prepend(iconLabel);

        let title = args.component.toUpperCase();
        if (args.component === 'animation' ||
            args.component === 'model') {
            title += ' (LEGACY)';
        }
        if (args.component === 'audiosource') {
            title += editor.projectEngineV2 ? ' (REMOVED)' : ' (LEGACY)';
        }
        this.headerText = title;

        this._history = args.history;

        // tooltips
        this._tooltipGroup = new Container({
            class: 'tooltip-group'
        });
        tooltip().attach({
            container: this._tooltipGroup,
            target: this._labelTitle,
            horzAlignEl: this.header
        });

        // reference
        const ref = editor.call('attributes:reference:get', `${args.component}:component`);
        if (ref) {
            this._tooltipGroup.append(tooltipRefItem({
                reference: ref
            }));
        }

        this._fieldEnable = new BooleanInput({
            type: 'toggle',
            binding: new BindingTwoWay({
                history: args.history
            })
        });

        const enableGroup = new LabelGroup({
            text: 'ON',
            class: CLASS_ENABLED,
            field: this._fieldEnable
        });
        this.header.append(enableGroup);

        this._fieldEnable.on('change', (value) => {
            enableGroup.text = value ? 'ON' : 'OFF';
        });

        // add help button
        this._btnHelp = new Button({
            icon: 'E138',
            class: 'component-header-btn'
        });
        this._btnHelp.on('click', () => {
            const slug = this._component === 'audiosource' ? 'sound' : this._component;
            window.open(`https://developer.playcanvas.com/user-manual/editor/scenes/components/${slug}/`, '_blank', 'noopener,noreferrer');
        });
        this.header.append(this._btnHelp);

        // add context menu button
        this._btnMenu = new Button({
            icon: 'E235',
            class: 'component-header-btn'
        });
        this.header.append(this._btnMenu);

        this._localStorage = new LocalStorage();
        this._contextMenu = this._createContextMenu(this._btnMenu);

        this._templateOverridesInspector = args.templateOverridesInspector;
        if (this._templateOverridesInspector) {
            this._templateOverridesInspector.registerElementForPath(`components.${this._component}`, this, this._tooltipGroup);
            this._templateOverridesInspector.registerElementForPath(`components.${this._component}.enabled`, enableGroup);
        }
    }

    _createContextMenu(target) {
        const menu = new Menu({
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
        const data = this._entities[0].get(`components.${this._component}`);
        this._localStorage.set('copy-component', JSON.stringify(data));
        this._localStorage.set('copy-component-name', this._component);
    }

    _onClickPaste() {
        let data = this._localStorage.get('copy-component');
        if (!data) {
            return;
        }

        data = JSON.parse(data);

        editor.call('entities:pasteComponent', this._entities, this._component, data);
    }

    // Remove component on click
    _onClickDelete() {
        if (!this._entities) {
            return;
        }

        // make copy of entities for undo / redo
        const entities = this._entities.slice();

        let oldValues = {};

        const undo = () => {
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i].latest();
                if (!entity) {
                    return;
                }

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
                if (!entity) {
                    return;
                }

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
        if (this._destroyed) {
            return;
        }

        if (this._templateOverridesInspector) {
            this._templateOverridesInspector.unregisterElementForPath(`components.${this._component}`);
            this._templateOverridesInspector.unregisterElementForPath(`components.${this._component}.enabled`);
        }

        this._contextMenu.destroy();

        super.destroy();
    }
}

export { ComponentInspector };
