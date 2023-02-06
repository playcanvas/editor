editor.once('load', function () {
    var fields = [{
        name: 'clip',
        title: 'pc.SpriteAnimationClip',
        description: 'A Sprite Animation Clip can play all the frames of a Sprite Asset at a specified speed.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteAnimationClip.html'
    }, {
        title: 'name',
        subTitle: '{String}',
        description: 'The name of the animation clip. The name of the clip must be unique for this Sprite Component.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteAnimationClip.html#name'
    }, {
        title: 'autoPlay',
        subTitle: '{Boolean}',
        description: 'Enable this if you want to automatically start playing this animation clip as soon as it is loaded.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteAnimationClip.html#autoPlay'
    }, {
        title: 'loop',
        subTitle: '{Boolean}',
        description: 'Enable this if you want to loop the animation clip.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteAnimationClip.html#loop'
    }, {
        title: 'fps',
        subTitle: '{Number}',
        description: 'The number of frames per second to play for this animation clip.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteAnimationClip.html#fps'
    }, {
        title: 'spriteAsset',
        subTitle: '{pc.Asset}',
        description: 'The Sprite Asset that contains all the frames of the animation clip.',
        url: 'http://developer.playcanvas.com/api/pc.SpriteAnimationClip.html#spriteAsset'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'spriteAnimation:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
