Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'entity-inspector';
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

    ATTRIBUTES.forEach((attr) => {
        const parts = attr.path.split('.');
        attr.reference = `entity:${parts[parts.length - 1]}`;
    });

    class EntityInspector extends pcui.Container {
        constructor(args) {
            if (!args) args = {};
            args.flex = true;

            super(args);

            this.class.add(CLASS_ROOT);

            this._history = args.history;

            this._projectSettings = args.projectSettings;

            if (!editor.call('settings:project').get('useLegacyScripts')) {
                this._templateInspector = new pcui.TemplatesEntityInspector({
                    flex: true,
                    assets: args.assets,
                    entities: args.entities,
                    templateOverridesDiffView: args.templateOverridesDiffView,
                    hidden: true
                });

                this.append(this._templateInspector);

                this._templateOverridesInspector = new pcui.TemplateOverrideInspector({
                    entities: args.entities
                });
            }

            this._attributesInspector = new pcui.AttributesInspector({
                history: args.history,
                attributes: ATTRIBUTES,
                templateOverridesInspector: this._templateOverridesInspector
            });
            this.append(this._attributesInspector);

            const containerComponentButtons = new pcui.Container({
                flex: true,
                flexDirection: 'row'
            });
            this.append(containerComponentButtons);

            // add component button
            const btnAddComponent = new pcui.Button({
                text: 'ADD COMPONENT',
                icon: 'E120',
                flexGrow: 1,
                class: CLASS_ADD_COMPONENT
            });
            containerComponentButtons.append(btnAddComponent);

            btnAddComponent.on('click', this._onClickAddComponent.bind(this));

            // cog button
            const btnCog = new pcui.Button({
                icon: 'E134'
            });
            btnCog.style.fontSize = '16px';
            btnCog.style.marginLeft = '0';
            containerComponentButtons.append(btnCog);

            this._menuCog = this._createCogMenu(btnCog);

            // add component inspectors
            this._componentInspectors = {};
            const components = editor.call('components:list');
            components.forEach((component) => {
                if (component === 'script' && args.projectSettings.get('useLegacyScripts')) return;

                // check if class exists
                const cls = `${component[0].toUpperCase()}${component.substring(1)}ComponentInspector`;
                if (pcui.hasOwnProperty(cls)) {
                    const inspector = new pcui[cls]({
                        hidden: true,
                        assets: args.assets,
                        entities: args.entities,
                        projectSettings: args.projectSettings,
                        templateOverridesInspector: this._templateOverridesInspector,
                        history: args.history
                    });

                    this._componentInspectors[component] = inspector;

                    this.append(inspector);
                }
            });

            this._entities = null;
            this._entityEvents = [];

            this._localStorage = new pcui.LocalStorage();

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

        _createCogMenu(target) {
            const menu = new pcui.Menu({
                items: [{
                    text: 'Paste Component',
                    icon: 'E348',
                    onSelect: () => {
                        this._onClickPasteComponent();
                    },
                    onIsEnabled: () => {
                        return this._localStorage.has('copy-component');
                    }
                }, {
                    text: 'Delete All Components',
                    icon: 'E124',
                    onSelect: () => {
                        this._onClickRemoveComponents();
                    },
                    onIsEnabled: () => {
                        let deleteDisabled = true;
                        for (const entity of this._entities) {
                            if (Object.keys(entity.get('components')).length > 0) {
                                deleteDisabled = false;
                                break;
                            }
                        }

                        return !deleteDisabled;
                    }
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

        // add component menu
        _createAddComponentMenu() {
            const menu = new pcui.Menu();
            const componentsSchema = editor.call('components:schema');
            const components = editor.call('components:list');

            const logos = editor.call('components:logos');

            const items = {};
            components.forEach((component) => {
                let title = componentsSchema[component].$title;
                if (title === 'Model' || title === 'Animation') {
                    title += ' (legacy)';
                }

                items[component] = new pcui.MenuItem({
                    text: title,
                    icon: logos[component],
                    onSelect: () => {
                        editor.call('entities:addComponent', this._entities, component);
                    }
                });

                menu.append(items[component]);
            });

            menu.on('show', () => {
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

                    items[components[i]].disabled = different ? false : disabled;

                    if (components[i] === 'audiosource') {
                        items[components[i]].hidden = !legacyAudio;
                    }
                }
            });


            editor.call('layout.root').append(menu);

            return menu;
        }

        _onClickPasteComponent() {
            let data = this._localStorage.get('copy-component');
            if (!data) return;
            data = JSON.parse(data);

            const component = this._localStorage.get('copy-component-name');
            if (!component) return;

            editor.call('entities:pasteComponent', this._entities, component, data);
        }

        _onClickRemoveComponents() {
            const entities = this._entities.slice();

            let previous = {};
            const redo = () => {
                previous = {};
                entities.forEach((e) => {
                    e = e.latest();
                    if (!e) return;

                    const history = e.history.enabled;
                    e.history.enabled = false;

                    previous[e.get('resource_id')] = e.get('components');
                    for (const component in previous[e.get('resource_id')]) {
                        e.unset('components.' + component);
                    }

                    e.history.enabled = history;
                });
            };

            const undo = () => {
                entities.forEach((e) => {
                    e = e.latest();
                    if (!e) return;

                    const history = e.history.enabled;
                    e.history.enabled = false;

                    for (const component in previous[e.get('resource_id')]) {
                        e.set('components.' + component, previous[e.get('resource_id')][component]);
                    }

                    e.history.enabled = history;
                });
            };

            redo();

            this._history.add({
                name: `entities.remove components`,
                undo: undo,
                redo: redo
            });
        }

        _onClickAddComponent(evt) {
            if (this.readOnly) return;

            this._menuAddComponent.hidden = false;
            this._menuAddComponent.position(evt.clientX, evt.clientY);
        }

        _onSetComponent(component) {
            if (!this._componentInspectors[component]) return;
            if (!this._doAllEntitiesHaveComponent(this._entities, component)) return;

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

            this._entities.forEach((entity) => {
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

        _doAllEntitiesHaveComponent(entities, component) {
            let result = true;
            for (let i = 0; i < entities.length; i++) {
                if (!entities[i].has(`components.${component}`)) {
                    result = false;
                    break;
                }
            }

            return result;
        }

        link(entities) {
            this.unlink();

            if (!entities || !entities.length) return;

            this._entities = entities;

            try {
                if (this._templateInspector) {
                    this._templateInspector.link(entities);
                }
            } catch (err) {
                log.error(err);
            }

            this._attributesInspector.link(entities);

            const components = editor.call('components:list');

            entities.forEach((e) => {
                components.forEach((component) => {
                    this._entityEvents.push(e.on(`components.${component}:set`, () => this._onSetComponent(component)));
                    this._entityEvents.push(e.on(`components.${component}:unset`, () => this._onUnsetComponent(component)));
                });

                this._entityEvents.push(e.on('parent:set', this._disableUiFields.bind(this)));
                this._entityEvents.push(e.on('components.screen.screenSpace:set', this._disableUiFields.bind(this)));
                this._entityEvents.push(e.on('components.layoutchild.excludeFromLayout:set', this._disableUiFields.bind(this)));
            });

            for (const component in this._componentInspectors) {
                if (!this._doAllEntitiesHaveComponent(entities, component)) {
                    continue;
                }

                this._componentInspectors[component].hidden = false;
                try {
                    this._componentInspectors[component].link(entities);
                } catch (err) {
                    this._componentInspectors[component].hidden = true;
                    log.error(err);
                }
                this.class.remove(CLASS_NO_COMPONENTS);
            }

            this._disableUiFields();

            try {
                if (this._templateOverridesInspector) {
                    this._templateOverridesInspector.entity = entities.length === 1 ? entities[0] : null;
                }
            } catch (err) {
                log.error(err);
            }
        }

        unlink() {
            super.unlink();

            if (!this._entities) return;

            this._entities = null;

            this._attributesInspector.unlink();

            if (this._templateOverridesInspector) {
                this._templateOverridesInspector.entity = null;
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

            this._menuAddComponent.destroy();
            this._menuCog.destroy();
            editor.call('hotkey:unregister', 'entities:rename:f2');

            super.destroy();
        }
    }

    return {
        EntityInspector: EntityInspector
    };
})());
