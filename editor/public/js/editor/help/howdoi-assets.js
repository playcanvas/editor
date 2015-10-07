editor.once('load', function () {
    'use strict';

    var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    var ctrl = isMac ? 'Cmd' : 'Ctrl';
    var del = 'Delete';

    // create asset
    editor.call('help:howdoi:register', {
        title: 'Upload Assets',
        text: 'To upload Assets simply drag and drop files from your computer into the Assets panel. Your files will be processed by the server and will appear shortly after in the Assets Panel.',
        keywords: ['asset', 'new', 'create', 'upload'],
        docs: 'http://developer.playcanvas.com/en/user-manual/assets/'
    });

    // delete asset
    editor.call('help:howdoi:register', {
        title: 'Delete an Asset',
        text: 'To delete an Asset select it and press ' + del + ' or right click on it and select Delete.',
        keywords: ['asset', 'delete', 'remove']
    });

    // create material
    editor.call('help:howdoi:register', {
        title: 'Create a material',
        text: 'Every surface on a 3D model is rendered using a <strong>material</strong>. The material defines the properties of that surface, such as its color, shininess, bumpiness etc.<br/><br/>To create a material click on the <span class="font-icon">&#58468;</span> Add button in the Assets panel and then select <strong>New Material</strong>.',
        keywords: ['asset', 'material', 'create', 'color', 'surface', 'normal', 'specular'],
        docs: 'http://developer.playcanvas.com/en/user-manual/assets/materials/'
    });

    // change color
    editor.call('help:howdoi:register', {
        title: 'Change the color of a model',
        text: 'Every surface on a 3D model is rendered using a <strong>material</strong>. The material defines the properties of that surface, such as its color, shininess, bumpiness etc.<br/><br/>You can create a new material and drag and drop it on your model or you can select its existing materials and edit their properties in the Inspector.',
        keywords: ['asset', 'material', 'create', 'color', 'surface', 'normal', 'specular'],
        docs: 'http://developer.playcanvas.com/en/user-manual/assets/materials/',
        img: 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/instructions/change_material.gif'
    });

});