import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[] = [
    {
        name: 'gsplat:component',
        title: 'pc.GSplatComponent',
        subTitle: '{pc.Component}',
        description:
            'Enables an Entity to render a gaussian splat. This component attaches the gaussian splat asset to the Entity.',
        url: 'https://api.playcanvas.com/engine/classes/GSplatComponent.html'
    },
    {
        name: 'gsplat:asset',
        title: 'asset',
        subTitle: '{pc.Asset}',
        description: 'The GSplat Asset.',
        url: 'https://api.playcanvas.com/engine/classes/GSplatComponent.html#asset'
    },
    {
        name: 'gsplat:layers',
        title: 'layers',
        subTitle: '{Number[]}',
        description: 'The layers to which the gaussian splats should belong.',
        url: 'https://api.playcanvas.com/engine/classes/GSplatComponent.html#layers'
    },
    {
        name: 'gsplat:castShadows',
        title: 'castShadows',
        subTitle: '{Boolean}',
        description: 'Cast shadows for lights that have shadow casting enabled.',
        url: 'https://api.playcanvas.com/engine/classes/GSplatComponent.html#castshadows'
    },
    {
        name: 'gsplat:lodRangeMin',
        title: 'lodRangeMin',
        subTitle: '{Number}',
        description: 'Lowest LOD level used when rendering this Gaussian splat.',
        url: 'https://api.playcanvas.com/engine/classes/GSplatComponent.html#lodrangemin'
    },
    {
        name: 'gsplat:lodRangeMax',
        title: 'lodRangeMax',
        subTitle: '{Number}',
        description: 'Highest LOD level used when rendering this Gaussian splat.',
        url: 'https://api.playcanvas.com/engine/classes/GSplatComponent.html#lodrangemax'
    },
    {
        name: 'gsplat:lodFalloff',
        title: 'lodFalloff',
        subTitle: '{Number}',
        description:
            'Controls how strongly detail is concentrated near the camera within the global splat budget. 0 spreads detail evenly.',
        url: 'https://api.playcanvas.com/engine/classes/GSplatComponent.html#lodfalloff'
    }
];
