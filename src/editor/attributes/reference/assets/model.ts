import type { AttributeReference } from '../reference.type.ts';

export const fields: AttributeReference[]  = [{
    name: 'asset:model:meshInstances',
    title: 'meshInstances',
    subTitle: '{pc.MeshInstance[]}',
    description: 'An array of meshInstances contained in this model. Materials are defined for each individual Mesh Instance.',
    url: 'https://api.playcanvas.com/engine/classes/Model.html#meshinstances'
}];
