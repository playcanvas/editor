editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'asset',
        title: 'JSON',
        subTitle: '{Object}',
        description: 'JSON data to be used in application.'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:json:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
