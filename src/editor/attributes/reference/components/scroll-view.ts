import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[]  = [{
    name: 'scrollview:component',
    title: 'pc.ScrollViewComponent',
    subTitle: '{pc.Component}',
    description: 'A ScrollViewComponent enables a group of entities to behave like a masked scrolling area, with optional horizontal and vertical scroll bars.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html'
}, {
    name: 'scrollview:horizontal',
    title: 'horizontal',
    subTitle: '{Boolean}',
    description: 'Whether to enable horizontal scrolling.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#horizontal'
}, {
    name: 'scrollview:vertical',
    title: 'vertical',
    subTitle: '{Boolean}',
    description: 'Whether to enable vertical scrolling.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#vertical'
}, {
    name: 'scrollview:scrollMode',
    title: 'scrollMode',
    subTitle: '{pc.SCROLL_MODE_*}',
    description: `Specifies how the scroll view should behave when the user scrolls past the end of the content.
<ul>
<li><b>Clamp</b> (<code>pc.SCROLL_MODE_CLAMP</code>): Scrolling stops at content boundaries.</li>
<li><b>Bounce</b> (<code>pc.SCROLL_MODE_BOUNCE</code>): Content bounces back when scrolling past boundaries.</li>
<li><b>Infinite</b> (<code>pc.SCROLL_MODE_INFINITE</code>): Content can be scrolled indefinitely.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#scrollmode'
}, {
    name: 'scrollview:bounceAmount',
    title: 'bounceAmount',
    subTitle: '{Number}',
    description: 'Controls how far the content should move before bouncing back.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#bounceamount'
}, {
    name: 'scrollview:friction',
    title: 'friction',
    subTitle: '{Number}',
    description: 'Controls how freely the content should move if thrown, i.e. by flicking on a phone or by flinging the scroll wheel on a mouse. A value of 1 means that content will stop immediately; 0 means that content will continue moving forever (or until the bounds of the content are reached, depending on the scrollMode).',
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#friction'
}, {
    name: 'scrollview:useMouseWheel',
    title: 'useMouseWheel',
    subTitle: '{Boolean}',
    description: 'Whether to use mouse wheel for scrolling (horizontally and vertically) when mouse is within bounds.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#usemousewheel'
}, {
    name: 'scrollview:mouseWheelSensitivity',
    title: 'mouseWheelSensitivity',
    subTitle: '{pc.Vec2}',
    description: 'Mouse wheel horizontal and vertical sensitivity. Only used if \'Use Mouse Wheel\' is set. Setting a direction to 0 will disable mouse wheel scrolling in that direction. 1 is a default sensitivity that is considered to feel good. The values can be set higher or lower than 1 to tune the sensitivity. Defaults to [1, 1].',
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#mousewheelsensitivity'
}, {
    name: 'scrollview:horizontalScrollbarVisibility',
    title: 'horizontalScrollbarVisibility',
    subTitle: '{pc.SCROLLBAR_VISIBILITY_*}',
    description: `Controls when the horizontal scrollbar is visible.
<ul>
<li><b>Show Always</b> (<code>pc.SCROLLBAR_VISIBILITY_SHOW_ALWAYS</code>): Scrollbar is always visible.</li>
<li><b>Show When Required</b> (<code>pc.SCROLLBAR_VISIBILITY_SHOW_WHEN_REQUIRED</code>): Scrollbar only visible when content exceeds viewport.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#horizontalscrollbarvisibility'
}, {
    name: 'scrollview:verticalScrollbarVisibility',
    title: 'verticalScrollbarVisibility',
    subTitle: '{pc.SCROLLBAR_VISIBILITY_*}',
    description: `Controls when the vertical scrollbar is visible.
<ul>
<li><b>Show Always</b> (<code>pc.SCROLLBAR_VISIBILITY_SHOW_ALWAYS</code>): Scrollbar is always visible.</li>
<li><b>Show When Required</b> (<code>pc.SCROLLBAR_VISIBILITY_SHOW_WHEN_REQUIRED</code>): Scrollbar only visible when content exceeds viewport.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#verticalscrollbarvisibility'
}, {
    name: 'scrollview:viewportEntity',
    title: 'viewportEntity',
    subTitle: '{pc.Entity}',
    description: 'The entity to be used as the masked viewport area, within which the content will scroll. This entity must have an ElementGroup component.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#viewportentity'
}, {
    name: 'scrollview:contentEntity',
    title: 'contentEntity',
    subTitle: '{pc.Entity}',
    description: 'The entity which contains the scrolling content itself. This entity must have an Element component.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#contententity'
}, {
    name: 'scrollview:horizontalScrollbarEntity',
    title: 'horizontalScrollbarEntity',
    subTitle: '{pc.Entity}',
    description: 'The entity to be used as the horizontal scrollbar. This entity must have a Scrollbar component.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#horizontalscrollbarentity'
}, {
    name: 'scrollview:verticalScrollbarEntity',
    title: 'verticalScrollbarEntity',
    subTitle: '{pc.Entity}',
    description: 'The entity to be used as the vertical scrollbar. This entity must have a Scrollbar component.',
    url: 'https://api.playcanvas.com/engine/classes/ScrollViewComponent.html#verticalscrollbarentity'
}];
