editor.once('load', function () {
    var fields = [{
        name: 'component',
        title: 'pc.ScreenComponent',
        subTitle: '{pc.Component}',
        description: '',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html'
    }, {
        title: 'screenSpace',
        subTitle: '{Boolean}',
        description: 'If true then the screen will display its child Elements in 2D. Set this to false to make this a 3D screen.',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html#screenSpace'
    }, {
        title: 'resolution',
        subTitle: '{pc.Vec2}',
        description: 'The resolution of the screen.',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html#resolution'
    }, {
        title: 'referenceResolution',
        subTitle: '{pc.Vec2}',
        description: 'The reference resolution of the screen. If the window size changes the screen will adjust its size based on scaleMode using the reference resolution.',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html#referenceResolution'
    }, {
        title: 'scaleMode',
        subTitle: '{String}',
        description: 'Controls how a screen-space screen is resized when the window size changes. Use Blend to have the screen adjust between the difference of the window resolution and the screen\'s reference resolution. Use None to make the screen always have a size equal to its resolution.',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html#scaleMode'
    }, {
        title: 'scaleBlend',
        subTitle: '{Number}',
        description: 'Set this to 0 to only adjust to changes between the width of the window and the x of the reference resolution. Set this to 1 to only adjust to changes between the window height and the y of the reference resolution. A value in the middle will try to adjust to both.',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html#scaleBlend'
    }, {
        title: 'priority',
        subTitle: '{Number}',
        description: 'Determines the order in which Screen components in the same layer are rendered (higher priority is rendered on top). Number must be an integer between 0 and 127.',
        url: 'http://developer.playcanvas.com/api/pc.ScreenComponent.html#priority'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'screen:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
