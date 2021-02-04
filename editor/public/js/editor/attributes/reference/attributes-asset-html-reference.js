editor.once('load', function () {
    'use strict';

    var fields = [{
        name: 'asset',
        title: 'HTML',
        subTitle: '{String}',
        description: 'HTML string to be used in application.'
    }];

    for (var i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:html:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
