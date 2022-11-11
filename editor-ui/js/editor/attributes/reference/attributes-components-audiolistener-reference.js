editor.once('load', function () {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.AudioListenerComponent',
        subTitle: '{pc.Component}',
        description: 'Specifies the listener\'s position in 3D space. All 3D audio playback will be relative to this position.',
        url: 'http://developer.playcanvas.com/api/pc.AudioListenerComponent.html'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'audiolistener:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
