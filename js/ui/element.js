import { Events } from '@playcanvas/observer';

Object.assign(ui, (function () {
    function Element() {
        window.assignEvents(this);

        this._parent = null;
        var self = this;
        this._parentDestroy = function () {
            self.destroy();
        };

        this._destroyed = false;
        this._element = null;
        this._link = null;
        this.path = '';
        this._linkSet = null;
        this._linkUnset = null;
        this.renderChanges = null;
        // render changes only from next ticks
        setTimeout(function () {
            if (self.renderChanges === null)
                self.renderChanges = true;
        }, 0);

        this.disabledClick = false;
        this._disabled = false;
        this._disabledParent = false;

        this._evtClick = null;

        this._parentDisable = function () {
            if (self._disabledParent)
                return;

            self._disabledParent = true;

            if (!self._disabled) {
                self.emit('disable');
                self.class.add('disabled');
            }
        };
        this._parentEnable = function () {
            if (!self._disabledParent)
                return;

            self._disabledParent = false;

            if (!self._disabled) {
                self.emit('enable');
                self.class.remove('disabled');
            }
        };

        this._onFlashDelay = function () {
            self.class.remove('flash');
        };
    }
    Element.prototype = Object.create(Events.prototype);

    Element.prototype.link = function (link, path) {
        var self = this;

        if (this._link) this.unlink();
        this._link = link;
        this.path = path;

        this.emit('link', path);

        // add :set link
        if (this._onLinkChange) {
            var renderChanges = this.renderChanges;
            this.renderChanges = false;
            this._linkOnSet = this._link.on(this.path + ':set', function (value) {
                self._onLinkChange(value);
            });
            this._linkOnUnset = this._link.on(this.path + ':unset', function (value) {
                self._onLinkChange(value);
            });
            this._onLinkChange(this._link.get(this.path));
            this.renderChanges = renderChanges;
        }
    };

    Element.prototype.unlink = function () {
        if (!this._link) return;

        this.emit('unlink', this.path);

        // remove :set link
        if (this._linkOnSet) {
            this._linkOnSet.unbind();
            this._linkOnSet = null;

            this._linkOnUnset.unbind();
            this._linkOnUnset = null;
        }

        this._link = null;
        this.path = '';
    };

    Element.prototype.destroy = function () {
        if (this._destroyed)
            return;

        this._destroyed = true;

        if (this._parent) {
            this._evtParentDestroy.unbind();
            this._evtParentDisable.unbind();
            this._evtParentEnable.unbind();
            this._parent = null;
        }

        if (this._element.parentNode)
            this._element.parentNode.removeChild(this._element);

        this.unlink();

        this.emit('destroy');

        this.unbind();
    };

    Object.defineProperty(Element.prototype, 'element', {
        get: function () {
            return this._element;
        },
        set: function (value) {
            if (this._element)
                return;

            this._element = value;
            this._element.ui = this;

            var self = this;
            this._evtClick = function (evt) {
                if (self.disabled && !self.disabledClick) return;
                self.emit('click', evt);
            };
            this._element.addEventListener('click', this._evtClick, false);

            this._evtHover = function (evt) {
                self.emit('hover', evt);
            };
            this._element.addEventListener('mouseover', this._evtHover, false);

            this._evtBlur = function (evt) {
                self.emit('blur', evt);
            };
            this._element.addEventListener('mouseout', this._evtBlur, false);

            if (!this.innerElement)
                this.innerElement = this._element;
        }
    });

    Object.defineProperty(Element.prototype, 'parent', {
        get: function () {
            return this._parent;
        },
        set: function (value) {
            if (this._parent) {
                this._parent = null;
                this._evtParentDestroy.unbind();
                this._evtParentDisable.unbind();
                this._evtParentEnable.unbind();
            }

            if (value) {
                this._parent = value;
                this._evtParentDestroy = this._parent.once('destroy', this._parentDestroy);
                this._evtParentDisable = this._parent.on('disable', this._parentDisable);
                this._evtParentEnable = this._parent.on('enable', this._parentEnable);

                if (this._disabledParent !== this._parent.disabled) {
                    this._disabledParent = this._parent.disabled;

                    if (this._disabledParent) {
                        this.class.add('disabled');
                        this.emit('disable');
                    } else {
                        this.class.remove('disabled');
                        this.emit('enable');
                    }
                }
            }

            this.emit('parent');
        }
    });

    Object.defineProperty(Element.prototype, 'disabled', {
        get: function () {
            return this._disabled || this._disabledParent;
        },
        set: function (value) {
            if (this._disabled === value)
                return;

            this._disabled = !!value;
            this.emit((this._disabled || this._disabledParent) ? 'disable' : 'enable');

            if ((this._disabled || this._disabledParent)) {
                this.class.add('disabled');
            } else {
                this.class.remove('disabled');
            }
        }
    });

    Object.defineProperty(Element.prototype, 'disabledSelf', {
        get: function () {
            return this._disabled;
        }
    });

    Object.defineProperty(Element.prototype, 'enabled', {
        get: function () {
            return !this._disabled;
        },
        set: function (value) {
            this.disabled = !value;
        }
    });

    Object.defineProperty(Element.prototype, 'value', {
        get: function () {
            if (!this._link) return null;
            return this._link.get(this.path);
        },
        set: function (value) {
            if (!this._link) return;
            this._link.set(this.path, value);
        }
    });


    Object.defineProperty(Element.prototype, 'hidden', {
        get: function () {
            return this._element.classList.contains('hidden');
        },
        set: function (value) {
            if (this._element.classList.contains('hidden') === !!value)
                return;

            if (value) {
                this._element.classList.add('hidden');
                this.emit('hide');
            } else {
                this._element.classList.remove('hidden');
                this.emit('show');
            }
        }
    });


    Object.defineProperty(Element.prototype, 'style', {
        get: function () {
            return this._element.style;
        }
    });


    Object.defineProperty(Element.prototype, 'class', {
        get: function () {
            return this._element.classList;
        }
    });


    Object.defineProperty(Element.prototype, 'flexGrow', {
        get: function () {
            return this._element.style.flexGrow;
        },
        set: function (value) {
            this._element.style.flexGrow = value;
            this._element.style.WebkitFlexGrow = value;
        }
    });


    Object.defineProperty(Element.prototype, 'flexShrink', {
        get: function () {
            return this._element.style.flexShrink;
        },
        set: function (value) {
            this._element.style.flexShrink = value;
            this._element.style.WebkitFlexShrink = value;
        }
    });


    Element.prototype.flash = function () {
        this.class.add('flash');
        setTimeout(this._onFlashDelay, 200);
    };

    // compatibility with pcui
    Object.defineProperty(Element.prototype, 'dom', {
        get: function () {
            return this._element;
        }
    });

    return {
        Element: Element
    };

})());
