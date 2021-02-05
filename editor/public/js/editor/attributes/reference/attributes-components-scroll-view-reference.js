editor.once('load', function () {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.ScrollViewComponent',
        subTitle: '{pc.Component}',
        description: 'A ScrollViewComponent enables a group of entities to behave like a masked scrolling area, with optional horizontal and vertical scroll bars.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollViewComponent.html'
    }, {
        title: 'horizontal',
        subTitle: '{Boolean}',
        description: 'Whether to enable horizontal scrolling.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollViewComponent.html#horizontal'
    }, {
        title: 'vertical',
        subTitle: '{Boolean}',
        description: 'Whether to enable vertical scrolling.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollViewComponent.html#vertical'
    }, {
        title: 'scrollMode',
        subTitle: '{pc.SCROLL_MODE}',
        description: 'Specifies how the scroll view should behave when the user scrolls past the end of the content.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollViewComponent.html#scrollMode'
    }, {
        title: 'bounceAmount',
        subTitle: '{Number}',
        description: 'Controls how far the content should move before bouncing back.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollViewComponent.html#bounceAmount'
    }, {
        title: 'friction',
        subTitle: '{Number}',
        description: 'Controls how freely the content should move if thrown, i.e. by flicking on a phone or by flinging the scroll wheel on a mouse. A value of 1 means that content will stop immediately; 0 means that content will continue moving forever (or until the bounds of the content are reached, depending on the scrollMode).',
        url: 'http://developer.playcanvas.com/api/pc.ScrollViewComponent.html#friction'
    }, {
        title: 'horizontalScrollbarVisibility',
        subTitle: '{pc.SCROLLBAR_VISIBILITY}',
        description: 'Controls whether the horizontal scrollbar should be visible all the time, or only visible when the content exceeds the size of the viewport.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollViewComponent.html#horizontalScrollbarVisibility'
    }, {
        title: 'verticalScrollbarVisibility',
        subTitle: '{pc.SCROLLBAR_VISIBILITY}',
        description: 'Controls whether the vertical scrollbar should be visible all the time, or only visible when the content exceeds the size of the viewport.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollViewComponent.html#verticalScrollbarVisibility'
    }, {
        title: 'viewportEntity',
        subTitle: '{pc.Entity}',
        description: 'The entity to be used as the masked viewport area, within which the content will scroll. This entity must have an ElementGroup component.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollViewComponent.html#viewportEntity'
    }, {
        title: 'contentEntity',
        subTitle: '{pc.Entity}',
        description: 'The entity which contains the scrolling content itself. This entity must have an Element component.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollViewComponent.html#contentEntity'
    }, {
        title: 'horizontalScrollbarEntity',
        subTitle: '{pc.Entity}',
        description: 'The entity to be used as the horizontal scrollbar. This entity must have a Scrollbar component.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollViewComponent.html#horizontalScrollbarEntity'
    }, {
        title: 'verticalScrollbarEntity',
        subTitle: '{pc.Entity}',
        description: 'The entity to be used as the vertical scrollbar. This entity must have a Scrollbar component.',
        url: 'http://developer.playcanvas.com/api/pc.ScrollViewComponent.html#verticalScrollbarEntity'
    }];

    for (var i = 0; i < fields.length; i++) {
        fields[i].name = 'scrollview:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
