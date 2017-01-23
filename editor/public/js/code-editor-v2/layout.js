editor.on('load', function () {
    'use strict';

    // main container
    var root = new ui.Panel();
    root.element.id = 'ui-root';
    root.flex = true;
    root.flexDirection = 'column';
    root.flexWrap = 'nowrap';
    root.scroll = true;
    document.body.appendChild(root.element);
    // expose
    editor.method('layout.root', function() { return root; });

    var top = new ui.Panel();
    top.element.id = 'ui-top';
    top.flexWrap = 'nowrap';
    top.flexShrink = false;
    root.append(top);

    var label = new ui.Label({
        text: 'top'
    });
    top.append(label);

    // middle
    var middle = new ui.Panel();
    middle.element.id = 'ui-middle';
    middle.flexible = true;
    middle.flexGrow = true;
    root.append(middle);


    // left
    var left = new ui.Panel();
    left.element.id = 'ui-left';
    left.class.add('noSelect');
    left.foldable = true;
    left.horizontal = true;
    left.scroll = true;
    left.resizable = 'right';
    left.resizeMin = 200;
    left.resizeMax = 600;
    left.flexShrink = false;
    middle.append(left);
    // expose
    editor.method('layout.left', function() { return left; });

    // center
    var center = new ui.Panel();
    center.element.id = 'ui-center';
    center.flexible = true;
    center.flexGrow = true;
    center.flexDirection = 'column';
    middle.append(center);

    // expose
    editor.method('layout.center', function () { return center; });

    // tabs
    var tabs = new ui.Panel();
    tabs.element.id = 'ui-tabs';
    tabs.flexShrink = false;
    tabs.flexWrap = 'nowrap';
    center.append(tabs);

    // expose
    editor.method('layout.tabs', function () { return tabs; });

    tabs.append(new ui.Label({
        text: 'tabs'
    }));

    // code
    var code = new ui.Panel();
    code.element.id = 'ui-code';
    center.append(code);

    editor.method('layout.code', function () { return code; });


    // bottom (status)
    var bottom = new ui.Panel();
    bottom.element.id = 'ui-bottom';
    // bottom.flexShrink = false;
    root.append(bottom);
    // expose
    editor.method('layout.bottom', function() { return bottom; });


    // calculate and hardcode with width of the
    // code panel otherwise codemirror will not show scrollbars
    // correctly due to flex
    var setCodePanelWidth = function () {
        code.innerElement.style.width = (document.body.clientWidth - left.innerElement.clientWidth) + 'px';
    };

    window.addEventListener('resize', setCodePanelWidth);
    left.on('resize', setCodePanelWidth);
    setCodePanelWidth();

});