Object.assign(pcui, (function () {
    'use strict';

    // these are properties that are
    // available as Element properties and
    // can also be set through the Element constructor
    var SIMPLE_CSS_PROPERTIES = [
        'flexDirection',
        'flexGrow',
        'flexBasis',
        'flexShrink',
        'flexWrap',
        'alignItems',
        'justifyContent'
    ];

    // utility function to expose a CSS property
    // via an Element.prototype property
    function exposeCssProperty(name) {
        Object.defineProperty(Element.prototype, name, {
            get: function () {
                return this.style[name];
            },
            set: function (value) {
                this.style[name] = value;
            }
        });
    }

    /**
     * @event
     * @name pcui.Element#enable
     * @description Fired when the Element gets enabled
     */

    /**
     * @event
     * @name pcui.Element#disable
     * @description Fired when the Element gets disabled
     */

    /**
     * @event
     * @name pcui.Element#hide
     * @description Fired when the Element gets hidden
     */

    /**
     * @event
     * @name pcui.Element#show
     * @description Fired when the Element stops being hidden
     */

    /**
     * @event
     * @name pcui.Element#parent
     * @description Fired when the Element's parent gets set
     * @param {pcui.Element} parent The new parent
     */

    /**
     * @event
     * @name pcui.Element#click
     * @description Fired when the mouse is clicked on the Element but only if the Element is enabled.
     * @param {Event} evt The native mouse event.
     */

    /**
     * @event
     * @name pcui.Element#hover
     * @description Fired when the mouse starts hovering on the Element
     * @param {Event} evt The native mouse event.
     */

    /**
     * @event
     * @name pcui.Element#hoverend
     * @description Fired when the mouse stops hovering on the Element
     * @param {Event} evt The native mouse event.
     */

    /**
     * @name pcui.Element
     * @classdesc The base class for all UI elements.
     * @extends Events
     * @param {HTMLElement} dom The DOM element that this pcui.Element wraps.
     * @param {Object} args The arguments. All settable properties can also be set through the constructor.
     * @param {String} [args.id] The desired id for the Element HTML node.
     * @property {Boolean} enabled Gets / sets whether the Element or its parent chain is enabled or not. Defaults to true.
     * @property {HTMLElement} dom Gets the root DOM node for this Element.
     * @property {pcui.Element} parent Gets / sets the parent Element.
     * @property {Boolean} hidden Gets / sets whether the Element is hidden.
     * @property {Number} width Gets / sets the width of the Element in pixels. Can also be an empty string to remove it.
     * @property {Number} height Gets / sets the height of the Element in pixels. Can also be an empty string to remove it.
     * @property {class} parent Gets / sets the parent Element.
     * @property {CSSStyleDeclaration} style Shortcut to pcui.Element.dom.style.
     * @property {DOMTokenList} class Shortcut to pcui.Element.dom.classList.
     */
    function Element(dom, args) {
        Events.call(this);

        if (!args) args = {};

        this._destroyed = false;
        this._enabled = true;
        this._hidden = false;
        this._parent = null;

        this._domEventClick = this._onClick.bind(this);
        this._domEventMouseOver = this._onMouseOver.bind(this);
        this._domEventMouseOut = this._onMouseOut.bind(this);

        this._evtParentDestroy = null;
        this._evtParentDisable = null;
        this._evtParentEnable = null;

        this._dom = dom;

        if (args.id !== undefined) {
            this._dom.id = args.id;
        }

        // add ui reference
        this._dom.ui = this;

        // add event listeners
        this._dom.addEventListener('click', this._domEventClick);
        this._dom.addEventListener('mouseover', this._domEventMouseOver);
        this._dom.addEventListener('mouseout', this._domEventMouseOut);

        // add element class
        this._dom.classList.add('pcui-element');

        if (args.enabled !== undefined) {
            this.enabled = args.enabled;
        }
        if (args.hidden !== undefined) {
            this.hidden = args.hidden;
        }
        if (args.width !== undefined) {
            this.width = args.width;
        }
        if (args.height !== undefined) {
            this.height = args.height;
        }

        // copy CSS properties from args
        for (var key in args) {
            if (args[key] === undefined) continue;
            if (SIMPLE_CSS_PROPERTIES.indexOf(key) !== -1) {
                this[key] = args[key];
            }
        }
    }

    Element.prototype = Object.create(Events.prototype);
    Element.prototype.constructor = Element;

    Element.prototype.link = function (observer, path) {
        throw new Error('Not implemented');
    };

    Element.prototype.unlink = function () {
        throw new Error('Not implemented');
    };

    /**
     * @name pcui.Element#flash
     * @description Triggers a flash animation on the Element.
     */
    Element.prototype.flash = function () {
        this.class.add('flash');
        setTimeout(function () {
            this.class.remove('flash');
        }.bind(this), 200);
    };

    Element.prototype._onClick = function (evt) {
        if (this.enabled) {
            this.emit('click', evt);
        }
    };

    Element.prototype._onMouseOver = function (evt) {
        this.emit('hover', evt);
    };

    Element.prototype._onMouseOut = function (evt) {
        this.emit('hoverend', evt);
    };

    Element.prototype._onEnabledChange = function (enabled) {
        if (enabled) {
            this.class.remove('pcui-disabled');
        } else {
            this.class.add('pcui-disabled');
        }

        this.emit(enabled ? 'enable' : 'disable');
    };

    Element.prototype._onParentDestroy = function () {
        this.destroy();
    };

    Element.prototype._onParentDisable = function () {
        if (this._enabled) {
            this._onEnabledChange(false);
        }
    };

    Element.prototype._onParentEnable = function () {
        if (this._enabled) {
            this._onEnabledChange(true);
        }
    };

    /**
     * @name pcui.Element#destroy
     * @description Destroys the Element and its events.
     */
    Element.prototype.destroy = function () {
        if (this._destroyed) return;

        this._destroyed = true;

        if (this.parent) {
            this._parent = null;

            this._evtParentDestroy.unbind();
            this._evtParentDisable.unbind();
            this._evtParentEnable.unbind();
            this._evtParentDestroy = null;
            this._evtParentDisable = null;
            this._evtParentEnable = null;
        }

        if (this._dom) {
            if (this._dom && this._dom.parentElement) {
                this._dom.parentElement.removeChild(this._dom);
            }

            // remove event listeners
            this._dom.removeEventListener('click', this._domEventClick);
            this._dom.removeEventListener('mouseover', this._domEventMouseOver);
            this._dom.removeEventListener('mouseout', this._domEventMouseOut);

            // remove ui reference
            delete this._dom.ui;

            this._dom = null;
        }

        this._domEventClick = null;
        this._domEventMouseOver = null;
        this._domEventMouseOut = null;

        this.emit('destroy');

        this.unbind();
    };

    Object.defineProperty(Element.prototype, 'enabled', {
        get: function () {
            return this._enabled && (!this._parent || this._parent.enabled);
        },
        set: function (value) {
            if (this._enabled === value) return;

            // remember if enabled in hierarchy
            var enabled = this.enabled;

            this._enabled = value;

            // only fire event if hierarchy state changed
            if (enabled !== value) {
                this._onEnabledChange(value);
            }
        }
    });

    Object.defineProperty(Element.prototype, 'dom', {
        get: function () {
            return this._dom;
        }
    });

    Object.defineProperty(Element.prototype, 'parent', {
        get: function () {
            return this._parent;
        },
        set: function (value) {
            if (value === this._parent) return;

            var oldEnabled = this.enabled;

            if (this._parent) {
                this._evtParentDestroy.unbind();
                this._evtParentDisable.unbind();
                this._evtParentEnable.unbind();
            }

            this._parent = value;

            if (this._parent) {
                this._evtParentDestroy = this._parent.once('destroy', this._onParentDestroy.bind(this));
                this._evtParentDisable = this._parent.on('disable', this._onParentDisable.bind(this));
                this._evtParentEnable = this._parent.on('enable', this._onParentEnable.bind(this));
            }

            this.emit('parent', this._parent);

            var newEnabled = this.enabled;
            if (newEnabled !== oldEnabled) {
                this._onEnabledChange(newEnabled);
            }
        }
    });

    Object.defineProperty(Element.prototype, 'hidden', {
        get: function () {
            return this._hidden;
        },
        set: function (value) {
            if (value === this._hidden) return;

            this._hidden = value;

            if (value) {
                this.class.add('pcui-hidden');
            } else {
                this.class.remove('pcui-hidden');
            }

            this.emit(value ? 'hide' : 'show');
        }
    });

    Object.defineProperty(Element.prototype, 'style', {
        get: function () {
            return this._dom.style;
        }
    });

    Object.defineProperty(Element.prototype, 'class', {
        get: function () {
            return this._dom.classList;
        }
    });

    Object.defineProperty(Element.prototype, 'width', {
        get: function () {
            return this._dom.clientWidth;
        },
        set: function (value) {
            if (typeof value === 'number') {
                value += 'px';
            }
            this.style.width = value;
        }
    });

    Object.defineProperty(Element.prototype, 'height', {
        get: function () {
            return this._dom.clientHeight;
        },
        set: function (value) {
            if (typeof value === 'number') {
                value += 'px';
            }
            this.style.height = value;
        }
    });

    // expose rest of CSS properties
    SIMPLE_CSS_PROPERTIES.forEach(exposeCssProperty);

    // ******************************************************************************************
    /*  Backwards Compatibility */
    // we should remove those after we migrate
    Object.defineProperty(Element.prototype, 'disabled', {
        get: function () {
            return !this.enabled;
        },
        set: function (value) {
            this.enabled = !value;
        }
    });

    Object.defineProperty(Element.prototype, 'element', {
        get: function () {
            return this.dom;
        },
        set: function (value) {
            this.dom = value;
        }
    });

    Object.defineProperty(Element.prototype, 'innerElement', {
        get: function () {
            return this.domContent;
        },
        set: function (value) {
            this.domContent = value;
        }
    });

    return {
        Element: Element
    };
})());
