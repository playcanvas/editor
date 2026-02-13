import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[]  = [{
    name: 'gsplat:component',
    title: 'pc.GSplatComponent',
    subTitle: '{pc.Component}',
    description: 'Enables an Entity to render a gaussian splat. This component attaches the gaussian splat asset to the Entity.'
}, {
    name: 'gsplat:asset',
    title: 'asset',
    subTitle: '{pc.Asset}',
    description: 'The GSplat Asset.'
}, {
    name: 'gsplat:layers',
    title: 'layers',
    subTitle: '{Number[]}',
    description: 'The layers to which the gaussian splats should belong.'
}];
