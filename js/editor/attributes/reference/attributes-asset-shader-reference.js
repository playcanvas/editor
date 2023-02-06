editor.once('load', function () {
    var fields = [{
        name: 'asset',
        title: 'Shader',
        subTitle: '{String}',
        description: 'Text containing GLSL to be used in the application.'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:shader:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
