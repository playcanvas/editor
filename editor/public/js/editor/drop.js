editor.once('load', function() {
    'use strict';

    // overlay
    var overlay = document.createElement('div');
    overlay.classList.add('drop-overlay');
    editor.call('layout.root').append(overlay);

    var imgDrag = new Image();
    // imgDrag.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAACWCAYAAAAfduJyAAAAFUlEQVQoU2NkYGBgYBwlRsNgJKQDAOAfAJflUZweAAAAAElFTkSuQmCC';
    // imgDrag.style.display = 'none';

    var parts = [ 'top', 'right', 'bottom', 'left' ];
    for(var i = 0; i < parts.length; i++) {
        var part = document.createElement('div');
        part.classList.add('drop-overlay-hole-part', parts[i]);
        editor.call('layout.root').append(part);
        parts[i] = part;
    }

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
    var itemOver = null;

    var activate = function(state) {
        if (! editor.call('permissions:write'))
            return;

        if (active === state)
            return;

        active = state;

        if (active) {
            overlay.classList.add('active');
            areas.classList.add('active');
            editor.call('cursor:set', 'grabbing');
        } else {
            overlay.classList.remove('active');
            areas.classList.remove('active');
            dragOver = false;
            currentType = '';
            currentData = { };
            editor.emit('drop:set', currentType, currentData);
            editor.call('cursor:clear');
        }

        var onMouseUp = function() {
            window.removeEventListener('mouseup', onMouseUp);
            activate(false);
        };
        window.addEventListener('mouseup', onMouseUp, false);

        editor.emit('drop:active', active);
    };

    editor.method('drop:activate', activate);
    editor.method('drop:active', function() {
        return active;
    });


    // prevent drop file of redirecting
    window.addEventListener('dragenter', function(evt) {
        evt.preventDefault();

        if (! editor.call('permissions:write'))
            return;

        if (dragOver) return;
        dragOver = true;

        if (! currentType) {
            currentType = 'files';
            editor.emit('drop:set', currentType, currentData);
        }

        activate(true);
    }, false);

    window.addEventListener('dragover', function(evt) {
        evt.preventDefault();

        if (! editor.call('permissions:write'))
            return;

        evt.dataTransfer.dropEffect = 'move';

        if (dragOver) return;
        dragOver = true;

        activate(true);
    }, false);

    window.addEventListener('dragleave', function(evt) {
        evt.preventDefault();

        if (evt.clientX !== 0 || evt.clientY !== 0)
            return;

        if (! editor.call('permissions:write'))
            return;

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
        e.stopPropagation();
        this.classList.add('over');

        if (itemOver && itemOver !== this)
            evtDragLeave.call(itemOver);

        itemOver = this;

        if (this._ref && this._ref.over && currentType) {
            var data = currentData;
            if (currentType == 'files' && e.dataTransfer)
                data = e.dataTransfer.files;
            this._ref.over(currentType, data);
        }
    };
    var evtDragLeave = function(e) {
        if (e) e.preventDefault();
        this.classList.remove('over');

        if (this._ref && this._ref.leave && currentType)
            this._ref.leave();

        if (itemOver === this)
            itemOver = null;
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
        obj.element._ref = obj;
        obj.element.classList.add('drop-area');
        if (obj.hole)
            obj.element.classList.add('hole');

        if (obj.passThrough)
            obj.element.style.pointerEvents = 'none';

        areas.appendChild(obj.element);

        obj.evtDrop = function(e) {
            e.preventDefault();

            if (! currentType)
                return;

            // leave event
            if (obj.element.classList.contains('over')) {
                if (obj.leave && currentType) obj.leave();
                obj.element.classList.remove('over');
            }

            var data = currentData;
            if (currentType == 'files' && e.dataTransfer)
                data = e.dataTransfer.files;

            if (obj.drop)
                obj.drop(currentType, data);
        };

        obj.element.addEventListener('dragenter', evtDragOver, false);
        obj.element.addEventListener('mouseenter', evtDragOver, false);

        obj.element.addEventListener('dragleave', evtDragLeave, false);
        obj.element.addEventListener('mouseleave', evtDragLeave, false);

        var dropOn = obj.element;
        if (obj.passThrough)
            dropOn = obj.ref;

        dropOn.addEventListener('drop', obj.evtDrop, false);
        dropOn.addEventListener('mouseup', obj.evtDrop, false);

        obj.unregister = function() {
            if (! obj.element.classList.contains('drop-area'))
                return;

            obj.element.removeEventListener('dragenter', evtDragOver);
            obj.element.removeEventListener('mouseenter', evtDragOver);

            obj.element.removeEventListener('dragleave', evtDragLeave);
            obj.element.removeEventListener('mouseleave', evtDragLeave);

            dropOn.removeEventListener('drop', obj.evtDrop);
            dropOn.removeEventListener('mouseup', obj.evtDrop);

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
            evt.preventDefault();
            evt.stopPropagation();

            if (! editor.call('permissions:write'))
                return;

            currentType = args.type;
            currentData = args.data;
            itemOver = null;
            editor.emit('drop:set', currentType, currentData);

            activate(true);
        }, false);
    });


    editor.method('drop:set', function(type, data) {
        currentType = type || '',
        currentData = data || { };

        editor.emit('drop:set', currentType, currentData);
    });


    editor.on('drop:active', function(state) {
        areas.style.pointerEvents = '';

        if (state) {
            var bottom = 0;
            var top = window.innerHeight;
            var left = window.innerWidth;
            var right = 0;

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

                    if (items[i].hole) {
                        items[i].element.style.left = (rect.left + 2) + 'px';
                        items[i].element.style.top = (rect.top + 2) + 'px';
                        items[i].element.style.width = (rect.width - 4) + 'px';
                        items[i].element.style.height = (rect.height - 4) + 'px';

                        overlay.classList.remove('active');

                        if (top > rect.top)
                            top = rect.top;

                        if (bottom < rect.bottom)
                            bottom = rect.bottom;

                        if (left > rect.left)
                            left = rect.left;

                        if (right < rect.right)
                            right = rect.right;

                        parts[0].classList.add('active');
                        parts[0].style.height = top + 'px';

                        parts[1].classList.add('active');
                        parts[1].style.top = top + 'px';
                        parts[1].style.bottom = (window.innerHeight - bottom) + 'px';
                        parts[1].style.width = (window.innerWidth - right) + 'px';

                        parts[2].classList.add('active');
                        parts[2].style.height = (window.innerHeight - bottom) + 'px';

                        parts[3].classList.add('active');
                        parts[3].style.top = top + 'px';
                        parts[3].style.bottom = (window.innerHeight - bottom) + 'px';
                        parts[3].style.width = left + 'px';

                        if (items[i].passThrough)
                            areas.style.pointerEvents = 'none';
                    } else {
                        items[i].element.style.left = (rect.left + 1) + 'px';
                        items[i].element.style.top = (rect.top + 1) + 'px';
                        items[i].element.style.width = (rect.width - 2) + 'px';
                        items[i].element.style.height = (rect.height - 2) + 'px';
                        items[i].ref.classList.add('drop-ref-highlight');
                    }
                } else {
                    items[i].element.style.display = 'none';

                    if (items[i].ref.classList.contains('drop-ref-highlight')) {
                        items[i].ref.classList.remove('drop-ref-highlight');
                        fixChromeFlexBox(items[i].ref);
                    }
                }
            }
        } else {
            for(var i = 0; i < parts.length; i++)
                parts[i].classList.remove('active');

            for(var i = 0; i < items.length; i++) {
                if (! items[i].ref.classList.contains('drop-ref-highlight'))
                    continue;

                items[i].ref.classList.remove('drop-ref-highlight');
                fixChromeFlexBox(items[i].ref);
            }
        }
    });
});
