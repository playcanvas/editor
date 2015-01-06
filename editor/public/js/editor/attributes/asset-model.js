(function() {
    'use strict';

    msg.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].type !== 'model')
            return;

        var asset = assets[0];

        // nodes panel
        var panelNodes = msg.call('attributes:addPanel', {
            name: 'Nodes'
        });

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
        };

        if (asset.nodes) {
            // already loaded
            nodesTemplate();
        } else {
            // loading
            var fieldLoading = msg.call('attributes:addField', {
                type: 'progress'
            });
            fieldLoading.on('progress:100', function() {
                this.destroy();
            });

            // once loaded
            asset.once('nodes:set', nodesTemplate);

            // load data
            Ajax
            .get('{{url.api}}' + asset.file.url)
            .on('load', function(status, data) {
                var nodes = [ ];
                for(var i = 0; i < data.model.nodes.length; i++) {
                    if (data.model.nodes[i].name === 'RootNode')
                        continue;

                    nodes.push(data.model.nodes[i].name);
                }
                asset.set('nodes', nodes);

                fieldLoading.progress = 1;
            })
            .on('progress', function(progress) {
                fieldLoading.progress = .1 + progress * .8;
            })

            fieldLoading.progress = .1;
        }
    });
})();
