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
        name: 'gsplat:lodBaseDistance',
        title: 'lodBaseDistance',
        subTitle: '{Number}',
        description:
            'Distance of the first LOD transition (LOD 0 to LOD 1). Closer objects use the highest quality LOD. With the Splat Budget Mode set to Limit, these distances decide the detail; with Target, they shape how detail falls off.',
        url: 'https://api.playcanvas.com/engine/classes/GSplatComponent.html#lodbasedistance'
    },
    {
        name: 'gsplat:lodMultiplier',
        title: 'lodMultiplier',
        subTitle: '{Number}',
        description:
            'Geometric multiplier between successive LOD distance thresholds. Higher values keep finer detail further from the camera, at a higher memory cost.',
        url: 'https://api.playcanvas.com/engine/classes/GSplatComponent.html#lodmultiplier'
    }
];
