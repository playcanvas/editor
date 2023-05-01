editor.once('load', function () {
    var fields = [{
        name: 'component',
        title: 'pc.AnimComponent',
        subTitle: '{pc.Component}',
        description: 'Enables an entity to animate its model component using the supplied anim state graph asset and attached animation assets.',
        url: 'https://developer.playcanvas.com/api/pc.AnimComponent.html'
    }, {
        title: 'activate',
        subTitle: '{Boolean}',
        description: 'If checked, the component will start playing the anim state graph on load.',
        url: 'https://developer.playcanvas.com/api/pc.AnimComponent.html#activate'
    }, {
        title: 'speed',
        subTitle: '{Number}',
        description: 'A multiplier for animation playback speed. 0 will freeze animation playback, and 1 represents the normal playback speed.',
        url: 'https://developer.playcanvas.com/api/pc.AnimComponent.html#speed'
    }, {
        title: 'rootBone',
        subTitle: '{pc.Entity}',
        description: 'The root of the entity hierarchy that all model transform animations should play on.',
        url: 'https://developer.playcanvas.com/api/pc.AnimComponent.html#rootBone'
    }, {
        title: 'normalizeWeights',
        subTitle: '{Boolean}',
        description: 'If true, the weights of all layers will be normalized together. Otherwise, the animations of each layer will be applied independently.',
        url: 'https://developer.playcanvas.com/api/pc.AnimComponent.html#normalizeWeights'
    }, {
        title: 'stateGraphAsset',
        subTitle: '{Number}',
        description: 'The anim state graph asset that will control the animation playback for this entity.',
        url: 'https://developer.playcanvas.com/api/pc.AnimComponent.html#stateGraphAsset'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'anim:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
