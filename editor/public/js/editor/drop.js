editor.once('load', function() {
    'use strict';

    // overlay
    var overlay = document.createElement('div');
    overlay.classList.add('drop-overlay');
    editor.call('layout.root').append(overlay);

    // areas
    var areas = document.createElement('div');
    areas.classList.add('drop-areas');
    editor.call('layout.root').append(areas);


    var active = false;
    var currentType = '';
    var currentData = { };
    var currentElement = null;
    var dragOver = false;
    var items = [ ];

    var activate = function(type) {
        if (active === type)
            return;

        active = type;

        if (active) {
            overlay.classList.add('active');
            areas.classList.add('active');
        } else {
            overlay.classList.remove('active');
            areas.classList.remove('active');
            dragOver = false;
        }

        editor.emit('drop:active', active);
    };


    // prevent drop file of redirecting
    window.addEventListener('dragenter', function(evt) {
        evt.preventDefault();

        if (dragOver) return;
        dragOver = true;

        if (! currentType)
            currentType = 'files';

        activate(true);
    }, false);

    window.addEventListener('dragover', function(evt) {
        evt.preventDefault();

        if (dragOver) return;
        dragOver = true;

        activate(true);
    });

    window.addEventListener('dragleave', function(evt) {
        evt.preventDefault();

        if (! dragOver) return;
        dragOver = false;

        setTimeout(function() {
            if (dragOver)
                return;

            activate(false);
        }, 0);
    }, false);

    window.addEventListener('drop', function(evt) {
        evt.preventDefault();
        activate(false);
    }, false);


    var evtDragOver = function(e) {
        e.preventDefault();
        this.classList.add('over');
    };
    var evtDragLeave = function(e) {
        e.preventDefault();
        this.classList.remove('over');
    };

    var fixChromeFlexBox = function(item) {
        // workaround for chrome
        // for z-index + flex-grow weird reflow bug
        // need to force reflow in next frames

        if (! window.chrome)
            return;

        // only for those who have flexgrow
        var flex = item.style.flexGrow;
        if (flex) {
            // changing overflow triggers reflow
            var overflow = item.style.overflow;
            item.style.overflow = 'hidden';
            // need to skip 2 frames, 1 is not enough
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    // change back to what it was
                    item.style.overflow = overflow;
                });
            });
        }
    };


    editor.method('drop:target', function(obj) {
        items.push(obj);
        obj.element = document.createElement('div');
        obj.element.classList.add('drop-area');
        areas.appendChild(obj.element);

        obj.evtDrop = function(e) {
            e.preventDefault();
            obj.element.classList.remove('over');

            var data = currentData;
            if (currentType == 'files')
                data = e.dataTransfer.files;

            obj.drop(currentType, data);
        };

        obj.element.addEventListener('dragenter', evtDragOver, false);
        obj.element.addEventListener('dragleave', evtDragLeave, false);
        obj.element.addEventListener('drop', obj.evtDrop, false);

        obj.unregister = function() {
            if (! obj.element.classList.contains('drop-area'))
                return;

            obj.element.removeEventListener('dragenter', evtDragOver);
            obj.element.removeEventListener('dragleave', evtDragLeave);
            obj.element.removeEventListener('drop', obj.evtDrop);

            var ind = items.indexOf(obj);
            if (ind !== -1)
                items.splice(ind, 1);

            if (obj.ref.classList.contains('drop-ref-highlight')) {
                obj.ref.classList.remove('drop-ref-highlight');
                fixChromeFlexBox(obj.ref);
            }

            obj.element.classList.remove('drop-area');
            areas.removeChild(obj.element);
        };

        return obj;
    });


    editor.method('drop:item', function(args) {
        args.element.draggable = true;

        args.element.addEventListener('dragstart', function(evt) {
            evt.dataTransfer.setData('editor', args.type);
            currentType = args.type;
            currentData = args.data;
        }, false);

        args.element.addEventListener('dragend', function(evt) {
            currentType = '';
            currentData = { };
        }, false);
    });


    editor.on('drop:active', function(state) {
        if (state) {
            for(var i = 0; i < items.length; i++) {
                var visible = ! items[i].disabled;

                if (visible) {
                    if (items[i].filter) {
                        visible = items[i].filter(currentType, currentData);
                    } else if (items[i].type !== currentType) {
                        visible = false;
                    }
                }

                if (visible) {
                    var rect = items[i].ref.getBoundingClientRect();
                    var depth = 4;
                    var parent = items[i].ref;
                    while(depth--) {
                        if (! rect.width || ! rect.height || ! parent.offsetHeight || window.getComputedStyle(parent).getPropertyValue('visibility') === 'hidden') {
                            visible = false;
                            break;
                        }
                        parent = parent.parentNode;
                    }
                }

                if (visible) {
                    items[i].element.style.display = 'block';
                    items[i].element.style.left = (rect.left + 1) + 'px';
                    items[i].element.style.top = (rect.top + 1) + 'px';
                    items[i].element.style.width = (rect.width - 2) + 'px';
                    items[i].element.style.height = (rect.height - 2) + 'px';
                    items[i].ref.classList.add('drop-ref-highlight');
                } else {
                    items[i].element.style.display = 'none';

                    if (items[i].ref.classList.contains('drop-ref-highlight')) {
                        items[i].ref.classList.remove('drop-ref-highlight');
                        fixChromeFlexBox(items[i].ref);
                    }
                }
            }
        } else {
            for(var i = 0; i < items.length; i++) {
                if (! items[i].ref.classList.contains('drop-ref-highlight'))
                    continue;

                items[i].ref.classList.remove('drop-ref-highlight');
                fixChromeFlexBox(items[i].ref);
            }
        }
    });
});
