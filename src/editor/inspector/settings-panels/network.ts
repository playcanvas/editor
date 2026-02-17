import { BaseSettingsPanel } from './base';
import type { Attribute } from '../attribute.type.d';

const ATTRIBUTES: Attribute[] = [
    {
        observer: 'projectSettings',
        label: 'Asset Retries',
        path: 'maxAssetRetries',
        type: 'number',
        reference: 'settings:project:maxAssetRetries',
        args: {
            min: 0,
            precision: 0
        }
    }
];

class NetworkSettingsPanel extends BaseSettingsPanel {
    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);
        args.headerText = 'NETWORK';
        args.attributes = ATTRIBUTES;
        args._tooltipReference = 'settings:network';

        super(args);
    }
}

export { NetworkSettingsPanel };
