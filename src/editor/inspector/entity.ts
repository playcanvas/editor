import { LocalStorage } from '@playcanvas/editor-api';
import { Container, Button, Menu } from '@playcanvas/pcui';

import { AttributesInspector } from './attributes-inspector.ts';
import { AnimComponentInspector } from './components/anim.ts';
import { AnimationComponentInspector } from './components/animation.ts';
import { AudiolistenerComponentInspector } from './components/audiolistener.ts';
import { AudiosourceComponentInspector } from './components/audiosource.ts';
import { ButtonComponentInspector } from './components/button.ts';
import { CameraComponentInspector } from './components/camera.ts';
import { CollisionComponentInspector } from './components/collision.ts';
import { ElementComponentInspector } from './components/element.ts';
import { GSplatComponentInspector } from './components/gsplat.ts';
import { LayoutchildComponentInspector } from './components/layoutchild.ts';
import { LayoutgroupComponentInspector } from './components/layoutgroup.ts';
import { LightComponentInspector } from './components/light.ts';
import { ModelComponentInspector } from './components/model.ts';
import { ParticlesystemComponentInspector } from './components/particlesystem.ts';
import { RenderComponentInspector } from './components/render.ts';
import { RigidbodyComponentInspector } from './components/rigidbody.ts';
import { ScreenComponentInspector } from './components/screen.ts';
import { ScriptComponentInspector } from './components/script.ts';
import { ScrollbarComponentInspector } from './components/scrollbar.ts';
import { ScrollviewComponentInspector } from './components/scrollview.ts';
import { SoundComponentInspector } from './components/sound.ts';
import { SpriteComponentInspector } from './components/sprite.ts';
import { ZoneComponentInspector } from './components/zone.ts';
import { COMPONENT_LOGOS } from '../../core/constants.ts';
import { TemplatesEntityInspector } from '../templates/templates-entity-inspector.ts';
import { TemplateOverrideInspector } from '../templates/templates-override-inspector.ts';

/**
 * @import { Attribute } from './attribute.type.d.ts'
 */

/** @type {Map<string, new (...args: any[]) => any>} */
const componentToConstructor = new Map();
componentToConstructor.set('anim', AnimComponentInspector);
componentToConstructor.set('animation', AnimationComponentInspector);
componentToConstructor.set('audiolistener', AudiolistenerComponentInspector);
componentToConstructor.set('audiosource', AudiosourceComponentInspector);
componentToConstructor.set('button', ButtonComponentInspector);
componentToConstructor.set('camera', CameraComponentInspector);
componentToConstructor.set('collision', CollisionComponentInspector);
componentToConstructor.set('element', ElementComponentInspector);
componentToConstructor.set('layoutchild', LayoutchildComponentInspector);
componentToConstructor.set('layoutgroup', LayoutgroupComponentInspector);
componentToConstructor.set('light', LightComponentInspector);
componentToConstructor.set('model', ModelComponentInspector);
componentToConstructor.set('particlesystem', ParticlesystemComponentInspector);
componentToConstructor.set('render', RenderComponentInspector);
componentToConstructor.set('rigidbody', RigidbodyComponentInspector);
componentToConstructor.set('screen', ScreenComponentInspector);
componentToConstructor.set('script', ScriptComponentInspector);
componentToConstructor.set('scrollbar', ScrollbarComponentInspector);
componentToConstructor.set('scrollview', ScrollviewComponentInspector);
componentToConstructor.set('sound', SoundComponentInspector);
componentToConstructor.set('sprite', SpriteComponentInspector);
componentToConstructor.set('zone', ZoneComponentInspector);
componentToConstructor.set('gsplat', GSplatComponentInspector);

const CLASS_ROOT = 'entity-inspector';
const CLASS_NO_COMPONENTS = `${CLASS_ROOT}-no-components`;
const CLASS_ADD_COMPONENT = `${CLASS_ROOT}-add-component`;

const CONTEXT_MENU_OFFSET = 10;

const additionalComponents = {
    'light': [
        { title: 'Directional Light', icon: 'directional', data: { 'type': 'directional' } },
        { title: 'Omni Light', icon: 'point', data: { 'type': 'point', 'shadowResolution': 256 } },
        { title: 'Spot Light', icon: 'spot', data: { 'type': 'spot' } }
    ],
    'camera': [
        { title: 'Perspective', icon: 'camera', data: { 'projection': 0 } },
        { title: 'Orthographic', icon: 'camera', data: { 'projection': 1 } }
    ],
    'sprite': [
        {
            title: 'Animated Sprite',
            icon: 'animatedsprite',
            data: {
                'type': 'animated',
                'clips': {
                    '0': {
                        'name': 'Clip 1',
                        'fps': 10,
                        'loop': true,
                        'autoPlay': true,
                        'spriteAsset': null
                    }
                },
                'autoPlayClip': 'Clip 1'
            }
        }
    ],
    'screen': [
        { title: '2D Screen', icon: '2d-screen', data: { 'screenSpace': true } },
        { title: '3D Screen', icon: '3d-screen', data: { 'screenSpace': false } }
    ]
};

const getSubMenu = function (key) {

    switch (key) {
        case 'sprite': return '2d-sub-menu';

        case 'render':
        case 'model':
            return '3d-sub-menu';

        case 'audiolistener':
        case 'audiosource':
        case 'sound':
            return 'audio-sub-menu';

        case 'anim':
        case 'animation':
            return 'animation-sub-menu';

        case 'rigidbody':
        case 'collision':
            return 'physics-sub-menu';

        case 'light': return 'light-sub-menu';

        case 'camera': return 'camera-sub-menu';

        case 'element':
        case 'screen':
        case 'layoutgroup':
        case 'layoutchild':
        case 'button':
        case 'scrollview':
        case 'scrollbar':
            return 'ui-sub-menu';

        default:
            return null;
    }
};

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [{
    label: 'Enabled',
    path: 'enabled',
    reference: 'entity:enabled',
    type: 'boolean'
}, {
    label: 'Name',
    path: 'name',
    reference: 'entity:name',
    type: 'string'
}, {
    label: 'Tags',
    path: 'tags',
    reference: 'entity:tags',
    type: 'tags',
    args: {
        type: 'string',
        placeholder: 'Add Tags'
    }
}, {
    label: 'Position',
    path: 'position',
    reference: 'entity:position',
    type: 'vec3',
    args: {
        placeholder: ['X', 'Y', 'Z'],
        precision: 3,
        step: 0.5
    }
}, {
    label: 'Rotation',
    path: 'rotation',
    reference: 'entity:rotation',
    type: 'vec3',
    args: {
        placeholder: ['X', 'Y', 'Z'],
        precision: 2,
        step: 5
    }
}, {
    label: 'Scale',
    path: 'scale',
    reference: 'entity:scale',
    type: 'vec3',
    args: {
        placeholder: ['X', 'Y', 'Z'],
        precision: 3,
        step: 1
    }
}];

class EntityInspector extends Container {
    constructor(args) {
        if (!args) args = {};
        args.flex = true;

        super(args);

        this.class.add(CLASS_ROOT);

        this._history = args.history;

        this._projectSettings = args.projectSettings;

        if (!editor.call('settings:project').get('useLegacyScripts')) {
            this._templateInspector = new TemplatesEntityInspector({
                flex: true,
                assets: args.assets,
                entities: args.entities,
                templateOverridesDiffView: args.templateOverridesDiffView,
                hidden: true
            });

            this.append(this._templateInspector);

            this._templateOverridesInspector = new TemplateOverrideInspector({
                entities: args.entities
            });
        }

        this._attributesInspector = new AttributesInspector({
            history: args.history,
            attributes: ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);

        const containerComponentButtons = new Container({
            flex: true,
            flexDirection: 'row'
        });
        this.append(containerComponentButtons);

        // add component button
        const btnAddComponent = new Button({
            text: 'ADD COMPONENT',
            icon: 'E120',
            flexGrow: 1,
            class: CLASS_ADD_COMPONENT
        });
        containerComponentButtons.append(btnAddComponent);

        btnAddComponent.on('click', this._onClickAddComponent.bind(this));

        // cog button
        const btnCog = new Button({
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

            const cstr = componentToConstructor.get(component);
            if (cstr) {
                const inspector = new cstr({
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

        this._localStorage = new LocalStorage();

        // add component menu
        this._menuAddComponent = this._createAddComponentMenu();

        // focus name input on F2
        editor.call('hotkey:register', 'entities:rename:f2', {
            key: 'F2',
            callback: this._onHotkeyF2.bind(this)
        });
    }

    _makeAddComponentMenuItem(component, title, logos, logoName = '', dataComponent = {}) {
        const data = {
            text: title,
            icon: logoName.length > 0 ? logos[logoName] : logos[component],
            onSelect: () => {
                editor.call('entities:addComponent', this._entities, component, dataComponent);
            }
        };
        return data;
    }

    _onHotkeyF2() {
        if (editor.call('picker:isOpen')) return;
        this._attributesInspector.getField('name').flash();
        this._attributesInspector.getField('name').focus();
    }

    _createCogMenu(target) {
        const menu = new Menu({
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
        let menu = null;
        const componentsSchema = editor.call('components:schema');
        const components = editor.call('components:list');

        // Create empty menu with sub-menus
        const items = {
            '2d-sub-menu': {
                text: '2D',
                icon: COMPONENT_LOGOS.sprite,
                items: []
            },
            '3d-sub-menu': {
                text: '3D',
                icon: COMPONENT_LOGOS.render,
                items: []
            },
            'audio-sub-menu': {
                text: 'Audio',
                icon: COMPONENT_LOGOS.sound,
                items: []
            },
            'animation-sub-menu': {
                text: 'Animation',
                icon: COMPONENT_LOGOS.anim,
                items: []
            },
            'camera-sub-menu': {
                text: 'Camera',
                icon: COMPONENT_LOGOS.camera,
                items: []
            },
            'light-sub-menu': {
                text: 'Light',
                icon: COMPONENT_LOGOS.light,
                items: []
            },
            'physics-sub-menu': {
                text: 'Physics',
                icon: COMPONENT_LOGOS.physics,
                items: []
            },
            'ui-sub-menu': {
                text: 'UI',
                icon: COMPONENT_LOGOS.userinterface,
                items: []
            }
        };

        // Create list of abstract components (components that have been replaced by subcomponents)
        const abstractComponents = new Set(['camera', 'light', 'screen']);

        // Create list of hidden components (components that are not available in the engine)
        const hiddenComponents = new Set(['audiosource']);

        components.forEach((component) => {
            let title = componentsSchema[component].$title;
            if (title === 'Model' || title === 'Animation') {
                title += ' (legacy)';
            }

            const submenu = getSubMenu(component);
            let newComponent = null;

            if (!(abstractComponents.has(component)) && !(hiddenComponents.has(component))) {
                // Build single component
                newComponent = this._makeAddComponentMenuItem(component, title, COMPONENT_LOGOS);

                if (submenu) {
                    items[submenu].items.push(newComponent);
                } else {
                    // If standalone component, make sure to float UI group to end to preserve order
                    const uiGroup = items['ui-sub-menu'];
                    delete items['ui-sub-menu'];
                    items[component] = newComponent;
                    items['ui-sub-menu'] = uiGroup;
                }
            }

            // Check if additional components need to be made for submenu
            if (component in additionalComponents) {
                // Load data for additional components
                const additional = additionalComponents[component];

                // Generate each subcomponent
                additional.forEach((subcomponent) => {
                    newComponent = this._makeAddComponentMenuItem(component, subcomponent.title, COMPONENT_LOGOS, subcomponent.icon, subcomponent.data);
                    // Add it to relevant submenu (will always exist as subcomponents live in submenus)
                    items[submenu].items.push(newComponent);
                });
            }
        });

        const menuData = [];
        Object.keys(items).forEach((key) => {
            menuData.push(items[key]);
        });

        menu = new Menu({ items: menuData });

        menu.on('show', () => {
            const entities = this._entities;
            if (!this._entities) return;

            for (let i = 0; i < components.length; i++) {
                let different = false;
                const disabled = entities[0].has(`components.${components[i]}`);

                for (let n = 1; n < entities.length; n++) {
                    if (disabled !== entities[n].has(`components.${components[i]}`)) {
                        different = true;
                        break;
                    }
                }

                const submenu = getSubMenu(components[i]);
                if (submenu) {
                    let title = componentsSchema[components[i]].$title;
                    if (title === 'Model' || title === 'Animation') {
                        title += ' (legacy)';
                    }
                    const index = items[submenu].items.findIndex((object) => {
                        return object.text === title;
                    });

                    if (!(abstractComponents.has(components[i])) && !(hiddenComponents.has(components[i]))) {
                        items[submenu].items[index].disabled = different ? false : disabled;
                    }
                } else {
                    items[components[i]].disabled = different ? false : disabled;
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
                    e.unset(`components.${component}`);
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
                    e.set(`components.${component}`, previous[e.get('resource_id')][component]);
                }

                e.history.enabled = history;
            });
        };

        redo();

        this._history.add({
            name: 'entities.remove components',
            undo: undo,
            redo: redo
        });
    }

    _onClickAddComponent(evt) {
        if (this.readOnly) return;

        const rect = evt.target.getBoundingClientRect();

        this._menuAddComponent.hidden = false;
        this._menuAddComponent.position(
            evt.clientX ?? rect.left + CONTEXT_MENU_OFFSET,
            evt.clientY ?? rect.top + CONTEXT_MENU_OFFSET
        );
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

export { EntityInspector };
