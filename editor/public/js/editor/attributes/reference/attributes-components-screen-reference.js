editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.ScreenComponent',
        subTitle: '{pc.Component}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html'
    }, {
        title: 'screenSpace',
        subTitle: '{Boolean}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html#screenSpace'
    }, {
        title: 'resolution',
        subTitle: '{pc.Vec2}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html#resolution'
    }, {
        title: 'referenceResolution',
        subTitle: '{pc.Vec2}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html#referenceResolution'
    }, {
        title: 'scaleMode',
        subTitle: '{String}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html#scaleMode'
    }, {
        title: 'scaleBlend',
        subTitle: '{Number}',
        description: 'TODO',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html#scaleBlend'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'screen:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
