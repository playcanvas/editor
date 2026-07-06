import type { SelectInput } from '@playcanvas/pcui';

import { config } from '@/editor/config';

import type { Attribute } from '../attribute.type.d';

import { BaseSettingsPanel } from './base';
import type { BaseSettingsPanelArgs } from './base';

const DEFAULT_ENGINE_URL_PREFIX = 'https://code.playcanvas.com/playcanvas-';

const ATTRIBUTES: Attribute[] = [
    {
        observer: 'sessionSettings',
        label: 'Engine Version',
        path: 'engineVersion',
        reference: 'settings:engineVersion',
        type: 'select',
        args: {
            type: 'string',
            options: ['previous', 'current', 'releaseCandidate']
                .filter((type) => Object.hasOwn(config.engineVersions, type))
                .map((type) => {
                    const t = config.engineVersions[type];
                    return {
                        t: t.description,
                        v: type
                    };
                })
        }
    },
    {
        label: '',
        type: 'button',
        alias: 'switchEngine',
        args: {
            text: `SWITCH TO ENGINE V${config.project.settings.engineV2 ? '1' : '2'}`,
            icon: 'E304'
        }
    }
];

class EngineSettingsPanel extends BaseSettingsPanel {
    constructor(args: BaseSettingsPanelArgs) {
        args = Object.assign(
            {
                collapsed: false
            },
            args
        );
        args.headerText = 'ENGINE';
        args.attributes = ATTRIBUTES;
        args.userOnlySettings = false;
        args._tooltipReference = 'settings:engine';

        super(args);

        // when use_local_engine overrides the engine, the version select is forced by the URL,
        // so show the actual engine version (read-only) instead of the selectable options
        if (!config.url.engine.startsWith(DEFAULT_ENGINE_URL_PREFIX)) {
            const versionField = this._attributesInspector.getField<SelectInput>('engineVersion');
            if (versionField) {
                const match = config.url.engine.match(/playcanvas-(\d+\.\d+\.\d+(?:-[a-z]+\.\d+)?)/);
                const label = match ? `${match[1]} (local engine)` : 'Local';
                // keep the currently bound value so disabling does not write back to settings
                versionField.options = [{ t: label, v: versionField.value }];
                versionField.enabled = false;
            }
        }

        const switchEngine = this._attributesInspector.getField('switchEngine');

        let manualSet = false;
        switchEngine.on('click', () => {
            const engineV2 = this._projectSettings.get('engineV2');
            editor.call('picker:engine', false, !engineV2, () => {
                manualSet = true;
                this._projectSettings.set('engineV2', !engineV2);
                manualSet = false;
                window.location.reload();
            });
        });

        this._projectSettings.on('engineV2:set', (value, oldValue) => {
            // check if user has write permissions
            if (!editor.call('permissions:write')) {
                return;
            }

            // check if value is changing
            if (value === oldValue) {
                return;
            }

            // disable switch button if hidden
            if (switchEngine.hidden) {
                return;
            }

            // ignore set if we initiated it
            if (manualSet) {
                return;
            }

            // skip initial set
            if (oldValue === null) {
                return;
            }

            editor.call('picker:engine', true, value);

            // reload after a second
            setTimeout(() => window.location.reload(), 1000);
        });
    }
}

export { EngineSettingsPanel };
