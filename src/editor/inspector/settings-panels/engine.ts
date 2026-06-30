import { SelectInput } from '@playcanvas/pcui';

import { config } from '@/editor/config';

import { BaseSettingsPanel, type BaseSettingsPanelArgs } from './base';
import type { Attribute } from '../attribute.type.d';

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
            .filter(type => config.engineVersions.hasOwnProperty(type))
            .map((type) => {
                const t = config.engineVersions[type];
                return {
                    t: t.description,
                    v: type
                };
            })
        }
    }
];


class EngineSettingsPanel extends BaseSettingsPanel {
    constructor(args: BaseSettingsPanelArgs) {
        args = Object.assign({
            collapsed: false
        }, args);
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

    }
}

export { EngineSettingsPanel };
