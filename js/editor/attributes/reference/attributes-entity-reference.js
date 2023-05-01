editor.once('load', function () {
    var fields = [{
        title: 'enabled',
        subTitle: '{Boolean}',
        description: 'If unchecked, entity wont be processed nor any of its components.',
        url: 'https://developer.playcanvas.com/api/pc.Entity.html'
    }, {
        title: 'name',
        subTitle: '{String}',
        description: 'Human-readable name for this Entity.',
        url: 'https://developer.playcanvas.com/api/pc.Entity.html#name'
    }, {
        title: 'tags',
        subTitle: '{pc.Tags}',
        description: 'Interface for tagging Entities. Tag based searches can be performed using the entity.findByTag function.',
        url: 'https://developer.playcanvas.com/api/pc.Entity.html#tags'
    }, {
        name: 'position',
        title: 'Position',
        description: 'Position in Local Space'
    }, {
        name: 'rotation',
        title: 'Rotation',
        description: 'Rotation in Local Space'
    }, {
        name: 'scale',
        title: 'Scale',
        description: 'Scale in Local Space'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'entity:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
