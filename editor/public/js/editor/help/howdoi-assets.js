editor.once('load', function () {
    'use strict';

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
        text: 'To delete an Asset select it and press Delete or right click on it and select Delete.',
        keywords: ['asset', 'delete', 'remove']
    });

    // create material
    editor.call('help:howdoi:register', {
        title: 'Create a material',
        text: 'Every surface on a 3D model is rendered using a <strong>material</strong>. The material defines the properties of that surface, such as its color, shininess, bumpiness etc.<br/><br/>To create a material click on the <strong><span class="font-icon">&#58468;</span> Add</strong> button in the Assets panel and then select <strong>New Material</strong>.',
        keywords: ['asset', 'material', 'create', 'color', 'surface', 'normal', 'specular', 'phong', 'pbr', 'physical'],
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

    // cubemap
    editor.call('help:howdoi:register', {
        title: 'Create a cubemap',
        text: 'Cubemaps are a special type of texture asset. They are formed from 6 texture assets where each texture represents the face of a cube.<br/><br/>To create a cubemap click on the <strong><span class="font-icon">&#58468;</span> Add</strong> button in the Assets panel and select <strong>New Cubemap</strong>. Then drag 6 textures in the cubemap inspector. To take advantage of Physically Based Rendering make sure you click <strong>Prefilter</strong> after setting the 6 textures.',
        keywords: ['asset', 'cubemap', 'create', 'skybox', 'texture', 'pbr', 'physical'],
        docs: 'http://developer.playcanvas.com/en/user-manual/assets/cubemaps/',
        img: 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/instructions/new_cubemap.gif'
    });

    // skybox
    editor.call('help:howdoi:register', {
        title: 'Create a skybox',
        text: 'To create a skybox for your scene you first need to create a <a href="http://developer.playcanvas.com/en/user-manual/assets/cubemaps/" target="_blank">Cubemap asset</a>. Then you can drag and drop the Cubemap inside the 3D viewport, or you can go to the <a href="http://developer.playcanvas.com/en/user-manual/designer/settings/#skybox" target="_blank">Scene Settings</a> and drag the Cubemap in the Skybox field.',
        keywords: ['skybox', 'cubemap', 'create', 'asset', 'pbr', 'physical'],
        docs: 'http://developer.playcanvas.com/en/user-manual/designer/settings/#skybox'
    });

});