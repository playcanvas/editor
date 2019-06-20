Object.assign(pcui, (function () {
    'use strict';

    // TODO: document panelType

    /**
     * @event
     * @name pcui.Panel#collapse
     * @description Fired when the panel gets collapsed
     */

    /**
     * @event
     * @name pcui.Panel#expand
     * @description Fired when the panel gets expanded
     */

    /**
     * @name pcui.Panel
     * @classdesc The Panel is a pcui.Container that itself contains a header container and a content container. The
     * respective pcui.Container functions work using the content container. One can also append elements to the header of the Panel.
     * @param {Object} args The arguments. Extends the pcui.Container constructor arguments. All settable properties can also be set through the constructor.
     * @property {Boolean} flex Gets / sets whether the container supports flex layout. Defaults to false. Cannot co-exist with grid.
     * @property {Boolean} grid Gets / sets whether the container supports grid layout. Defaults to false. Cannot co-exist with flex.
     * @property {Boolean} collapsible Gets / sets whether the panel can be collapsed by clicking on its header or by setting collapsed to true. Defaults to false.
     * @property {Boolean} collapsed Gets / sets whether the panel is collapsed or expanded. Defaults to false.
     * @property {Boolean} collapseHorizontally Gets / sets whether the panel collapses horizontally - this would be the case for side panels. Defaults to false.
     * @property {Number} headerSize The height of the header in pixels. Defaults to 32.
     * @property {String} headerText The header text of the panel. Defaults to the empty string.
     * @property {pcui.Container} header Gets the header conttainer.
     * @property {pcui.Container} content Gets the content conttainer.
     * @extends pcui.Element
     * @mixes pcui.IContainer
     * @mixes pcui.IFlex
     * @mixes pcui.IGrid
     * @mixes pcui.IScrollable
     * @mixes pcui.IResizable
     */
    function Panel(args) {
        if (!args) args = {};

        var panelArgs = Object.assign({}, args);
        panelArgs.flex = true;
        delete panelArgs.flexDirection;
        delete panelArgs.scrollable;

        pcui.Container.call(this, panelArgs);
        pcui.ICollapsible.call(this);

        this.class.add('pcui-panel');

        if (args.panelType) {
            this.class.add('pcui-panel-' + args.panelType);
        }

        // do not call reflow on every update while
        // we are initializing
        this._suspendReflow = true;

        // initialize header container
        this._initializeHeader(args);

        // initialize content container
        this._initializeContent(args);

        // event handlers
        this._evtAppend = null;
        this._evtRemove = null;

        // header size
        this.headerSize = args.headerSize !== undefined ? args.headerSize : 32;

        // collapse related
        this._reflowTimeout = null;
        this._widthBeforeCollapse = null;
        this._heightBeforeCollapse = null;

        // if we initialize the panel collapsed
        // then use the width / height passed in the arguments
        // as the size to expand to
        if (args.collapsed) {
            if (args.width) {
                this._widthBeforeCollapse = args.width;
            }
            if (args.height) {
                this._heightBeforeCollapse = args.height;
            }
        }

        this.collapsible = args.collapsible || false;
        this.collapsed = args.collapsed || false;
        this.collapseHorizontally = args.collapseHorizontally || false;

        // set the contents container to be the content DOM element
        // from now on calling append functions on the panel will append themn
        // elements to the contents container
        this.domContent = this._containerContent.dom;

        // execute reflow now after all fields have been initialized
        this._suspendReflow = false;
        this._reflow();
    }

    Panel.prototype = Object.create(pcui.Container.prototype);
    utils.mixin(Panel.prototype, pcui.ICollapsible.prototype);
    Panel.prototype.constructor = Panel;

    Panel.prototype._initializeHeader = function (args) {
        // header container
        this._containerHeader = new pcui.Container({
            flex: true,
            flexDirection: 'row'
        });
        this._containerHeader.class.add('pcui-panel-header');

        // header title
        this._domHeaderTitle = document.createElement('span');
        this._domHeaderTitle.textContent = args.headerText || '';
        this._domHeaderTitle.classList.add('pcui-panel-header-title');
        this._domHeaderTitle.ui = this._containerHeader;
        this._containerHeader.dom.appendChild(this._domHeaderTitle);

        // use native click listener because the pcui.Element#click event is only fired
        // if the element is enabled. However we still want to catch header click events in order
        // to collapse them
        this._containerHeader.dom.addEventListener('click', this._onHeaderClick.bind(this));

        this.append(this._containerHeader);
    };

    Panel.prototype._onHeaderClick = function (evt) {
        if (!this._collapsible) return;
        if (evt.target !== this.header.dom && evt.target !== this._domHeaderTitle) return;

        // toggle collapsed
        this.collapsed = !this.collapsed;
    };

    Panel.prototype._initializeContent = function (args) {
        // containers container
        this._containerContent = new pcui.Container({
            flex: args.flex,
            flexDirection: args.flexDirection,
            scrollable: args.scrollable
        });
        this._containerContent.class.add('pcui-panel-content');

        this.append(this._containerContent, this._containerHeader);
    };

    Panel.prototype._onChildrenChange = function () {
        if (!this.collapsible || this.collapsed || this._collapseHorizontally || this.hidden) {
            return;
        }

        this.height = this.headerSize + this._containerContent.dom.clientHeight;
    };

    // Collapses or expands the panel as needed
    Panel.prototype._reflow = function () {
        if (this._suspendReflow) {
            return;
        }

        if (this._reflowTimeout) {
            cancelAnimationFrame(this._reflowTimeout);
            this._reflowTimeout = null;
        }

        if (this.hidden || !this.collapsible) return;

        if (this.collapsed && this.collapseHorizontally) {
            this._containerHeader.style.top = -this.headerSize + 'px';
        } else {
            this._containerHeader.style.top = '';
        }

        // we rely on the content width / height and we have to
        // wait for 1 frame before we can get the final values back
        this._reflowTimeout = requestAnimationFrame(function () {
            this._reflowTimeout = null;

            if (this.collapsed) {
                // remember size before collapse
                if (!this._widthBeforeCollapse) {
                    this._widthBeforeCollapse = this.dom.clientWidth;
                }
                if (!this._heightBeforeCollapse) {
                    this._heightBeforeCollapse = this.dom.clientHeight;
                }

                if (this._collapseHorizontally) {
                    this.height = '';
                    this.width = this.headerSize;
                } else {
                    this.height = this.headerSize;
                }
            } else {
                if (this._collapseHorizontally) {
                    this.height = '';
                    if (this._widthBeforeCollapse !== null) {
                        this.width = this._widthBeforeCollapse;
                    }
                } else {
                    if (this._heightBeforeCollapse !== null) {
                        this.height = this._heightBeforeCollapse;
                    }
                }

                // reset before collapse vars
                this._widthBeforeCollapse = null;
                this._heightBeforeCollapse = null;
            }
        }.bind(this));
    };

    Panel.prototype.destroy = function () {
        if (this._reflowTimeout) {
            cancelAnimationFrame(this._reflowTimeout);
            this._reflowTimeout = null;
        }

        ui.Container.prototype.destroy.call(this);
    };

    Object.defineProperty(Panel.prototype, 'collapsible', {
        get: function () {
            return this._collapsible;
        },
        set: function (value) {
            if (value === this._collapsible) return;

            this._collapsible = value;

            if (this._evtAppend) {
                this._evtAppend.unbind();
                this._evtAppend = null;
            }

            if (this._evtRemove) {
                this._evtRemove.unbind();
                this._evtRemove = null;
            }

            if (value) {
                // listen to append / remove events so we can change our height
                var onChange = this._onChildrenChange.bind(this);
                this._evtAppend = this._containerContent.on('append', onChange);
                this._evtRemove = this._containerContent.on('remove', onChange);

                this.class.add('pcui-collapsible');
            } else {
                this.class.remove('pcui-collapsible');
            }

            this._reflow();

            if (this.collapsed) {
                this.emit(value ? 'collapse' : 'expand');
            }

        }
    });

    Object.defineProperty(Panel.prototype, 'collapsed', {
        get: function () {
            return this._collapsed;
        },
        set: function (value) {
            if (this._collapsed === value) return;

            this._collapsed = value;

            if (value) {
                this.class.add('pcui-collapsed');
            } else {
                this.class.remove('pcui-collapsed');
            }

            this._reflow();

            if (this.collapsible) {
                this.emit(value ? 'collapse' : 'expand');
            }
        }
    });

    Object.defineProperty(Panel.prototype, 'collapseHorizontally', {
        get: function () {
            return this._collapseHorizontally;
        },
        set: function (value) {
            if (this._collapseHorizontally === value) return;

            this._collapseHorizontally = value;
            if (value) {
                this.class.add('pcui-panel-horizontal');
            } else {
                this.class.remove('pcui-panel-horizontal');
            }

            this._reflow();
        }
    });

    Object.defineProperty(Panel.prototype, 'content', {
        get: function () {
            return this._containerContent;
        }
    });

    Object.defineProperty(Panel.prototype, 'header', {
        get: function () {
            return this._containerHeader;
        }
    });

    Object.defineProperty(Panel.prototype, 'headerText', {
        get: function () {
            return this._domHeaderTitle.textContent;
        },
        set: function (value) {
            this._domHeaderTitle.textContent = value;
        }
    });

    Object.defineProperty(Panel.prototype, 'headerSize', {
        get: function () {
            return this._headerSize;
        },
        set: function (value) {
            this._headerSize = value;
            var style = this._containerHeader.dom.style;
            style.height = Math.max(0, value) + 'px';
            style.lineHeight = style.height;
            this._reflow();
        }
    });

    return {
        Panel: Panel
    };
})());
