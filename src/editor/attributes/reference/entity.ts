import type { AttributeReference } from './reference.type';

editor.once('load', () => {
    const fields: AttributeReference[] = [{
        name: 'entity:enabled',
        title: 'enabled',
        subTitle: '{Boolean}',
        description: 'If unchecked, entity wont be processed nor any of its components.',
        url: 'https://api.playcanvas.com/engine/classes/Entity.html'
    }, {
        name: 'entity:name',
        title: 'name',
        subTitle: '{String}',
        description: 'Human-readable name for this Entity.',
        url: 'https://api.playcanvas.com/engine/classes/Entity.html#name'
    }, {
        name: 'entity:tags',
        title: 'tags',
        subTitle: '{pc.Tags}',
        description: 'Interface for tagging Entities. Tag based searches can be performed using the entity.findByTag function.',
        url: 'https://api.playcanvas.com/engine/classes/Entity.html#tags'
    }, {
        name: 'entity:position',
        title: 'Position',
        description: 'Position in Local Space'
    }, {
        name: 'entity:rotation',
        title: 'Rotation',
        description: 'Rotation in Local Space'
    }, {
        name: 'entity:scale',
        title: 'Scale',
        description: 'Scale in Local Space'
    }];

    for (let i = 0; i < fields.length; i++) {
        editor.call('attributes:reference:add', fields[i]);
    }
});
