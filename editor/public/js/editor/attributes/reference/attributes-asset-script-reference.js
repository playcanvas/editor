editor.once('load', function() {
    'use strict';

    var fields = [{
        title: 'filename',
        subTitle: '{String}',
        description: 'Filename of a script..'
    }, {
        name: 'order',
        description: 'Sometimes specific order of loading and executing JS files is required. All preloaded script assets will be loaded in order speecified in Project Settings.'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:script:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
