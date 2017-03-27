editor.on('load', function () {
    'use strict';

    // main container
    var root = new ui.Panel();
    root.element.id = 'ui-root';
    root.flex = true;
    root.flexDirection = 'column';
    root.flexWrap = 'nowrap';
    document.body.appendChild(root.element);
    // expose
    editor.method('layout.root', function() { return root; });


    var top = new ui.Panel();
    top.element.id = 'ui-top';
    top.flexWrap = 'nowrap';
    top.flexShrink = false;
    root.append(top);

    // expose
    editor.method('layout.top', function () { return top; });


    // middle
    var middle = new ui.Panel();
    middle.element.id = 'ui-middle';
    middle.flexible = true;
    middle.flexGrow = true;
    root.append(middle);


    // left
    var left = new ui.Panel('FILES');
    left.element.id = 'ui-left';
    left.class.add('noSelect');
    left.foldable = true;
    left.horizontal = true;
    left.scroll = true;
    left.resizable = 'right';
    left.resizeMin = 200;
    left.resizeMax = 500;
    middle.append(left);
    // expose
    editor.method('layout.left', function() { return left; });

    // center
    var center = new ui.Panel();
    center.element.id = 'ui-center';
    middle.append(center);

    // expose
    editor.method('layout.center', function () { return center; });

    // tabs
    var tabs = new ui.Panel();
    tabs.element.id = 'ui-tabs';
    tabs.flexShrink = false;
    tabs.flexWrap = 'nowrap';
    tabs.class.add('invisible');
    center.append(tabs);

    // expose
    editor.method('layout.tabs', function () { return tabs; });

    // code
    var code = new ui.Panel();
    code.element.id = 'ui-code';
    center.append(code);
    editor.method('layout.code', function () { return code; });

    // right
    var right = new ui.Panel('PREFERENCES');
    right.element.id = 'ui-right';
    right.class.add('noSelect');
    right.horizontal = true;
    right.scroll = true;
    right.resizable = 'left';
    right.resizeMin = 264;
    right.resizeMax = 500;
    right.hidden = true;
    middle.append(right);
    // expose
    editor.method('layout.right', function() { return right; });

    // bottom (status)
    var bottom = new ui.Panel();
    bottom.element.id = 'ui-bottom';
    // bottom.flexShrink = false;
    root.append(bottom);
    // expose
    editor.method('layout.bottom', function() { return bottom; });

    // disable context menu for everything but the code view
    root.element.addEventListener('contextmenu', function (e) {
        if (! code.innerElement.contains(e.target)) {
            e.preventDefault();
        }
    });

});
