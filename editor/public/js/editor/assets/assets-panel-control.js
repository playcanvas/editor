editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var assetsPanel = editor.call('layout.assets');

    // context menu
    var menu = new ui.Menu();
    root.append(menu);

    // upload
    var menuUpload = new ui.MenuItem({
        text: 'Upload',
        value: 'upload'
    });
    menuUpload.on('select', function() {
        editor.call('assets:upload:picker');
    });
    menu.append(menuUpload);

    // folder
    var menuFolder = new ui.MenuItem({
        text: 'New Folder',
        value: 'folder'
    });
    menuFolder.on('select', function() {
        editor.call('assets:create:folder');
    });
    menu.append(menuFolder);

    // css
    var menuCss = new ui.MenuItem({
        text: 'New Css',
        value: 'css'
    });
    menuCss.on('select', function () {
        editor.call('assets:create:css');
    });
    menu.append(menuCss);

    // cubemap
    var menuCubemap = new ui.MenuItem({
        text: 'New CubeMap',
        value: 'cubemap'
    });
    menuCubemap.on('select', function() {
        editor.call('assets:create:cubemap');
    });
    menu.append(menuCubemap);

    // html
    var menuHtml = new ui.MenuItem({
        text: 'New Html',
        value: 'html'
    });
    menuHtml.on('select', function () {
        editor.call('assets:create:html');
    });
    menu.append(menuHtml);

    // json
    var menuJson = new ui.MenuItem({
        text: 'New Json',
        value: 'json'
    });
    menuJson.on('select', function () {
        editor.call('assets:create:json');
    });
    menu.append(menuJson);

    // material
    var menuMaterial = new ui.MenuItem({
        text: 'New Material',
        value: 'material'
    });
    menuMaterial.on('select', function() {
        editor.call('assets:create:material');
    });
    menu.append(menuMaterial);

    // script
    var menuScript = new ui.MenuItem({
        text: 'New Script',
        value: 'script'
    });
    menuScript.on('select', function () {
        editor.call('sourcefiles:new');
    });
    menu.append(menuScript);

    editor.on('repositories:load', function (repositories) {
        if (repositories.get('current') !== 'directory')
            menuScript.disabled = true;
    });

    // shader
    var menuShader = new ui.MenuItem({
        text: 'New Shader',
        value: 'shader'
    });
    menuShader.on('select', function () {
        editor.call('assets:create:shader');
    });
    menu.append(menuShader);

    // text
    var menuText = new ui.MenuItem({
        text: 'New Text',
        value: 'text'
    });
    menuText.on('select', function () {
        editor.call('assets:create:text');
    });
    menu.append(menuText);

    // controls
    var controls = new ui.Panel();
    controls.enabled = false;
    controls.class.add('assets-controls');
    controls.parent = assetsPanel;
    assetsPanel.headerElement.insertBefore(controls.element, assetsPanel.headerElementTitle.nextSibling);
    editor.on('permissions:writeState', function(state) {
        controls.enabled = state;
    });


    // add
    var btnNew = new ui.Button();
    btnNew.class.add('create-asset');
    btnNew.text = '&#57632;';
    btnNew.on('click', function(evt) {
        var rect = btnNew.element.getBoundingClientRect();
        menu.position(rect.right, rect.top);
        menu.open = true;
    });
    controls.append(btnNew);

    var tooltipAdd = Tooltip.attach({
        target: btnNew.element,
        text: 'Add Asset',
        align: 'bottom',
        root: root
    });
    menu.on('open', function(state) {
        tooltipAdd.disabled = state;
    });

    // delete
    var btnDelete = new ui.Button({
        text: '&#57636;'
    });
    btnDelete.style.fontWeight = 200;
    btnDelete.disabled = true;
    btnDelete.class.add('delete');
    btnDelete.on('click', function() {
        if (! editor.call('permissions:write'))
            return;

        var type = editor.call('selector:type');
        if (type !== 'asset')
            return;

        editor.call('assets:delete:picker', editor.call('selector:items'));
    });
    controls.append(btnDelete);

    var tooltipDelete = Tooltip.attach({
        target: btnDelete.element,
        text: 'Delete Asset',
        align: 'bottom',
        root: root
    });
    tooltipDelete.class.add('innactive');


    editor.on('attributes:clear', function() {
        // btnDuplicate.disabled = true;
        btnDelete.disabled = true;
        tooltipDelete.class.add('innactive');
    });

    editor.on('attributes:inspect[*]', function(type) {
        if (type.startsWith('asset')) {
            btnDelete.enabled = true;
            tooltipDelete.class.remove('innactive');
        } else {
            btnDelete.enabled = false;
            tooltipDelete.class.add('innactive');
        }
        // btnDuplicate.enabled = type === 'asset.material';
    });
});
