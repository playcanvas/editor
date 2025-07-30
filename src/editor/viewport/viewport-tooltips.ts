editor.once('load', () => {
    let inViewport = false;
    let nameLast = '';
    let timeout = null;
    let pickedLast = null;
    let nodeLast = null;
    const delay = 500;

    editor.on('viewport:hover', (state) => {
        inViewport = state;

        if (!inViewport) {
            nameLast = '';
            pickedLast = null;
            nodeLast = null;
            editor.call('cursor:text', '');
            clearTimeout(timeout);
        }
    });

    const showTooltip = function () {
        editor.call('cursor:text', nameLast);
    };

    const checkPicked = function (node, picked) {
        let name = '';

        if (inViewport && node) {
            if (node._icon) {
                // icon
                const entity = node._getEntity && node._getEntity();
                if (entity) {
                    name = entity.name;
                }
            } else if (node._userCamera) {
                name = '@';
                editor.call('users:loadOne', node._userCamera, (data) => {
                    name = `@${data && data.username || 'anonymous'}`;
                });
            } else if (node.model && node.model.asset && node.model.model && picked && picked.node) {
                // entity model meshInstance
                name = `${node.name} &#8594; ${picked.node.name}`;
            } else {
                // normal entity
                if (editor.call('entities:get', node.getGuid())) {
                    name = node.name;
                }
            }
        }

        if (nodeLast !== node || pickedLast !== picked || nameLast !== name) {
            editor.call('cursor:text', '');
            clearTimeout(timeout);
            if (nameLast || name) {
                timeout = setTimeout(showTooltip, delay);
            }
        }

        if (nameLast !== name) {
            nameLast = name;
        }

        if (pickedLast !== picked) {
            pickedLast = picked;
        }

        if (nodeLast !== node) {
            nodeLast = node;
        }
    };

    editor.on('viewport:pick:node', checkPicked);
    editor.on('viewport:pick:hover', checkPicked);
});
