editor.once('load', function() {
    'use strict';

    if (editor.call('project:settings').get('use_legacy_scripts'))
        return;

    var foldStates = {
        'scripts': true
    };

    var projectSettings = editor.call('project:settings');


    editor.on('assets:add', function(asset) {
        if (asset.get('type') !== 'script')
            return;

        var assetId = parseInt(asset.get('id'), 10);

        if (asset.get('preload') && projectSettings.get('scripts').indexOf(assetId) === -1)
            projectSettings.insert('scripts', assetId);

        asset.on('preload:set', function(state) {
            var added = projectSettings.get('scripts').indexOf(assetId) !== -1;
            if (state && ! added) {
                projectSettings.insert('scripts', assetId);
            } else if (! state && added) {
                projectSettings.removeValue('scripts', assetId);
            }
        });

        asset.once('destroy', function() {
            if (projectSettings.get('scripts').indexOf(assetId) === -1)
                return;

            projectSettings.removeValue('scripts', assetId);
        });
    });


    editor.on('attributes:inspect[editorSettings]', function() {
        var events = [ ];

        // scripts order
        var panel = editor.call('attributes:addPanel', {
            name: 'Scripts Loading Order'
        });
        panel.foldable = true;
        panel.folded = foldStates['scripts'];
        panel.on('fold', function() { foldStates['scripts'] = true; });
        panel.on('unfold', function() { foldStates['scripts'] = false; });
        panel.class.add('component', 'scripts-order');
        panel.element.tabIndex = 0;


        var panelItems = new ui.Panel();
        panelItems.class.add('scripts-order');
        panel.append(panelItems);

        var itemsIndex = { };
        var dragPlaceholder = null;
        var dragInd = null;
        var dragOut = true;
        var dragItem = null;
        var dragItemInd = null;
        var dragItems = [ ];

        // drop area
        var target = editor.call('drop:target', {
            ref: panelItems.innerElement,
            type: 'script-order',
            hole: true,
            passThrough: true
        });
        target.element.style.outline = '1px dotted #f60';
        panelItems.once('drestroy', function() {
            target.unregister();
        });

        var dragCalculateSizes = function() {
            dragItems = [ ];
            var children = panelItems.innerElement.children;

            for(var i = 0; i < children.length; i++) {
                var item = children[i].ui ? children[i].ui.assetId : children[i].assetId;

                dragItems.push({
                    item: item,
                    ind: projectSettings.get('scripts').indexOf(item),
                    y: children[i].offsetTop,
                    height: children[i].clientHeight
                });
            }
        };
        var onItemDragStart = function(evt) {
            // dragend
            window.addEventListener('blur', onItemDragEnd, false);
            window.addEventListener('mouseup', onItemDragEnd, false);
            window.addEventListener('mouseleave', onItemDragEnd, false);
            document.body.addEventListener('mouseleave', onItemDragEnd, false);
            // dragmove
            window.addEventListener('mousemove', onItemDragMove, false);

            itemsIndex[dragItem].class.add('dragged');

            dragCalculateSizes();
            for(var i = 0; i < dragItems.length; i++) {
                if (dragItems[i].item === dragItem)
                    dragItemInd = i;
            }

            var panel = itemsIndex[dragItem];
            var parent = panel.element.parentNode;
            dragPlaceholder = document.createElement('div');
            dragPlaceholder.assetId = dragItem;
            dragPlaceholder.classList.add('dragPlaceholder');
            dragPlaceholder.style.height = (dragItems[dragItemInd].height - 8) + 'px';
            parent.insertBefore(dragPlaceholder, panel.element);
            parent.removeChild(panel.element);

            onItemDragMove(evt);

            editor.call('drop:set', 'script-order', { asset: dragItem });
            editor.call('drop:activate', true);
        };
        var onItemDragMove = function(evt) {
            if (! dragItem) return;

            var rect = panelItems.innerElement.getBoundingClientRect();

            dragOut = (evt.clientX < rect.left || evt.clientX > rect.right || evt.clientY < rect.top || evt.clientY > rect.bottom);

            if (! dragOut) {
                var y = evt.clientY - rect.top;
                var ind = null;
                var height = dragPlaceholder.clientHeight;

                var c = 0;
                for(var i = 0; i < dragItems.length; i++) {
                    if (dragItems[i].item === dragItem) {
                        c = i;
                        break;
                    }
                }

                // hovered item
                for(var i = 0; i < dragItems.length; i++) {
                    var off = Math.max(0, dragItems[i].height - height);
                    if (c < i) {
                        if (y >= (dragItems[i].y + off) && y <= (dragItems[i].y + dragItems[i].height)) {
                            ind = i;
                            if (ind > dragItemInd) ind++;
                            break;
                        }
                    } else {
                        if (y >= dragItems[i].y && y <= (dragItems[i].y + dragItems[i].height - off)) {
                            ind = i;
                            if (ind > dragItemInd) ind++;
                            break;
                        }
                    }
                }

                if (ind !== null && dragInd !== ind) {
                    dragInd = ind;

                    var parent = dragPlaceholder.parentNode;
                    parent.removeChild(dragPlaceholder);

                    var ind = dragInd;
                    if (ind > dragItemInd) ind--;
                    var next = parent.children[ind];

                    if (next) {
                        parent.insertBefore(dragPlaceholder, next);
                    } else {
                        parent.appendChild(dragPlaceholder);
                    }

                    dragCalculateSizes();
                }
            } else {
                dragInd = dragItemInd;
                var parent = dragPlaceholder.parentNode;
                parent.removeChild(dragPlaceholder);
                var next = parent.children[dragItemInd];
                if (next) {
                    parent.insertBefore(dragPlaceholder, next);
                } else {
                    parent.appendChild(dragPlaceholder);
                }
                dragCalculateSizes();
            }
        };
        var onItemDragEnd = function() {
            // dragend
            window.removeEventListener('blur', onItemDragEnd);
            window.removeEventListener('mouseup', onItemDragEnd);
            window.removeEventListener('mouseleave', onItemDragEnd);
            document.body.removeEventListener('mouseleave', onItemDragEnd);
            // dragmove
            window.removeEventListener('mousemove', onItemDragMove);

            if (dragItem) {
                itemsIndex[dragItem].class.remove('dragged');

                var panel = itemsIndex[dragItem];
                panelItems.innerElement.removeChild(dragPlaceholder);
                var next = panelItems.innerElement.children[dragItemInd];
                if (next) {
                    panelItems.innerElement.insertBefore(panel.element, next);
                } else {
                    panelItems.innerElement.appendChild(panel.element);
                }

                if (! dragOut && dragInd !== null && dragInd !== dragItemInd && dragInd !== (dragItemInd + 1)) {
                    var ind = dragInd;
                    if (ind > dragItemInd) ind--;
                    projectSettings.move('scripts', dragItemInd, ind);

                    var data = {
                        item: dragItem,
                        indNew: ind,
                        indOld: dragItemInd
                    };

                    editor.call('history:add', {
                        name: 'project.scripts.move',
                        undo: function() {
                            var indOld = projectSettings.get('scripts').indexOf(data.item);
                            if (indOld === -1) return;
                            projectSettings.move('scripts', indOld, data.indOld);
                        },
                        redo: function() {
                            var indOld = projectSettings.get('scripts').indexOf(data.item);
                            if (indOld === -1) return;
                            projectSettings.move('scripts', indOld, data.indNew);
                        }
                    });
                }
            }

            dragItem = null;
            dragItems = [ ];
            dragInd = null;

            editor.call('drop:activate', false);
            editor.call('drop:set');
        };


        var assetFullSet = function() {
            var scripts = projectSettings.get('scripts');

            // clear panel
            var first = panelItems.innerElement.firstChild;
            while(first) {
                panelItems.innerElement.removeChild(first);
                first = panelItems.innerElement.firstChild;
            }

            // reappend
            for(var i = 0; i < scripts.length; i++) {
                if (itemsIndex[scripts[i]]) {
                    panelItems.innerElement.appendChild(itemsIndex[scripts[i]].element);
                } else {
                    assetAdd(editor.call('assets:get', scripts[i]));
                }
            }

            assetUpdateNumbers();
        };


        var assetUpdateNumbers = function() {
            var children = panelItems.innerElement.children;
            for(var i = 0; i < children.length; i++)
                children[i].ui.number.textContent = i + 1;
        }


        var assetAdd = function(asset, ind) {
            if (! asset) return;

            var events = [ ];
            var assetId = parseInt(asset.get('id'), 10);

            if (itemsIndex[assetId])
                return;

            var panel = itemsIndex[assetId] = new ui.Panel();
            panel.header = asset.get('name');
            panel.assetId = assetId;
            panel.class.add('asset');

            panel.headerElement.addEventListener('click', function() {
                editor.call('selector:set', 'asset', [ asset ]);
            }, false);

            // name
            events.push(asset.on('name:set', function(value) {
                panel.header = value;
            }));

            // number
            panel.number = document.createElement('div');
            panel.number.classList.add('number');
            panel.number.textContent = projectSettings.get('scripts').indexOf(assetId) + 1;
            panel.headerAppend(panel.number);

            // handle
            panel.handle = document.createElement('div');
            panel.handle.classList.add('handle');
            panel.handle.addEventListener('mousedown', function(evt) {
                evt.stopPropagation();
                evt.preventDefault();

                dragItem = panel.assetId;
                onItemDragStart(evt);
            }, false);
            panel.headerAppend(panel.handle);

            // position
            var next = null;
            if (typeof(ind) === 'number')
                next = panelItems.innerElement.children[ind];

            if (next) {
                panelItems.appendBefore(panel, next);
            } else {
                panelItems.append(panel);
            }

            panel.once('destroy', function() {
                for(var i = 0; i < events.length; i++)
                    events[i].unbind();

                events = null;
            });
        };


        var assetMove = function(asset, ind) {
            var assetId = parseInt(asset.get('id'), 10);

            var panel = itemsIndex[assetId];
            if (! panel) return;

            panelItems.innerElement.removeChild(panel.element);
            var next = panelItems.innerElement.children[ind];

            if (next) {
                panelItems.innerElement.insertBefore(panel.element, next);
            } else {
                panelItems.innerElement.appendChild(panel.element);
            }

            assetUpdateNumbers();
        };


        var assetRemove = function(assetId) {
            if (! itemsIndex[assetId])
                return;

            itemsIndex[assetId].destroy();
            delete itemsIndex[assetId];

            assetUpdateNumbers();
        };

        // get assets
        var assets = projectSettings.get('scripts') || [ ];

        // remove null assets
        var i = assets.length;
        while(i--) {
            if (assets[i] === null)
                projectSettings.remove('scripts', i);
        }

        // add assets
        for(var i = 0; i < assets.length; i++)
            assetAdd(editor.call('assets:get', assets[i]));


        // on add
        events.push(projectSettings.on('scripts:insert', function(assetId, ind) {
            assetAdd(editor.call('assets:get', assetId), ind);
        }));
        // on move
        events.push(projectSettings.on('scripts:move', function(assetId, ind) {
            assetMove(editor.call('assets:get', assetId), ind);
        }));
        // on remove
        events.push(projectSettings.on('scripts:remove', function(assetId) {
            assetRemove(parseInt(assetId, 10));
        }));
        // on set
        events.push(projectSettings.on('scripts:set', function() {
            assetFullSet();
        }));


        panel.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();

            events = null;
        });
    });
});
