Object.assign(pcui, (function () {
    'use strict';

    var RESIZE_HANDLE_SIZE = 4;

    var VALID_RESIZABLE_VALUES = [
        null,
        'top',
        'right',
        'bottom',
        'left'
    ];

    /**
     * @event
     * @name pcui.Container#append
     * @description Fired when a child Element gets added to the Container
     * @param {pcui.Element} The element that was added
     */

    /**
     * @event
     * @name pcui.Container#remove
     * @description Fired when a child Element gets removed from the Container
     * @param {pcui.Element} The element that was removed
     */

    /**
     * @event
     * @name pcui.Container#scroll
     * @description Fired when the container is scrolled.
     * @param {Event} The native scroll event.
     */

    /**
     * @event
     * @name pcui.Container#resize
     * @description Fired when the container gets resized using the resize handle.
     */

    /**
     * @name pcui.Container
     * @classdesc A container is the basic building block for Elements that are grouped together.
     * A container can contain any other element including other containers.
     * @param {Object} args The arguments. Extends the pcui.Element constructor arguments. All settable properties can also be set through the constructor.
     * @param {HTMLElement} [args.dom] The DOM element to use for the container. If unspecified a new element will be created.
     * @property {Boolean} flex Gets / sets whether the container supports the flex layout. Cannot coexist with grid.
     * @property {Boolean} grid Gets / sets whether the container supports the grid layout. Cannot coexist with flex.
     * @property {Number} resizeMin Gets / sets the minimum size the Container can take when resized in pixels.
     * @property {Number} resizeMax Gets / sets the maximum size the Container can take when resized in pixels.
     * @param {Boolean} scrollable Gets / sets whether the container should be scrollable. Defaults to false.
     * @param {String} resizable Gets / sets whether the Container is resizable and where the resize handle is located. Can
     * be one of 'top', 'bottom', 'right', 'left'. Set to null to disable resizing.
     * @extends pcui.Element
     * @mixes pcui.IContainer
     * @mixes pcui.IFlex
     * @mixes pcui.IGrid
     * @mixes pcui.IScrollable
     * @mixes pcui.IResizable
     */
    function Container(args) {
        if (!args) args = {};

        var dom = args.dom || document.createElement('div');
        dom.classList.add('pcui-container');

        pcui.Element.call(this, dom, args);
        pcui.IContainer.call(this);
        pcui.IFlex.call(this);
        pcui.IGrid.call(this);
        pcui.IScrollable.call(this);
        pcui.IResizable.call(this);

        this._domEventScroll = this._onScroll.bind(this);
        this.domContent = this._dom;

        // scroll
        this.scrollable = args.scrollable !== undefined ? args.scrollable : false;

        // flex
        this.flex = !!args.flex;

        // grid
        var grid = !!args.grid;
        if (grid) {
            if (this.flex) {
                console.error('Invalid pcui.Container arguments: "grid" and "flex" cannot both be true.');
                grid = false;
            }
        }
        this.grid = grid;

        // resize related
        this._domResizeHandle = null;
        this._domEventResizeStart = this._onResizeStart.bind(this);
        this._domEventResizeMove = this._onResizeMove.bind(this);
        this._domEventResizeEnd = this._onResizeEnd.bind(this);
        this._domEventResizeTouchStart = this._onResizeTouchStart.bind(this);
        this._domEventResizeTouchMove = this._onResizeTouchMove.bind(this);
        this._domEventResizeTouchEnd = this._onResizeTouchEnd.bind(this);
        this._resizeTouchId = null;
        this._resizeData = null;
        this._resizeHorizontally = true;

        this.resizable = args.resizable || null;
        this._resizeMin = 100;
        this._resizeMax = 300;

        if (args.resizeMin !== undefined) {
            this.resizeMin = args.resizeMin;
        }
        if (args.resizeMax !== undefined) {
            this.resizeMax = args.resizeMax;
        }
    }

    Container.prototype = Object.create(pcui.Element.prototype);
    utils.mixin(Container.prototype, pcui.IContainer.prototype);
    utils.mixin(Container.prototype, pcui.IFlex.prototype);
    utils.mixin(Container.prototype, pcui.IGrid.prototype);
    utils.mixin(Container.prototype, pcui.IScrollable.prototype);
    utils.mixin(Container.prototype, pcui.IResizable.prototype);
    Container.prototype.constructor = Container;

    /**
     * @name pcui.Container#append
     * @description Appends an element to the container.
     * @param {pcui.Element} element The element to append.
     * @fires 'append'
     */
    Container.prototype.append = function (element) {
        var dom = this._getDomFromElement(element);
        this._domContent.appendChild(dom);
        this._onAppendChild(element);
    };

    /**
     * @name pcui.Container#appendBefore
     * @description Appends an element to the container before the specified reference element.
     * @param {pcui.Element} element The element to append.
     * @param {pcui.Element} referenceElement The element before which the element will be appended.
     * @fires 'append'
     */
    Container.prototype.appendBefore = function (element, referenceElement) {
        var dom = this._getDomFromElement(element);
        this._domContent.appendChild(dom);
        var referenceDom =  referenceElement && this._getDomFromElement(referenceElement);

        if ((referenceDom)) {
            this._domContent.insertBefore(dom, referenceDom);
        } else {
            this._domContent.appendChild(dom);
        }

        this._onAppendChild(element);
    };

    /**
     * @name pcui.Container#appendAfter
     * @description Appends an element to the container just after the specified reference element.
     * @param {pcui.Element} element The element to append.
     * @param {pcui.Element} referenceElement The element after which the element will be appended.
     * @fires 'append'
     */
    Container.prototype.appendAfter = function (element, referenceElement) {
        var dom = this._getDomFromElement(element);
        var referenceDom = referenceElement && this._getDomFromElement(referenceElement);

        var elementBefore = referenceDom ? referenceDom.nextSibling : null;
        if (elementBefore) {
            this._domContent.insertBefore(dom, elementBefore);
        } else {
            this._domContent.appendChild(dom);
        }

        this._onAppendChild(element);
    };

    /**
     * @name pcui.Container#prepend
     * @description Inserts an element in the beginning of the container.
     * @param {pcui.Element} element The element to prepend.
     * @fires 'append'
     */
    Container.prototype.prepend = function (element) {
        var dom = this._getDomFromElement(element);
        var first = this._domContent.firstChild;
        if (first) {
            this._domContent.insertBefore(dom, first);
        } else {
            this._domContent.appendChild(dom);
        }

        this._onAppendChild(element);
    };

    /**
     * @name pcui.Container#remove
     * @description Removes the specified child element from the container.
     * @param {pcui.Element} element The element to remove.
     * @fires 'remove'
     */
    Container.prototype.remove = function (element) {
        if (element.parent !== this) return;

        var dom = this._getDomFromElement(element);
        this._domContent.removeChild(dom);
        element.parent = null;
        this.emit('remove', element);
    };

    /**
     * @name pcui.Container#clear
     * @description Clears all children from the container.
     * @fires 'remove' for each child element.
     */
    Container.prototype.clear = function () {
        var i = this._domContent.childNodes.length;
        while (i--) {
            var node = this._domContent.childNodes[i];
            if (node.ui) {
                node.ui.destroy();
            }
        }

        this._domContent.innerHTML = '';
    };

    // Used for backwards compatibility with the legacy ui framework
    Container.prototype._getDomFromElement = function (element) {
        if (element.dom) {
            return element.dom;
        }

        if (element.element) {
            // console.log('Legacy ui.Element passed to pcui.Container', this.class, element.class);
            return element.element;
        }

        return element;
    };

    Container.prototype._onAppendChild = function (element) {
        element.parent = this;
        this.emit('append', element);
    };

    Container.prototype._onScroll = function (evt) {
        this.emit('scroll', evt);
    };

    Container.prototype._createResizeHandle = function () {
        var handle = document.createElement('div');
        handle.classList.add('pcui-resizable-handle');
        handle.ui = this;

        handle.addEventListener('mousedown', this._domEventResizeStart);
        handle.addEventListener('touchstart', this._domEventResizeTouchStart);

        this._domResizeHandle = handle;
    };

    Container.prototype._onResizeStart = function (evt) {
        evt.preventDefault();
        evt.stopPropagation();

        window.addEventListener('mousemove', this._domEventResizeMove);
        window.addEventListener('mouseup', this._domEventResizeEnd);

        this._resizeStart();
    };

    Container.prototype._onResizeMove = function (evt) {
        evt.preventDefault();
        evt.stopPropagation();

        this._resizeMove(evt.clientX, evt.clientY);
    };

    Container.prototype._onResizeEnd = function (evt) {
        evt.preventDefault();
        evt.stopPropagation();

        window.removeEventListener('mousemove', this._domEventResizeMove);
        window.removeEventListener('mouseup', this._domEventResizeEnd);

        this._resizeEnd();
    };

    Container.prototype._onResizeTouchStart = function (evt) {
        evt.preventDefault();
        evt.stopPropagation();

        for (var i = 0; i < evt.changedTouches.length; i++) {
            var touch = evt.changedTouches[i];
            if (touch.target === this._domResizeHandle) {
                this._resizeTouchId = touch.identifier;
            }
        }

        window.addEventListener('touchmove', this._domEventResizeTouchMove);
        window.addEventListener('touchend', this._domEventResizeTouchEnd);

        this._resizeStart();
    };

    Container.prototype._onResizeTouchMove = function (evt) {
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var touch = evt.changedTouches[i];
            if (touch.identifier !== this._resizeTouchId) {
                continue;
            }

            evt.stopPropagation();
            evt.preventDefault();

            this._resizeMove(touch.clientX, touch.clientY);

            break;
        }
    };

    Container.prototype._onResizeTouchEnd = function (evt) {
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var touch = evt.changedTouches[i];
            if (touch.identifier === this._resizeTouchId) {
                continue;
            }

            this._resizeTouchId = null;

            evt.preventDefault();
            evt.stopPropagation();

            window.removeEventListener('touchmove', this._domEventResizeTouchMove);
            window.removeEventListener('touchend', this._domEventResizeTouchEnd);

            this._resizeEnd();

            break;
        }
    };

    Container.prototype._resizeStart = function () {
        this.class.add('pcui-resizable-resizing');
    };

    Container.prototype._resizeMove = function (x, y) {
        // if we haven't initialized resizeData do so now
        if (!this._resizeData) {
            this._resizeData = {
                x: x,
                y: y,
                width: this.dom.clientWidth,
                height: this.dom.clientHeight
            };

            return;
        }

        if (this._resizeHorizontally) {
            // horizontal resizing
            var offsetX = this._resizeData.x - x;

            if (this._resizable === 'right') {
                offsetX = -offsetX;
            }

            this.width = RESIZE_HANDLE_SIZE + Math.max(this._resizeMin, Math.min(this._resizeMax, (this._resizeData.width + offsetX)));
        } else {
            // vertical resizing
            var offsetY = this._resizeData.y - y;

            if (this._resizable === 'bottom') {
                offsetY = -offsetY;
            }

            this.height = Math.max(this._resizeMin, Math.min(this._resizeMax, (this._resizeData.height + offsetY)));
        }

        this.emit('resize');
    };

    Container.prototype._resizeEnd = function () {
        this._resizeData = null;
        this.class.remove('pcui-resizable-resizing');
    };

    Container.prototype.destroy = function () {
        this.domContent = null;

        if (this._domResizeHandle) {
            this._domResizeHandle.removeEventListener('mousedown', this._domEventResizeStart);
            window.removeEventListener('mousemove', this._domEventResizeMove);
            window.removeEventListener('mouseup', this._domEventResizeEnd);

            this._domResizeHandle.removeEventListener('touchstart', this._domEventResizeTouchStart);
            window.removeEventListener('touchmove', this._domEventResizeTouchMove);
            window.removeEventListener('touchend', this._domEventResizeTouchEnd);
        }

        this._domResizeHandle = null;
        this._domEventResizeStart = null;
        this._domEventResizeMove = null;
        this._domEventResizeEnd = null;
        this._domEventResizeTouchStart = null;
        this._domEventResizeTouchMove = null;
        this._domEventResizeTouchEnd = null;

        pcui.Element.prototype.destroy.call(this);
    };

    Object.defineProperty(Container.prototype, 'flex', {
        get: function () {
            return this._flex;
        },
        set: function (value) {
            if (value === this._flex) return;

            this._flex = value;

            if (value) {
                this.class.add('pcui-flex');
            } else {
                this.class.remove('pcui-flex');
            }
        }
    });

    Object.defineProperty(Container.prototype, 'grid', {
        get: function () {
            return this._grid;
        },
        set: function (value) {
            if (value === this._grid) return;

            this._grid = value;

            if (value) {
                this.class.add('pcui-grid');
            } else {
                this.class.remove('pcui-grid');
            }
        }
    });

    Object.defineProperty(Container.prototype, 'scrollable', {
        get: function () {
            return this._scrollable;
        },
        set: function (value) {
            if (this._scrollable === value) return;

            this._scrollable = value;

            if (value) {
                this.class.add('pcui-scrollable');
            } else {
                this.class.remove('pcui-scrollable');
            }

        }
    });

    Object.defineProperty(Container.prototype, 'resizable', {
        get: function () {
            return this._resizable;
        },
        set: function (value) {
            if (value === this._resizable) return;

            if (VALID_RESIZABLE_VALUES.indexOf(value) === -1) {
                console.error('Invalid resizable value: must be one of ' + VALID_RESIZABLE_VALUES.join(','));
                return;
            }

            // remove old class
            if (this._resizable) {
                this.class.remove('pcui-resizable-' + this._resizable);
            }

            this._resizable = value;
            this._resizeHorizontally = (value === 'right' || value === 'left');

            if (value) {
                // add resize class and create / append resize handle
                this.class.add('pcui-resizable');
                this.class.add('pcui-resizable-' + value);

                if (!this._domResizeHandle) {
                    this._createResizeHandle();
                }
                this._dom.appendChild(this._domResizeHandle);
            } else {
                // remove resize class and resize handle
                this.class.remove('pcui-resizable');
                if (this._domResizeHandle) {
                    this._dom.removeChild(this._domResizeHandle);
                }
            }

        }
    });

    Object.defineProperty(Container.prototype, 'resizeMin', {
        get: function () {
            return this._resizeMin;
        },
        set: function (value) {
            this._resizeMin = Math.max(0, Math.min(value, this._resizeMax));
        }
    });

    Object.defineProperty(Container.prototype, 'resizeMax', {
        get: function () {
            return this._resizeMax;
        },
        set: function (value) {
            this._resizeMax = Math.max(this._resizeMin, value);
        }
    });

    // The internal dom element used as a the container of all children.
    // Can be overriden by derived classes
    Object.defineProperty(Container.prototype, 'domContent', {
        get: function () {
            return this._domContent;
        },
        set: function (value) {
            if (this._domContent === value) return;

            if (this._domContent) {
                this._domContent.removeEventListener('scroll', this._domEventScroll);
            }

            this._domContent = value;

            if (this._domContent) {
                this._domContent.addEventListener('scroll', this._domEventScroll);
            }
        }
    });

    return {
        Container: Container
    };
})());
