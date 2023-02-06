editor.once('load', function () {
    var fields = [{
        name: 'asset',
        title: 'CSS',
        subTitle: '{String}',
        description: 'CSS string to be used in application.'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:css:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
