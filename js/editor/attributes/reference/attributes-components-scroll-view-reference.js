editor.once('load', function () {
    var fields = [{
        name: 'component',
        title: 'pc.ScrollViewComponent',
        subTitle: '{pc.Component}',
        description: 'A ScrollViewComponent enables a group of entities to behave like a masked scrolling area, with optional horizontal and vertical scroll bars.',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html'
    }, {
        title: 'horizontal',
        subTitle: '{Boolean}',
        description: 'Whether to enable horizontal scrolling.',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#horizontal'
    }, {
        title: 'vertical',
        subTitle: '{Boolean}',
        description: 'Whether to enable vertical scrolling.',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#vertical'
    }, {
        title: 'scrollMode',
        subTitle: '{pc.SCROLL_MODE}',
        description: 'Specifies how the scroll view should behave when the user scrolls past the end of the content.',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#scrollMode'
    }, {
        title: 'bounceAmount',
        subTitle: '{Number}',
        description: 'Controls how far the content should move before bouncing back.',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#bounceAmount'
    }, {
        title: 'friction',
        subTitle: '{Number}',
        description: 'Controls how freely the content should move if thrown, i.e. by flicking on a phone or by flinging the scroll wheel on a mouse. A value of 1 means that content will stop immediately; 0 means that content will continue moving forever (or until the bounds of the content are reached, depending on the scrollMode).',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#friction'
    }, {
        title: 'useMouseWheel',
        subTitle: '{Boolean}',
        description: 'Whether to use mouse wheel for scrolling (horizontally and vertically) when mouse is within bounds.',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#useMouseWheel'
    }, {
        title: 'mouseWheelSensitivity',
        subTitle: '{pc.Vec2}',
        description: 'Mouse wheel horizontal and vertical sensitivity. Only used if \'Use Mouse Wheel\' is set. Setting a direction to 0 will disable mouse wheel scrolling in that direction. 1 is a default sensitivity that is considered to feel good. The values can be set higher or lower than 1 to tune the sensitivity. Defaults to [1, 1].',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#mouseWheelSensitivity'
    }, {
        title: 'horizontalScrollbarVisibility',
        subTitle: '{pc.SCROLLBAR_VISIBILITY}',
        description: 'Controls whether the horizontal scrollbar should be visible all the time, or only visible when the content exceeds the size of the viewport.',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#horizontalScrollbarVisibility'
    }, {
        title: 'verticalScrollbarVisibility',
        subTitle: '{pc.SCROLLBAR_VISIBILITY}',
        description: 'Controls whether the vertical scrollbar should be visible all the time, or only visible when the content exceeds the size of the viewport.',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#verticalScrollbarVisibility'
    }, {
        title: 'viewportEntity',
        subTitle: '{pc.Entity}',
        description: 'The entity to be used as the masked viewport area, within which the content will scroll. This entity must have an ElementGroup component.',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#viewportEntity'
    }, {
        title: 'contentEntity',
        subTitle: '{pc.Entity}',
        description: 'The entity which contains the scrolling content itself. This entity must have an Element component.',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#contentEntity'
    }, {
        title: 'horizontalScrollbarEntity',
        subTitle: '{pc.Entity}',
        description: 'The entity to be used as the horizontal scrollbar. This entity must have a Scrollbar component.',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#horizontalScrollbarEntity'
    }, {
        title: 'verticalScrollbarEntity',
        subTitle: '{pc.Entity}',
        description: 'The entity to be used as the vertical scrollbar. This entity must have a Scrollbar component.',
        url: 'https://developer.playcanvas.com/api/pc.ScrollViewComponent.html#verticalScrollbarEntity'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'scrollview:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
