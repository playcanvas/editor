editor.once('load', function() {
    'use strict';

    var inViewport = false;
    var nameLast = '';
    var timeout = null;
    var pickedLast = null;
    var nodeLast = null;
    var delay = 500;

    editor.on('viewport:hover', function(state) {
        inViewport = state;

        if (! inViewport) {
            nameLast = '';
            pickedLast = null;
            nodeLast = null;
            editor.call('cursor:text', '');
            clearTimeout(timeout);
        }
    });

    var showTooltip = function() {
        editor.call('cursor:text', nameLast);
    };

    var checkPicked = function(node, picked) {
        var name = '';

        if (inViewport && node) {
            if (node._icon) {
                // icon
                var entity = node._getEntity && node._getEntity();
                if (entity)
                    name = entity.name;
            } else if (node.model && node.model.asset && node.model.model && picked && picked.node &&
                       editor.call('selector:type') === 'entity' &&
                       editor.call('selector:count') === 1 &&
                       editor.call('selector:items')[0].entity === node) {
                // selected entity
                name = node.name + ' &#8594; ' + picked.node.name;
            } else {
                // normal entity
                if (editor.call('entities:get', node.getGuid()))
                    name = node.name;
            }
        }

        if (nodeLast !== node || pickedLast !== picked || nameLast !== name) {
            editor.call('cursor:text', '');
            clearTimeout(timeout);
            if (nameLast || name)
                timeout = setTimeout(showTooltip, delay);
        }

        if (nameLast !== name)
            nameLast = name;

        if (pickedLast !== picked)
            pickedLast = picked;

        if (nodeLast !== node)
            nodeLast = node;
    };

    editor.on('viewport:pick:node', checkPicked)
    editor.on('viewport:pick:hover', checkPicked);
});
