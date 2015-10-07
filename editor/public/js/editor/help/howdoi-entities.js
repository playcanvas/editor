editor.once('load', function () {
    'use strict';

    var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    var ctrl = isMac ? 'Cmd' : 'Ctrl';
    var del = isMac ? 'Cmd + Backspace' : 'Delete';

    // create entity
    editor.call('help:howdoi:register', {
        title: 'Create an Entity',
        text: 'You can create a new Entity by clicking on the <span class="font-icon">&#58468;</span> Add button in the Hierarchy panel. You can also right click on an Entity and select New Entity from the context menu.',
        img: 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/instructions/new_entity.gif',
        keywords: ['entity', 'new', 'create']
    });

    // duplicate entity
    editor.call('help:howdoi:register', {
        title: 'Duplicate an Entity',
        text: 'To duplicate an Entity use the <span class="font-icon">&#57908;</span> Duplicate button in the Hierarchy panel or press <strong>' + ctrl + '+D</strong>.<br/><br/>You can also copy and paste an Entity. To copy press <strong>' + ctrl + '+C</strong> and to paste <strong>' + ctrl + '+V</strong>.',
        keywords: ['entity', 'duplicate', 'copy', 'paste']
    });

    // delete entity
    editor.call('help:howdoi:register', {
        title: 'Delete an Entity',
        text: 'You can delete an Entity by selecting it and pressing <strong>' + del + '</strong>. Alternatively you can click on the <span class="font-icon">&#58657;</span> Delete button in the Hierarchy panel or right click on the Entity and select Delete from the context menu.',
        keywords: ['entity', 'delete', 'destroy', 'remove']
    });

    // transform entity
    editor.call('help:howdoi:register', {
        title: 'Move / Rotate / Scale an Entity',
        text: 'To move an Entity, select it and then move it using the <strong><span class="font-icon">&#58454;</span> Translate tool</strong>. To rotate it use the <strong><span class="font-icon">&#57670;</span> Rotate tool</strong> and to scale it use the <strong><span class="font-icon">&#57667;</span> Scale tool</strong>.<br/><br/>Switch between the Translate / Rotate / Scale tools by pressing 1 / 2 / 3 respectively.',
        img: 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/instructions/transform.gif',
        keywords: ['entity', 'move', 'translate', 'rotate', 'scale', 'transform']
    });

    // add component
    editor.call('help:howdoi:register', {
        title: 'Add a component',
        text: 'To add a <strong>Component</strong> to an Entity, select the Entity and then click <strong>Add Component</strong> in the <strong>Inspector</strong> or right click on the Entity and select a component from the Add Component context menu.',
        keywords: ['entity', 'add', 'component', 'behaviour'],
        docs: 'http://developer.playcanvas.com/en/user-manual/packs/components/'
    });

    //
    // remove component
    editor.call('help:howdoi:register', {
        title: 'Remove a component',
        text: 'To remove a Component, select the Entity and then click on the <strong><span class="font-icon">&#58657;</span> Delete</strong> button in the Inspector next the Component’s title.',
        keywords: ['entity', 'add', 'component', 'behaviour'],
        img: 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/instructions/remove_component.jpg'
    });

    // animation component
    editor.call('help:howdoi:register', {
        title: 'Play an Animation',
        text: 'To play an animation of a 3D model you need to create an Entity with a <a href="http://developer.playcanvas.com/en/user-manual/packs/components/model/" target="_blank">Model Component</a> and an <a href="http://developer.playcanvas.com/en/user-manual/packs/components/animation/" target="_blank">Animation Component</a>. The <strong>Model Component</strong> will render your model and the <strong>Animation Component</strong> will play animations.<br/><br/>To render the model drag a model Asset in the Asset field of the Model Component. To play animations drag Animation Assets on the Assets field of the Animation Component.',
        keywords: ['component', 'animation', 'model', '3d', 'fbx'],
        video: {
            url: 'https://www.youtube.com/embed/2MAxwOYLnh0?list=PL0KdXFF26E4Bpjx5R3B8LH6blmU-h3JLV',
            width: 560,
            height: 315
        }
    });

    // primitive model component
    editor.call('help:howdoi:register', {
        title: 'Create a shape like a box, sphere etc.',
        text: 'You can add primitive shapes like boxes, spheres and others by adding a <strong>Model Component</strong> on an Entity and changing its type to the desired shape.<br/><br/>You can also right click on an Entity and select New Entity/Box to add a box (similarly for other shapes).',
        keywords: ['add', 'component', 'model', 'box', 'sphere', 'cylinder', 'cone', 'cube', 'plane', 'shape', 'primitive'],
        docs: 'http://developer.playcanvas.com/en/user-manual/packs/components/model/',
        img: 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/instructions/new_box.gif'
    });



});