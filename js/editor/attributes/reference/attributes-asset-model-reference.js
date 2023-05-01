editor.once('load', function () {
    var fields = [{
        title: 'meshInstances',
        subTitle: '{pc.MeshInstance[]}',
        description: 'An array of meshInstances contained in this model. Materials are defined for each individual Mesh Instance.',
        url: 'https://developer.playcanvas.com/api/pc.Model.html#meshInstances'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:model:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
