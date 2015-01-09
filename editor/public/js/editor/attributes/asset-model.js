editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].type !== 'model')
            return;

        var asset = assets[0];

        // nodes panel
        var panelNodes = editor.call('attributes:addPanel', {
            name: 'Nodes'
        });
        panelNodes.hidden = true;

        // nodes list
        var nodesList = new ui.List();
        panelNodes.append(nodesList);

        // template nodes
        var nodesTemplate = function() {
            asset.nodes.forEach(function(nodeName) {
                var item = new ui.ListItem({
                    text: nodeName
                });
                nodesList.append(item);
            });
            panelNodes.hidden = false;
        };

        if (asset.nodes) {
            // already loaded
            nodesTemplate();
        } else {
            // loading
            var loading = editor.call('attributes:addField', {
                type: 'progress'
            });
            loading.on('progress:100', function() {
                this.destroy();
            });

            // once loaded
            asset.once('nodes:set', nodesTemplate);

            // load data
            Ajax
            .get('{{url.api}}/' + asset.file.url)
            .on('load', function(status, data) {
                var nodes = [ ];
                for(var i = 0; i < data.model.nodes.length; i++) {
                    if (data.model.nodes[i].name === 'RootNode')
                        continue;

                    nodes.push(data.model.nodes[i].name);
                }
                asset.set('nodes', nodes);

                loading.progress = 1;
            })
            .on('progress', function(progress) {
                loading.progress = .1 + progress * .8;
            })
            .on('error', function() {
                loading.failed = true;
                panelNodes.destroy();

                var error = new ui.Label('failed loading data');
                error.textContent = 'failed loading data';
                error.style.display = 'block';
                error.style.textAlign = 'center';
                error.style.fontWeight = '100';
                error.style.fontSize = '12px';
                error.style.color = '#f66';
                editor.call('attributes.rootPanel').append(error);

                loading.progress = 1;
            })

            loading.progress = .1;
        }
    });
});
