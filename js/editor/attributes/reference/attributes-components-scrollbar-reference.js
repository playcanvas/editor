editor.once('load', function () {
    var fields = [{
        name: 'component',
        title: 'pc.ScrollbarComponent',
        subTitle: '{pc.Component}',
        description: 'A ScrollbarComponent enables a group of entities to behave like a scrollbar, with different visual states for hover and press interactions.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollbarComponent.html'
    }, {
        title: 'orientation',
        subTitle: '{pc.ORIENTATION}',
        description: 'Whether the scrollbar moves horizontally or vertically.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollbarComponent.html#orientation'
    }, {
        title: 'handleEntity',
        subTitle: '{pc.Entity}',
        description: 'The entity to be used as the scrollbar handle. This entity must have a Scrollbar component.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollbarComponent.html#handleEntity'
    }, {
        title: 'value',
        subTitle: '{Number}',
        description: 'The current position value of the scrollbar, in the range 0...1.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollbarComponent.html#value'
    }, {
        title: 'handleSize',
        subTitle: '{Number}',
        description: 'The size of the handle relative to the size of the track, in the range 0...1. For a vertical scrollbar, a value of 1 means that the handle will take up the full height of the track.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollbarComponent.html#handleSize'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'scrollbar:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
