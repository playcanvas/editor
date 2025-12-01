import * as coreElements from '@playcanvas/pcui';

import * as constants from './constants';
import { deepCopy } from '../utils';
import { AssetInput } from './element/element-asset-input';
import { AssetList } from './element/element-asset-list';
import { AssetThumbnail } from './element/element-asset-thumbnail';
import { BatchGroupInput } from './element/element-batchgroup-input';
import { Bubble } from './element/element-bubble';
import { BundlesInput } from './element/element-bundles-input';
import { ColorInput } from './element/element-color-input';
import { CurveInput } from './element/element-curve-input';
import { DropManager } from './element/element-drop-manager';
import { DropTarget } from './element/element-drop-target';
import { EntityInput } from './element/element-entity-input';
import { GradientInput } from './element/element-gradient-input';
import { LayersInput } from './element/element-layers-input';
import { Table } from './element/element-table';
import { TableCell } from './element/element-table-cell';
import { TableRow } from './element/element-table-row';
import { Tooltip } from './element/element-tooltip';

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

window.pcui = {
    ...constants,
    ...coreElements,
    ...customElements
} as typeof constants & typeof coreElements & typeof customElements;
