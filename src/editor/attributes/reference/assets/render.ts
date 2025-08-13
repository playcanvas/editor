import type { AttributeReference } from '../reference.type.ts';

export const fields: AttributeReference[]  = [{
    name: 'asset:render:renderIndex',
    title: 'renderIndex',
    subTitle: '{Number}',
    description: 'The index of the Render Asset inside its Container Asset.'
}, {
    name: 'asset:render:containerAsset',
    title: 'containerAsset',
    subTitle: '{pc.Asset}',
    description: 'The Container Asset that this render asset is part of'
}];
