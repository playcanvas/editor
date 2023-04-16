import { Container } from '@playcanvas/pcui';
import { EditorSettingsPanel } from './settings-panels/editor.js';
import { AssetTasksSettingsPanel } from './settings-panels/asset-tasks.js';
import { PhysicsSettingsPanel } from './settings-panels/physics.js';
import { RenderingSettingsPanel } from './settings-panels/rendering.js';
import { LayersSettingsPanel } from './settings-panels/layers.js';
import { LightmappingSettingsPanel } from './settings-panels/lightmapping.js';
import { BatchGroupsSettingsPanel } from './settings-panels/batchgroups.js';
import { LoadingScreenSettingsPanel } from './settings-panels/loading-screen.js';
import { ExternalScriptsSettingsPanel } from './settings-panels/external-scripts.js';
import { InputSettingsPanel } from './settings-panels/input.js';
import { LocalizationSettingsPanel } from './settings-panels/localization.js';
import { NetworkSettingsPanel } from './settings-panels/network.js';
import { AudioSettingsPanel } from './settings-panels/audio.js';
import { ScriptsSettingsPanel } from './settings-panels/scripts.js';
import { ProjectHistorySettingsPanel } from './settings-panels/settings-history.js';

const CLASS_ROOT = 'settings';

const SETTINGS_PANELS = [
    EditorSettingsPanel,
    AssetTasksSettingsPanel,
    PhysicsSettingsPanel,
    RenderingSettingsPanel,
    LayersSettingsPanel,
    LightmappingSettingsPanel,
    BatchGroupsSettingsPanel,
    LoadingScreenSettingsPanel,
    ExternalScriptsSettingsPanel,
    InputSettingsPanel,
    LocalizationSettingsPanel,
    NetworkSettingsPanel,
    AudioSettingsPanel,
    ScriptsSettingsPanel,
    ProjectHistorySettingsPanel
];

const SCENE_ATTRIBUTES = [
    {
        label: 'Scene Name',
        alias: 'name',
        type: 'string'
    }
];

SCENE_ATTRIBUTES.forEach((attr) => {
    const path = attr.alias || attr.path;
    if (!path) return;
    const parts = path.split('.');
    attr.reference = `settings:${parts[parts.length - 1]}`;
});

const DOM = parent => [
    {
        sceneAttributes: new pcui.AttributesInspector({
            attributes: SCENE_ATTRIBUTES,
            settings: parent._args.settings,
            projectSettings: parent._args.projectSettings,
            userSettings: parent._args.userSettings,
            sceneSettings: parent._args.sceneSettings
        })
    }
];

class SettingsPanel extends Container {
    constructor(args) {
        if (!args) args = {};
        args.flex = true;

        super(args);
        this._args = args;
        this._settingsEvents = [];

        this.class.add(CLASS_ROOT);

        this.buildDom(DOM(this));

        this._suspendSceneNameEvt = false;

        // Setup Scene Name attribute
        this._sceneName = 'Untitled';
        editor.on('scene:raw', (data) => {
            editor.emit('scene:name', data.name);
            this._sceneName = data.name;
            const sceneNameField = this._sceneAttributes.getField('name');

            const suspend = this._suspendSceneNameEvt;
            this._suspendSceneNameEvt = true;
            sceneNameField.value = this._sceneName;
            this._suspendSceneNameEvt = suspend;
        });

        editor.on('realtime:scene:op:name', (op) => {
            editor.emit('scene:name', op.oi);
        });

        SETTINGS_PANELS.forEach((panelType) => {
            if ((panelType === ScriptsSettingsPanel || panelType === ExternalScriptsSettingsPanel) && this._args.projectSettings.get('useLegacyScripts'))
                return;
            if (panelType === AudioSettingsPanel && this._args.projectSettings.get('useLegacyAudio') === null)
                return;

            const panel = new panelType({
                history: args.history,
                assets: args.assets,
                entities: args.entities,
                settings: args.settings,
                projectSettings: args.projectSettings,
                userSettings: args.userSettings,
                sceneSettings: args.sceneSettings,
                sessionSettings: args.sessionSettings
            });
            this.append(panel);
        });

        this._linkSceneNameField();
    }

    _linkSceneNameField() {
        const sceneNameField = this._sceneAttributes.getField('name');
        sceneNameField.value = this._sceneName;
        this._settingsEvents.push(sceneNameField.on('change', (newSceneName) => {
            if (this._suspendSceneNameEvt) return;
            if (!editor.call('permissions:write')) return;

            editor.call('realtime:scene:op', {
                p: ['name'],
                od: this._sceneName || '',
                oi: newSceneName || ''
            });
            this._sceneName = newSceneName;
            editor.emit('scene:name', newSceneName);
        }));
    }
}

export { SettingsPanel };
