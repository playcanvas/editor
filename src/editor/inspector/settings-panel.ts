import { Container } from '@playcanvas/pcui';

import { AttributesInspector } from './attributes-inspector.ts';
import { AssetImportSettingsPanel } from './settings-panels/asset-import.ts';
import { BatchGroupsSettingsPanel } from './settings-panels/batchgroups.ts';
import { EditorSettingsPanel } from './settings-panels/editor.ts';
import { EngineSettingsPanel } from './settings-panels/engine.ts';
import { ExternalScriptsSettingsPanel } from './settings-panels/external-scripts.ts';
import { ImportMapSettingsPanel } from './settings-panels/import-map.ts';
import { InputSettingsPanel } from './settings-panels/input.ts';
import { LaunchPageSettingsPanel } from './settings-panels/launch-page.ts';
import { LayersSettingsPanel } from './settings-panels/layers.ts';
import { LightmappingSettingsPanel } from './settings-panels/lightmapping.ts';
import { LoadingScreenSettingsPanel } from './settings-panels/loading-screen.ts';
import { LocalizationSettingsPanel } from './settings-panels/localization.ts';
import { NetworkSettingsPanel } from './settings-panels/network.ts';
import { PhysicsSettingsPanel } from './settings-panels/physics.ts';
import { RenderingSettingsPanel } from './settings-panels/rendering.ts';
import { ScriptsSettingsPanel } from './settings-panels/scripts.ts';
import { ProjectHistorySettingsPanel } from './settings-panels/settings-history.ts';

/**
 * @import { Attribute } from './attribute.type.d.ts'
 */

const CLASS_ROOT = 'settings';

const SETTINGS_PANELS = [
    EngineSettingsPanel,
    EditorSettingsPanel,
    AssetImportSettingsPanel,
    PhysicsSettingsPanel,
    RenderingSettingsPanel,
    LayersSettingsPanel,
    LightmappingSettingsPanel,
    BatchGroupsSettingsPanel,
    LoadingScreenSettingsPanel,
    ImportMapSettingsPanel,
    ExternalScriptsSettingsPanel,
    LaunchPageSettingsPanel,
    InputSettingsPanel,
    LocalizationSettingsPanel,
    NetworkSettingsPanel,
    ScriptsSettingsPanel,
    ProjectHistorySettingsPanel
];

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [
    {
        label: 'Scene Name',
        alias: 'name',
        reference: 'settings:name',
        type: 'string'
    }
];

const DOM = parent => [
    {
        sceneAttributes: new AttributesInspector({
            attributes: ATTRIBUTES,
            settings: parent._args.settings,
            projectSettings: parent._args.projectSettings,
            userSettings: parent._args.userSettings,
            sceneSettings: parent._args.sceneSettings
        })
    }
];

class SettingsPanel extends Container {
    constructor(args) {
        if (!args) {
            args = {};
        }
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
            if (this._suspendSceneNameEvt) {
                return;
            }
            if (!editor.call('permissions:write')) {
                return;
            }

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
