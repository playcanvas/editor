editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'asset',
        title: 'pc.Sound',
        subTitle: '{Class}',
        description: 'Audio resource file that is used by Web Audio API.',
        url: 'http://developer.playcanvas.com/api/pc.Sound.html'
    }, {
        title: 'duration',
        subTitle: '{Number}',
        description: 'Duration of the audio file in seconds.',
        url: 'http://developer.playcanvas.com/api/pc.Sound.html#duration'
    }];

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:audio:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
