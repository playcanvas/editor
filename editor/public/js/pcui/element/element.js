Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ELEMENT = 'pcui-element';

    // these are properties that are
    // available as Element properties and
    // can also be set through the Element constructor
    const SIMPLE_CSS_PROPERTIES = [
        'flexDirection',
        'flexGrow',
        'flexBasis',
        'flexShrink',
        'flexWrap',
        'alignItems',
        'alignSelf',
        'justifyContent',
        'justifySelf'
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

    // Stores Element types by name and default arguments
    const ELEMENT_REGISTRY = {};

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
     * @name pcui.Element#readOnly
     * @param {Boolean} readOnly Whether the Element is now read only
     * @description Fired when the readOnly property of an Element changes
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
     * @property {Boolean} enabled Gets / sets whether the Element or its parent chain is enabled or not. Defaults to true.
     * @property {HTMLElement} dom Gets the root DOM node for this Element.
     * @property {pcui.Element} parent Gets the parent Element.
     * @property {Boolean} hidden Gets / sets whether the Element is hidden.
     * @property {Boolean} readOnly Gets / sets whether the Element is read only.
     * @property {Boolean} ignoreParent Gets / sets whether the Element will ignore parent events & variable states.
     * @property {Number} width Gets / sets the width of the Element in pixels. Can also be an empty string to remove it.
     * @property {Number} height Gets / sets the height of the Element in pixels. Can also be an empty string to remove it.
     * @property {Number} tabIndex Gets / sets the tabIndex of the Element.
     * @property {Boolean} error Gets / sets whether the Element is in an error state.
     * @property {pcui.BindingBase} binding Gets / sets the Binding object for the element.
     * @property {CSSStyleDeclaration} style Shortcut to pcui.Element.dom.style.
     * @property {DOMTokenList} class Shortcut to pcui.Element.dom.classList.
     */
    class Element extends Events {
        /**
         * Creates a new Element.
         * @param {HTMLElement} dom The DOM element that this pcui.Element wraps.
         * @param {Object} args The arguments. All settable properties can also be set through the constructor.
         * @param {String} [args.id] The desired id for the Element HTML node.
         * @param {String|String[]} [args.class] The CSS class or classes we want to add to the element.
         */
        constructor(dom, args) {
            super();

            if (!args) args = {};

            this._destroyed = false;
            this._parent = null;

            this._domEventClick = this._onClick.bind(this);
            this._domEventMouseOver = this._onMouseOver.bind(this);
            this._domEventMouseOut = this._onMouseOut.bind(this);
            this._eventsParent = [];

            this._dom = dom || document.createElement('div');

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
            this._dom.classList.add(CLASS_ELEMENT);

            // add user classes
            if (args.class) {
                if (Array.isArray(args.class)) {
                    for (let i = 0; i < args.class.length; i++) {
                        this._dom.classList.add(args.class[i]);
                    }
                } else {
                    this._dom.classList.add(args.class);
                }
            }

            this.enabled = args.enabled !== undefined ? args.enabled : true;
            this.hidden = args.hidden || false;
            this.readOnly = args.readOnly || false;
            this.ignoreParent = args.ignoreParent || false;

            if (args.width !== undefined) {
                this.width = args.width;
            }
            if (args.height !== undefined) {
                this.height = args.height;
            }
            if (args.tabIndex !== undefined) {
                this.tabIndex = args.tabIndex;
            }

            // copy CSS properties from args
            for (const key in args) {
                if (args[key] === undefined) continue;
                if (SIMPLE_CSS_PROPERTIES.indexOf(key) !== -1) {
                    this[key] = args[key];
                }
            }

            // set the binding object
            if (args.binding) {
                this.binding = args.binding;
            }

            this._flashTimeout = null;
        }

        /**
         * @name pcui.Element#link
         * @description Links the specified observers and paths to the Element's data binding.
         * @param {Observer|Observer[]} observers An array of observers or a single observer.
         * @param {String|String[]} paths A path for the observer(s) or an array of paths that maps to each separate observer.
         */
        link(observers, paths) {
            this._binding.link(observers, paths);
        }


        /**
         * @name pcui.Element#unlink
         * @description Unlinks the Element from its observers
         */
        unlink() {
            if (this._binding) {
                this._binding.unlink();
            }
        }

        /**
         * @name pcui.Element#flash
         * @description Triggers a flash animation on the Element.
         */
        flash() {
            if (this._flashTimeout) return;

            this.class.add(pcui.CLASS_FLASH);
            this._flashTimeout = setTimeout(function () {
                this._flashTimeout = null;
                this.class.remove(pcui.CLASS_FLASH);
            }.bind(this), 200);
        }

        _onClick(evt) {
            if (this.enabled) {
                this.emit('click', evt);
            }
        }

        _onMouseOver(evt) {
            this.emit('hover', evt);
        }

        _onMouseOut(evt) {
            this.emit('hoverend', evt);
        }

        _onEnabledChange(enabled) {
            if (enabled) {
                this.class.remove(pcui.CLASS_DISABLED);
            } else {
                this.class.add(pcui.CLASS_DISABLED);
            }

            this.emit(enabled ? 'enable' : 'disable');
        }

        _onParentDestroy() {
            this.destroy();
        }

        _onParentDisable() {
            if (this._ignoreParent) return;
            if (this._enabled) {
                this._onEnabledChange(false);
            }
        }

        _onParentEnable() {
            if (this._ignoreParent) return;
            if (this._enabled) {
                this._onEnabledChange(true);
            }
        }

        _onReadOnlyChange(readOnly) {
            if (readOnly) {
                this.class.add(pcui.CLASS_READONLY);
            } else {
                this.class.remove(pcui.CLASS_READONLY);
            }

            this.emit('readOnly', readOnly);
        }

        _onParentReadOnlyChange(readOnly) {
            if (this._ignoreParent) return;
            if (readOnly) {
                if (!this._readOnly) {
                    this._onReadOnlyChange(true);
                }
            } else {
                if (!this._readOnly) {
                    this._onReadOnlyChange(false);
                }
            }

        }

        /**
         * @name pcui.Element#destroy
         * @description Destroys the Element and its events.
         */
        destroy() {
            if (this._destroyed) return;

            this._destroyed = true;

            if (this.binding) {
                this.binding = null;
            } else {
                this.unlink();
            }

            if (this.parent) {
                const parent = this.parent;

                for (let i = 0; i < this._eventsParent.length; i++) {
                    this._eventsParent[i].unbind();
                }
                this._eventsParent.length = 0;


                // remove element from parent
                // check if parent has been destroyed already
                // because we do not want to be emitting events
                // on a destroyed parent after it's been destroyed
                // as it is easy to lead to null exceptions
                if (parent.remove && !parent._destroyed) {
                    parent.remove(this);
                }

                // set parent to null and remove from
                // parent dom just in case parent.remove above
                // didn't work because of an override or other condition
                this._parent = null;

                if (this._dom && this._dom.parentElement) {
                    this._dom.parentElement.removeChild(this._dom);
                }

            }

            if (this._dom) {
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

            if (this._flashTimeout) {
                clearTimeout(this._flashTimeout);
            }

            this.emit('destroy');

            this.unbind();
        }

        /**
         * @static
         * Registers a new Element type
         * @param {String} type The type we want to reference this Element by
         * @param {Object} cls The actual class of the Element
         * @param {Object} [defaultArguments] Default arguments when creating this type
         */
        static register(type, cls, defaultArguments) {
            ELEMENT_REGISTRY[type] = { cls, defaultArguments };
        }

        /**
         * @static
         * Unregisters the specified Element type
         * @param {String} type The type we want to unregister
         */
        static unregister(type) {
            delete ELEMENT_REGISTRY[type];
        }

        /**
         * @static
         * Creates a new Element by type
         * @param {String} type The type of the Element (registered by pcui.Element#register)
         * @param {Object} args Arguments for the Element
         * @returns {pcui.Element} A new pcui.Element of the desired type
         */
        static create(type, args) {
            const entry = ELEMENT_REGISTRY[type];
            if (!entry) {
                console.error('Invalid type passed to pcui.Element#create', type);
                return;
            }

            const cls = entry.cls;
            const clsArgs = {};

            if (entry.defaultArguments) {
                Object.assign(clsArgs, entry.defaultArguments);
            }
            if (args) {
                Object.assign(clsArgs, args);
            }

            return new cls(clsArgs);
        }

        get enabled() {
            if (this._ignoreParent) return this._enabled;
            return this._enabled && (!this._parent || this._parent.enabled);
        }

        set enabled(value) {
            if (this._enabled === value) return;

            // remember if enabled in hierarchy
            const enabled = this.enabled;

            this._enabled = value;

            // only fire event if hierarchy state changed
            if (enabled !== value) {
                this._onEnabledChange(value);
            }
        }

        get ignoreParent() {
            return this._ignoreParent;
        }

        set ignoreParent(value) {
            this._ignoreParent = value;
            this._onEnabledChange(this.enabled);
            this._onReadOnlyChange(this.readOnly);
        }

        get dom() {
            return this._dom;
        }

        get parent() {
            return this._parent;
        }

        set parent(value) {
            if (value === this._parent) return;

            const oldEnabled = this.enabled;
            const oldReadonly = this.readOnly;

            if (this._parent) {
                for (let i = 0; i < this._eventsParent.length; i++) {
                    this._eventsParent[i].unbind();
                }
                this._eventsParent.length = 0;
            }

            this._parent = value;

            if (this._parent) {
                this._eventsParent.push(this._parent.once('destroy', this._onParentDestroy.bind(this)));
                this._eventsParent.push(this._parent.on('disable', this._onParentDisable.bind(this)));
                this._eventsParent.push(this._parent.on('enable', this._onParentEnable.bind(this)));
                this._eventsParent.push(this._parent.on('readOnly', this._onParentReadOnlyChange.bind(this)));
            }

            this.emit('parent', this._parent);

            const newEnabled = this.enabled;
            if (newEnabled !== oldEnabled) {
                this._onEnabledChange(newEnabled);
            }

            const newReadonly = this.readOnly;
            if (newReadonly !== oldReadonly) {
                this._onReadOnlyChange(newReadonly);
            }

        }

        get hidden() {
            return this._hidden;
        }

        set hidden(value) {
            if (value === this._hidden) return;

            this._hidden = value;

            if (value) {
                this.class.add(pcui.CLASS_HIDDEN);
            } else {
                this.class.remove(pcui.CLASS_HIDDEN);
            }

            this.emit(value ? 'hide' : 'show');
        }

        get readOnly() {
            if (this._ignoreParent) return this._readOnly;
            return this._readOnly || !!(this._parent && this._parent.readOnly);
        }

        set readOnly(value) {
            if (this._readOnly === value) return;
            this._readOnly = value;

            this._onReadOnlyChange(value);
        }

        get error() {
            return this._hasError;
        }

        set error(value) {
            if (this._hasError === value) return;
            this._hasError = value;
            if (value) {
                this.class.add(pcui.CLASS_ERROR);
            } else {
                this.class.remove(pcui.CLASS_ERROR);
            }
        }

        get style() {
            return this._dom.style;
        }

        get class() {
            return this._dom.classList;
        }

        get width() {
            return this._dom.clientWidth;
        }

        set width(value) {
            if (typeof value === 'number') {
                value += 'px';
            }
            this.style.width = value;
        }

        get height() {
            return this._dom.clientHeight;
        }

        set height(value) {
            if (typeof value === 'number') {
                value += 'px';
            }
            this.style.height = value;
        }

        get tabIndex() {
            return this._dom.tabIndex;
        }

        set tabIndex(value) {
            this._dom.tabIndex = value;
        }

        get binding() {
            return this._binding;
        }

        set binding(value) {
            if (this._binding === value) return;

            let prevObservers;
            let prevPaths;

            if (this._binding) {
                prevObservers = this._binding.observers;
                prevPaths = this._binding.paths;

                this.unlink();
                this._binding.element = null;
                this._binding = null;
            }

            this._binding = value;

            if (this._binding) {
                this._binding.element = this;
                if (prevObservers && prevPaths) {
                    this.link(prevObservers, prevPaths);
                }
            }
        }

        get destroyed() {
            return this._destroyed;
        }

        /*  Backwards Compatibility */
        // we should remove those after we migrate
        get disabled() {
            return !this.enabled;
        }

        set disabled(value) {
            this.enabled = !value;
        }

        get element() {
            return this.dom;
        }

        set element(value) {
            this.dom = value;
        }

        get innerElement() {
            return this.domContent;
        }

        set innerElement(value) {
            this.domContent = value;
        }
    }

    // expose rest of CSS properties
    SIMPLE_CSS_PROPERTIES.forEach(exposeCssProperty);

    return {
        Element: Element
    };
})());
