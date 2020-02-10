Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'entity-inspector';
    const CLASS_OVERRIDES = CLASS_ROOT + '-overrides';
    const CLASS_NO_COMPONENTS = CLASS_ROOT + '-no-components';
    const CLASS_ADD_COMPONENT = CLASS_ROOT + '-add-component';

    const ATTRIBUTES = [{
        label: 'Enabled',
        path: 'enabled',
        type: 'boolean'
    }, {
        label: 'Name',
        path: 'name',
        type: 'string'
    }, {
        label: 'Tags',
        path: 'tags',
        type: 'tags',
        args: {
            type: 'string',
            placeholder: 'Add Tags'
        }
    }, {
        label: 'Position',
        path: 'position',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z'],
            precision: 3,
            step: 0.05
        }
    }, {
        label: 'Rotation',
        path: 'rotation',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z'],
            precision: 2,
            step: 0.1
        }
    }, {
        label: 'Scale',
        path: 'scale',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z'],
            precision: 3,
            step: 0.05
        }
    }];

    ATTRIBUTES.forEach(attr => {
        const parts = attr.path.split('.');
        attr.reference = `entity:${parts[parts.length - 1]}`;
    });

    class EntityInspector extends pcui.Container {
        constructor(args) {
            if (!args) args = {};
            args.flex = true;

            super(args);

            this.class.add(CLASS_ROOT);

            this._projectSettings = args.projectSettings;

            if (editor.call('users:hasFlag', 'hasTemplates') && !editor.call('settings:project').get('useLegacyScripts')) {
                this._templateInspector = new pcui.TemplatesEntityInspector({
                    flex: true,
                    assets: args.assets,
                    entities: args.entities,
                    templateOverridesDiffView: args.templateOverridesDiffView,
                    hidden: true
                });

                this.append(this._templateInspector);

                // TODO: disable until we find a better solution
                this._templateOverridesSidebar = null;//new pcui.TemplateOverrideSidebar({
                //     hidden: true,
                //     flex: true
                // });

                // this.append(this._templateOverridesSidebar);

                // this._templateOverridesSidebar.on('hide', () => {
                //     this.class.remove(CLASS_OVERRIDES);
                // });

                // this._templateOverridesSidebar.on('show', () => {
                //     this.class.add(CLASS_OVERRIDES);
                // });
            }

            this._attributesInspector = new pcui.AttributesInspector({
                history: args.history,
                attributes: ATTRIBUTES,
                templateOverridesSidebar: this._templateOverridesSidebar
            });
            this.append(this._attributesInspector);

            // add component button
            const btnAddComponent = new pcui.Button({
                text: 'ADD COMPONENT',
                icon: 'E120',
                flexGrow: 1,
                class: CLASS_ADD_COMPONENT
            });
            this.append(btnAddComponent);

            btnAddComponent.on('click', this._onClickAddComponent.bind(this));

            // add component inspectors
            this._componentInspectors = {};
            const components = editor.call('components:list');
            components.forEach(component => {
                if (component === 'script' && args.projectSettings.get('useLegacyScripts')) return;

                // check if class exists
                const cls = `${component[0].toUpperCase()}${component.substring(1)}ComponentInspector`;
                if (pcui.hasOwnProperty(cls)) {
                    const inspector = new pcui[cls]({
                        hidden: true,
                        assets: args.assets,
                        entities: args.entities,
                        projectSettings: args.projectSettings,
                        templateOverridesSidebar: this._templateOverridesSidebar,
                        history: args.history
                    });

                    this._componentInspectors[component] = inspector;

                    this.append(inspector);
                }
            });

            this._entities = null;
            this._entityEvents = [];

            // add component menu
            this._menuAddComponent = this._createAddComponentMenu();

            // focus name input on F2
            editor.call('hotkey:register', 'entities:rename:f2', {
                key: 'f2',
                callback: this._onHotkeyF2.bind(this)
            });
        }

        _onHotkeyF2() {
            if (editor.call('picker:isOpen')) return;
            this._attributesInspector.getField('name').flash();
            this._attributesInspector.getField('name').focus();
        }

        _createAddComponentMenu() {
            // add component menu
            const menu = new ui.Menu();
            const componentsSchema = editor.call('components:schema');
            const components = editor.call('components:list');
            for (let i = 0; i < components.length; i++) {
                menu.append(new ui.MenuItem({
                    text: componentsSchema[components[i]].$title,
                    value: components[i]
                }));
            }
            menu.on('open', () => {
                const entities = this._entities;
                if (!this._entities) return;

                const legacyAudio = this._projectSettings.get('useLegacyAudio');
                for (let i = 0; i < components.length; i++) {
                    let different = false;
                    const disabled = entities[0].has('components.' + components[i]);

                    for (let n = 1; n < entities.length; n++) {
                        if (disabled !== entities[n].has('components.' + components[i])) {
                            different = true;
                            break;
                        }
                    }
                    menu.findByPath([components[i]]).disabled = different ? false : disabled;

                    if (components[i] === 'audiosource') {
                        menu.findByPath([components[i]]).hidden = ! legacyAudio;
                    }
                }
            });

            menu.on('select', path => {
                if (!this._entities) return;
                const component = path[0];
                editor.call('entities:addComponent', this._entities, component);
            });

            editor.call('layout.root').append(menu);

            return menu;
        }

        _onClickAddComponent(evt) {
            if (this.readOnly) return;

            this._menuAddComponent.position(evt.clientX, evt.clientY);
            this._menuAddComponent.open = true;
        }

        _onSetComponent(component) {
            if (!this._componentInspectors[component]) return;

            this._componentInspectors[component].hidden = false;
            this._componentInspectors[component].link(this._entities);

            this.class.remove(CLASS_NO_COMPONENTS);
        }

        _onUnsetComponent(component) {
            if (!this._componentInspectors[component]) return;

            this._componentInspectors[component].unlink();
            this._componentInspectors[component].hidden = true;

            let hasComponents = false;
            for (const key in this._componentInspectors) {
                if (!this._componentInspectors[key].hidden) {
                    hasComponents = true;
                    break;
                }
            }

            if (hasComponents) {
                this.class.remove(CLASS_NO_COMPONENTS);
            } else {
                this.class.add(CLASS_NO_COMPONENTS);
            }
        }

        _disableUiFields() {
            if (!this._entities) return;

            let disablePositionXY = false;
            let disableRotation = false;
            let disableScale = false;

            this._entities.forEach(entity => {
                // disable rotation / scale for 2D screens
                if (entity.get('components.screen.screenSpace')) {
                    disableRotation = true;
                    disableScale = true;
                }

                // disable position on the x/y axis for
                // elements that are part of a layout group
                if (editor.call('entities:layout:isUnderControlOfLayoutGroup', entity)) {
                    disablePositionXY = true;
                }
            });

            const positionInputs = this._attributesInspector.getField('position').inputs;
            positionInputs[0].enabled = !disablePositionXY;
            positionInputs[1].enabled = !disablePositionXY;

            const rotationInputs = this._attributesInspector.getField('rotation').inputs;
            const scaleInputs = this._attributesInspector.getField('scale').inputs;
            for (let i = 0; i < 3; i++) {
                rotationInputs[i].enabled = !disableRotation;
                rotationInputs[i].renderChanges = !disableRotation;
                scaleInputs[i].enabled = !disableScale;
                scaleInputs[i].renderChanges = !disableScale;
            }
        }

        link(entities) {
            this.unlink();

            if (!entities || !entities.length) return;

            this._entities = entities;

            try {
                if (this._templateInspector) {
                    this._templateInspector.link(entities);
                }
                if (this._templateOverridesSidebar) {
                    this._templateOverridesSidebar.link(entities);
                }
            } catch (err) {
                console.error(err);
            }

            this._attributesInspector.link(entities);

            const components = editor.call('components:list');

            entities.forEach(e => {
                components.forEach(component => {
                    this._entityEvents.push(e.on(`components.${component}:set`, () => this._onSetComponent(component)));
                    this._entityEvents.push(e.on(`components.${component}:unset`, () => this._onUnsetComponent(component)));
                });

                this._entityEvents.push(e.on('parent:set', this._disableUiFields.bind(this)));
                this._entityEvents.push(e.on('components.screen.screenSpace:set', this._disableUiFields.bind(this)));
                this._entityEvents.push(e.on('components.layoutchild.excludeFromLayout:set', this._disableUiFields.bind(this)));
            });

            for (const component in this._componentInspectors) {
                let exists = true;
                for (let i = 0; i < entities.length; i++) {
                    if (!entities[i].has(`components.${component}`)) {
                        exists = false;
                        break;
                    }
                }

                if (exists) {
                    this._componentInspectors[component].hidden = false;
                    try {
                        this._componentInspectors[component].link(entities);
                    } catch (err) {
                        this._componentInspectors[component].hidden = true;
                        console.error(err);
                    }
                    this.class.remove(CLASS_NO_COMPONENTS);
                }
            }

            this._disableUiFields();
        }

        unlink() {
            super.unlink();

            if (!this._entities) return;

            this._entities = null;

            this._attributesInspector.unlink();

            if (this._templateOverridesSidebar) {
                this._templateOverridesSidebar.unlink();
            }
            if (this._templateInspector) {
                this._templateInspector.unlink();
            }

            this._entityEvents.forEach(evt => evt.unbind());
            this._entityEvents.length = 0;

            for (const component in this._componentInspectors) {
                if (!this._componentInspectors[component].hidden) {
                    this._componentInspectors[component].unlink();
                    this._componentInspectors[component].hidden = true;
                }
            }

            this.class.add(CLASS_NO_COMPONENTS);
        }

        destroy() {
            if (this._destroyed) return;

            editor.call('hotkey:unregister', 'entities:rename:f2');

            super.destroy();
        }
    }

    return {
        EntityInspector: EntityInspector
    };
})());
