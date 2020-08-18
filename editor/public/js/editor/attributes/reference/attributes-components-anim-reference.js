editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.AnimComponent',
        subTitle: '{pc.Component}',
        description: 'Enables an entity to animate it\'s model component using the supplied anim state graph asset and attached animation assets.',
    }, {
        title: 'speed',
        subTitle: '{Number}',
        description: 'A multiplier for animation playback speed. 0 will freeze animation playback, and 1 represents the normal playback speed.',
    }, {
        title: 'activate',
        subTitle: '{Boolean}',
        description: 'If checked, the component will start playing the anim state graph on load.',
    }, {
        title: 'stateGraphAsset',
        subTitle: '{Number}',
        description: 'The anim state graph asset that will control the animation playback for this entity.',
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'anim:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
