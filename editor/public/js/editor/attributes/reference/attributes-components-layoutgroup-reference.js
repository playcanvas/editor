editor.once('load', function () {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.LayoutGroupComponent',
        subTitle: '{pc.Component}',
        description: 'The Layout Group Component enables an Entity to position and scale child Element Components according to configurable layout rules.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutGroupComponent.html'
    }, {
        title: 'orientation',
        subTitle: '{pc.ORIENTATION}',
        description: 'Whether the layout should run horizontally or vertically.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutGroupComponent.html#orientation'
    }, {
        title: 'reverseX',
        subTitle: '{Boolean}',
        description: 'Reverses the order of elements on the X axis.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutGroupComponent.html#reverseX'
    }, {
        title: 'reverseY',
        subTitle: '{Boolean}',
        description: 'Reverses the order of elements on the Y axis.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutGroupComponent.html#reverseY'
    }, {
        title: 'alignment',
        subTitle: '{pc.Vec2}',
        description: 'Specifies the horizontal and vertical alignment of child elements. Values range from 0 to 1 where [0,0] is the bottom left and [1,1] is the top right.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutGroupComponent.html#alignment'
    }, {
        title: 'padding',
        subTitle: '{pc.Vec4}',
        description: 'Padding to be applied inside the container before positioning any children. Specified as left, bottom, right and top values.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutGroupComponent.html#padding'
    }, {
        title: 'spacing',
        subTitle: '{pc.Vec2}',
        description: 'Spacing to be applied between each child element.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutGroupComponent.html#spacing'
    }, {
        title: 'widthFitting',
        subTitle: '{pc.FITTING}',
        description: 'Fitting logic to be applied when positioning and scaling child elements.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutGroupComponent.html#widthFitting'
    }, {
        title: 'heightFitting',
        subTitle: '{pc.FITTING}',
        description: 'Fitting logic to be applied when positioning and scaling child elements.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutGroupComponent.html#heightFitting'
    }, {
        title: 'wrap',
        subTitle: '{Boolean}',
        description: 'Whether or not to wrap children onto a new row/column when the size of the container is exceeded.',
        url: 'http://developer.playcanvas.com/api/pc.LayoutGroupComponent.html#wrap'
    }];

    for (var i = 0; i < fields.length; i++) {
        fields[i].name = 'layoutgroup:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
