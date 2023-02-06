import { Container, Panel } from '@playcanvas/pcui';

editor.on('load', function () {
    // main container
    const root = new Container({
        id: 'ui-root',
        flex: true,
        flexDirection: 'column',
        flexWrap: 'nowrap'
    });
    document.body.appendChild(root.dom);
    // expose
    editor.method('layout.root', () => {
        return root;
    });

    // menu bar
    const top = new Container({
        id: 'ui-top',
        flex: true,
        flexDirection: 'row',
        flexWrap: 'nowrap',
        flexShrink: '0'
    });
    root.append(top);
    // expose
    editor.method('layout.top', () => {
        return top;
    });

    // middle
    const middle = new Container({
        id: 'ui-middle',
        flex: true,
        flexDirection: 'row',
        flexGrow: '1'
    });
    root.append(middle);

    // left
    const left = new Panel({
        collapseHorizontally: true,
        collapsible: true,
        collapsed: editor.call('localStorage:get', 'editor:layout:left:fold') || false,
        headerText: 'FILES',
        id: 'ui-left',
        resizable: 'right',
        resizeMin: 200,
        resizeMax: 500,
        scrollable: true,
        width: editor.call('localStorage:get', 'editor:layout:left:width') || 220
    });

    left.on('resize', () => {
        editor.call('localStorage:set', 'editor:layout:left:width', left.width);
    });
    left.on('collapse', () => {
        editor.call('localStorage:set', 'editor:layout:left:fold', true);
    });
    left.on('expand', () => {
        editor.call('localStorage:set', 'editor:layout:left:fold', false);
    });

    middle.append(left);
    // expose
    editor.method('layout.left', () => {
        return left;
    });

    // center
    const center = new Container({
        id: 'ui-center'
    });
    middle.append(center);
    // expose
    editor.method('layout.center', () => {
        return center;
    });

    // tabs
    const tabs = new Container({
        class: 'invisible',
        id: 'ui-tabs',
        flex: true,
        flexDirection: 'row',
        flexWrap: 'nowrap',
        flexShrink: '0'
    });
    center.append(tabs);
    // expose
    editor.method('layout.tabs', () => {
        return tabs;
    });

    // code
    const code = new Container({
        id: 'ui-code'
    });
    center.append(code);
    // expose
    editor.method('layout.code', () => {
        return code;
    });

    // right
    const right = new Panel({
        collapseHorizontally: true,
        headerText: 'PREFERENCES',
        hidden: true,
        id: 'ui-right',
        resizable: 'left',
        resizeMin: 264,
        resizeMax: 500,
        scrollable: true
    });
    middle.append(right);
    // expose
    editor.method('layout.attributes', () => {
        return right;
    });

    // bottom (status)
    const bottom = new Container({
        id: 'ui-bottom'
    });
    root.append(bottom);
    // expose
    editor.method('layout.statusBar', () => {
        return bottom;
    });

    // disable context menu for everything but the code view
    root.dom.addEventListener('contextmenu', (e) => {
        if (!code.domContent.contains(e.target)) {
            e.preventDefault();
        }
    });
});
