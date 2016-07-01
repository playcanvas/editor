editor.once('load', function() {
    'use strict';

    var fields = [{
        title: 'enabled',
        subTitle: '{Boolean}',
        description: 'If unchecked, entity wont be processed nor any of its components.',
        url: 'http://developer.playcanvas.com/api/pc.Entity.html'
    }, {
        title: 'name',
        subTitle: '{String}',
        description: 'Human-readable name for this graph node.',
        url: 'http://developer.playcanvas.com/api/pc.Entity.html#name'
    }, {
        title: 'tags',
        subTitle: '{pc.Tags}',
        description: '',
        url: 'http://developer.playcanvas.com/api/pc.Entity.html#tags'
    }, {
        title: 'position',
        subTitle: '{pc.Vec3}',
        description: 'Position in Local Space',
        url: 'http://developer.playcanvas.com/api/pc.Entity.html'
    }, {
        title: 'rotation',
        subTitle: '{pc.Vec3}',
        description: 'Rotation in Local Space',
        url: 'http://developer.playcanvas.com/api/pc.Entity.html'
    }, {
        title: 'scale',
        subTitle: '{pc.Vec3}',
        description: 'Scale in Local Space',
        url: 'http://developer.playcanvas.com/api/pc.Entity.html'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'entity:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
