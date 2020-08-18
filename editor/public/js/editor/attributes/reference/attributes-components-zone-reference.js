editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.ZoneComponent',
        subTitle: '{pc.Component}',
        description: 'The ZoneComponent allows you to define an area of certain size in world space.'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'zone:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
