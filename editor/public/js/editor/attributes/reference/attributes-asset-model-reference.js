editor.once('load', function() {
    'use strict';

    var fields = [{
        title: 'meshInstances',
        subTitle: '{pc.MeshInstance[]}',
        description: 'An array of meshInstances contained in this model. Materials are defined for each individual Mesh Instance.',
        url: 'http://developer.playcanvas.com/api/pc.Model.html#meshInstances'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:model:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
