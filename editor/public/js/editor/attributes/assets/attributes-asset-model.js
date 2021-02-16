editor.once('load', function () {
    'use strict';

    var panelNodes = null;

    editor.method('attributes:asset:model:nodesPanel', function () {
        return panelNodes;
    });

    var panelToggles = {
        'meta': true,
        'pipeline': true,
        'nodes': false
    };

    editor.on('attributes:inspect[asset]', function (assets) {

        for (let i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'model' || assets[i].get('source'))
                return;
        }

        // nodes panel
        panelNodes = editor.call('attributes:addPanel', {
            name: 'Mesh Instances'
        });
        panelNodes.class.add('component');
        panelNodes.flex = true;
        panelNodes.innerElement.style.flexDirection = 'column';
        panelNodes.foldable = true;
        panelNodes.folded = panelToggles.nodes;
        panelNodes.on('fold', function () {
            panelToggles.nodes = true;
        });
        panelNodes.on('unfold', function () {
            panelToggles.nodes = false;
        });
        panelNodes.class.add('noHeader');

        // references
        editor.call('attributes:reference:attach', 'asset:model:meshInstances', panelNodes, panelNodes.headerElement);

    });
});
