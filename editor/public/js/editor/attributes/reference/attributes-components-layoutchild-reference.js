editor.once('load', function () {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.LayoutChildComponent',
        subTitle: '{pc.Component}',
        description: 'The Layout Child Component enables an Entity to control the sizing applied to it by its parent Layout Group Component.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutChildComponent.html'
    }, {
        title: 'minWidth',
        subTitle: '{Number}',
        description: 'The minimum width the element should be rendered at.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutChildComponent.html#minWidth'
    }, {
        title: 'minHeight',
        subTitle: '{Number}',
        description: 'The minimum height the element should be rendered at.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutChildComponent.html#minHeight'
    }, {
        title: 'maxWidth',
        subTitle: '{Number}',
        description: 'The maximum width the element should be rendered at.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutChildComponent.html#maxWidth'
    }, {
        title: 'maxHeight',
        subTitle: '{Number}',
        description: 'The maximum height the element should be rendered at.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutChildComponent.html#maxHeight'
    }, {
        title: 'fitWidthProportion',
        subTitle: '{Number}',
        description: 'The amount of additional horizontal space that the element should take up, if necessary to satisfy a Stretch/Shrink fitting calculation. This is specified as a proportion, taking into account the proportion values of other siblings.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutChildComponent.html#fitWidthProportion'
    }, {
        title: 'fitHeightProportion',
        subTitle: '{Number}',
        description: 'The amount of additional vertical space that the element should take up, if necessary to satisfy a Stretch/Shrink fitting calculation. This is specified as a proportion, taking into account the proportion values of other siblings.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutChildComponent.html#fitHeightProportion'
    }, {
        title: 'excludeFromLayout',
        subTitle: '{Boolean}',
        description: 'When enabled, the child will be excluded from all layout calculations.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutChildComponent.html#excludeFromLayout'
    }];

    for (var i = 0; i < fields.length; i++) {
        fields[i].name = 'layoutchild:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
