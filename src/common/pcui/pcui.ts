import * as coreElements from '@playcanvas/pcui';

import * as constants from './constants.ts';
import { deepCopy } from '../utils.ts';
import { AssetInput } from './element/element-asset-input.ts';
import { AssetList } from './element/element-asset-list.ts';
import { AssetThumbnail } from './element/element-asset-thumbnail.ts';
import { BatchGroupInput } from './element/element-batchgroup-input.ts';
import { Bubble } from './element/element-bubble.ts';
import { BundlesInput } from './element/element-bundles-input.ts';
import { ColorInput } from './element/element-color-input.ts';
import { CurveInput } from './element/element-curve-input.ts';
import { DropManager } from './element/element-drop-manager.ts';
import { DropTarget } from './element/element-drop-target.ts';
import { EntityInput } from './element/element-entity-input.ts';
import { GradientInput } from './element/element-gradient-input.ts';
import { LayersInput } from './element/element-layers-input.ts';
import { TableCell } from './element/element-table-cell.ts';
import { TableRow } from './element/element-table-row.ts';
import { Table } from './element/element-table.ts';
import { Tooltip } from './element/element-tooltip.ts';

// Core elements
for (const name in constants.DEFAULTS) {
    if (!coreElements.ArrayInput.DEFAULTS.hasOwnProperty(name)) {
        coreElements.Element.register(`array:${name}`, coreElements.ArrayInput, { type: name, renderChanges: true });
    }
    coreElements.ArrayInput.DEFAULTS[name] = deepCopy(constants.DEFAULTS[name]);
}

// Custom elements
const customElements = {
    AssetInput,
    AssetList,
    AssetThumbnail,
    BatchGroupInput,
    Bubble,
    BundlesInput,
    ColorInput,
    CurveInput,
    DropManager,
    DropTarget,
    EntityInput,
    GradientInput,
    LayersInput,
    TableCell,
    TableRow,
    Table,
    Tooltip
};

/**
 * @type {constants & coreElements & customElements}
 */
window.pcui = {
    ...constants,
    ...coreElements,
    ...customElements
};
