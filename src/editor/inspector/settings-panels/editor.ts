import { BaseSettingsPanel } from './base.ts';
import { TONEMAPPING } from '../../../core/constants.ts';
import type { Attribute, Divider } from '../attribute.type.d.ts';

const ATTRIBUTES: (Attribute | Divider)[] = [
    {
        observer: 'settings',
        label: 'Grid Divisions',
        path: 'editor.gridDivisions',
        alias: 'grid',
        reference: 'settings:grid',
        type: 'number',
        args: {
            min: 0,
            max: 100,
            precision: 0
        }
    },
    {
        observer: 'settings',
        label: 'Grid Division Size',
        path: 'editor.gridDivisionSize',
        alias: 'grid',
        reference: 'settings:grid',
        type: 'number',
        args: {
            min: 0,
            max: 100
        }
    },
    {
        observer: 'settings',
        label: 'Snap',
        path: 'editor.snapIncrement',
        alias: 'snap',
        reference: 'settings:snap',
        type: 'number',
        args: {
            min: 0,
            max: 100,
            placeholder: 'Increment'
        }
    },
    {
        observer: 'userSettings',
        label: 'Zoom Sensitivity',
        type: 'slider',
        alias: 'zoomSensitivity',
        reference: 'settings:zoomSensitivity',
        path: 'editor.zoomSensitivity',
        args: {
            value: 1,
            min: 1,
            sliderMin: 1,
            max: 15,
            sliderMax: 15,
            step: 1
        }
    },
    {
        alias: 'divider:0',
        type: 'divider'
    },
    {
        observer: 'settings',
        label: 'Camera Depth Grabpass',
        path: 'editor.cameraGrabDepth',
        alias: 'cameraGrabDepth',
        reference: 'settings:cameraGrabDepth',
        type: 'boolean'
    },
    {
        observer: 'settings',
        label: 'Camera Color Grabpass',
        path: 'editor.cameraGrabColor',
        alias: 'cameraGrabColor',
        reference: 'settings:cameraGrabColor',
        type: 'boolean'
    },
    {
        observer: 'settings',
        label: 'Camera Clip Near',
        alias: 'cameraClip',
        reference: 'settings:cameraClip',
        path: 'editor.cameraNearClip',
        type: 'number',
        args: {
            min: 0
        }
    },
    {
        observer: 'settings',
        label: 'Camera Clip Far',
        alias: 'cameraClip',
        reference: 'settings:cameraClip',
        path: 'editor.cameraFarClip',
        type: 'number',
        args: {
            min: 0
        }
    },
    {
        observer: 'settings',
        label: 'Camera Clear Color',
        path: 'editor.cameraClearColor',
        alias: 'clearColor',
        reference: 'settings:cameraClearColor',
        type: 'rgba'
    },
    {
        observer: 'settings',
        label: 'Camera Tonemapping',
        path: 'editor.cameraToneMapping',
        reference: 'settings:cameraToneMapping',
        type: 'select',
        args: {
            type: 'number',
            options: TONEMAPPING.map((v, i) => {
                return {
                    v: i,
                    t: v
                };
            })
        }
    },
    {
        observer: 'settings',
        label: 'Camera Gamma',
        path: 'editor.cameraGammaCorrection',
        reference: 'settings:cameraGammaCorrection',
        type: 'select',
        args: {
            type: 'number',
            options: [
                {
                    v: 0,
                    t: '1.0'
                },
                {
                    v: 1,
                    t: '2.2'
                }
            ]
        }
    },
    {
        alias: 'divider:1',
        type: 'divider'
    },
    {
        observer: 'settings',
        label: 'Gizmo Size',
        type: 'slider',
        reference: 'settings:gizmoSize',
        path: 'editor.gizmoSize',
        args: {
            min: 0.1,
            max: 5,
            step: 0.1
        }
    },
    {
        observer: 'settings',
        label: 'Gizmo Preset',
        path: 'editor.gizmoPreset',
        reference: 'settings:gizmoPreset',
        type: 'select',
        args: {
            type: 'string',
            options: [
                {
                    v: 'classic',
                    t: 'Classic'
                },
                {
                    v: 'default',
                    t: 'Default'
                }
            ]
        }
    },
    {
        observer: 'settings',
        label: 'Gizmo Rotation Mode',
        path: 'editor.gizmoRotationMode',
        reference: 'settings:gizmoRotationMode',
        type: 'select',
        args: {
            type: 'string',
            options: [
                {
                    v: 'orbit',
                    t: 'Orbit'
                },
                {
                    v: 'absolute',
                    t: 'Absolute'
                }
            ]
        }
    },
    {
        alias: 'divider:2',
        type: 'divider'
    },
    {
        observer: 'settings',
        label: 'Show Fog',
        path: 'editor.showFog',
        alias: 'showFog',
        reference: 'settings:showFog',
        type: 'boolean'
    },
    {
        observer: 'userSettings',
        label: 'Icons Size',
        path: 'editor.iconSize',
        alias: 'iconSize',
        reference: 'settings:iconSize',
        type: 'number',
        args: {
            min: 0,
            max: 100
        }
    },
    {
        observer: 'settings',
        label: 'Locale',
        path: 'editor.locale',
        reference: 'settings:locale',
        type: 'string'
    },
    {
        alias: 'chatNotification',
        reference: 'settings:chatNotification',
        label: 'Chat Notification',
        type: 'boolean'
    },
    {
        observer: 'settings',
        path: 'editor.renameDuplicatedEntities',
        reference: 'settings:renameDuplicatedEntities',
        label: 'Rename Duplicated Entities',
        type: 'boolean'
    },
    {
        observer: 'settings',
        path: 'editor.lightmapperAutoBake',
        reference: 'settings:lightmapperAutoBake',
        label: 'Lightmapper Auto Bake',
        type: 'boolean'
    }
];

class EditorSettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'EDITOR';
        args.attributes = ATTRIBUTES;
        args.userOnlySettings = true;
        args._tooltipReference = 'settings:editor';

        super(args);

        const evtPermission = editor.on('notify:permission', this._checkChatNotificationState.bind(this));
        const evtChatNotifyState = editor.on('chat:notify', this._checkChatNotificationState.bind(this));
        const fieldChatNotification = this._attributesInspector.getField('chatNotification');
        this._checkChatNotificationState();
        fieldChatNotification.on('change', (value) => {
            if (editor.call('notify:state') !== 'granted') {
                editor.call('notify:permission');
            } else {
                editor.call('localStorage:set', 'editor:notifications:chat', value);
                editor.emit('chat:notify', value);
                this._checkChatNotificationState();
            }
        });
        this.once('destroy', () => {
            evtPermission.unbind();
            evtChatNotifyState.unbind();
        });
    }

    _field(name) {
        return this._attributesInspector.getField(`editor.${name}`);
    }

    _checkChatNotificationState() {
        const permission = editor.call('notify:state');
        const fieldChatNotification = this._attributesInspector.getField('chatNotification');

        fieldChatNotification.enabled = permission !== 'denied';

        if (permission !== 'granted' && permission !== 'denied') {
            fieldChatNotification.value = null;
        }

        if (permission === 'granted') {
            // restore localstorage state
            const granted = editor.call('localStorage:get', 'editor:notifications:chat');
            if (granted === null) {
                fieldChatNotification.value = true;
            } else {
                fieldChatNotification.value = granted;
            }
        }
    }
}

export { EditorSettingsPanel };
