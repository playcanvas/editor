import { Events, type EventHandle, type Observer } from '@playcanvas/observer';

class LegacyElement extends Events {
    protected _parent: LegacyElement | null;

    protected _destroyed: boolean;

    protected _element: HTMLElement & { ui: any } | null;

    protected _link: Observer | null;

    protected _linkOnSet: EventHandle | null;

    protected _linkOnUnset: EventHandle | null;

    protected _disabled: boolean;

    protected _disabledParent: boolean;

    protected _evtClick: (evt: Event) => void | null;

    protected _evtHover: (evt: Event) => void | null;

    protected _evtBlur: (evt: Event) => void | null;

    protected _parentDestroy: () => void;

    protected _parentDisable: () => void;

    protected _parentEnable: () => void;

    protected _onFlashDelay: () => void;

    protected _evtParentDestroy: EventHandle | null;

    protected _evtParentDisable: EventHandle | null;

    protected _evtParentEnable: EventHandle | null;

    protected _onLinkChange: (value: any) => void;

    path: string;

    renderChanges: boolean | null;

    disabledClick: boolean;

    innerElement: HTMLElement & { ui: any } | null;

    constructor() {
        super();

        this._parent = null;
        this._destroyed = false;
        this._element = null;
        this._link = null;
        this._linkOnSet = null;
        this._linkOnUnset = null;
        this.path = '';
        this.renderChanges = null;
        this.disabledClick = false;
        this._disabled = false;
        this._disabledParent = false;
        this._evtClick = null;

        const self = this;
        this._parentDestroy = function () {
            self.destroy();
        };

        setTimeout(() => {
            if (self.renderChanges === null) {
                self.renderChanges = true;
            }
        }, 0);

        this._parentDisable = function () {
            if (self._disabledParent) {
                return;
            }

            self._disabledParent = true;

            if (!self._disabled) {
                self.emit('disable');
                self.class.add('disabled');
            }
        };

        this._parentEnable = function () {
            if (!self._disabledParent) {
                return;
            }

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

    set element(value) {
        if (this._element) {
            return;
        }

        this._element = value;
        this._element.ui = this;

        const self = this;
        this._evtClick = function (evt) {
            if (self.disabled && !self.disabledClick) {
                return;
            }
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

        if (!this.innerElement) {
            this.innerElement = this._element;
        }
    }

    get element() {
        return this._element;
    }

    set parent(value) {
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

    get parent() {
        return this._parent;
    }

    set disabled(value) {
        if (this._disabled === value) {
            return;
        }

        this._disabled = !!value;
        this.emit((this._disabled || this._disabledParent) ? 'disable' : 'enable');

        if ((this._disabled || this._disabledParent)) {
            this.class.add('disabled');
        } else {
            this.class.remove('disabled');
        }
    }

    get disabled() {
        return this._disabled || this._disabledParent;
    }

    get disabledSelf() {
        return this._disabled;
    }

    set enabled(value) {
        this.disabled = !value;
    }

    get enabled() {
        return !this._disabled;
    }

    set value(value) {
        if (!this._link) {
            return;
        }
        this._link.set(this.path, value);
    }

    get value() {
        if (!this._link) {
            return null;
        }
        return this._link.get(this.path);
    }

    set hidden(value) {
        if (this._element.classList.contains('hidden') === !!value) {
            return;
        }

        if (value) {
            this._element.classList.add('hidden');
            this.emit('hide');
        } else {
            this._element.classList.remove('hidden');
            this.emit('show');
        }
    }

    get hidden() {
        return this._element.classList.contains('hidden');
    }

    get style() {
        return this._element.style;
    }

    get class() {
        return this._element.classList;
    }

    set flexGrow(value) {
        this._element.style.flexGrow = value;
        this._element.style.webkitFlexGrow = value;
    }

    get flexGrow() {
        return this._element.style.flexGrow;
    }

    set flexShrink(value) {
        this._element.style.flexShrink = value;
        this._element.style.webkitFlexShrink = value;
    }

    get flexShrink() {
        return this._element.style.flexShrink;
    }

    link(link: Observer, path: string) {
        const self = this;

        if (this._link) {
            this.unlink();
        }
        this._link = link;
        this.path = path;

        this.emit('link', path);

        if (this._onLinkChange) {
            const renderChanges = this.renderChanges;
            this.renderChanges = false;
            this._linkOnSet = this._link.on(`${this.path}:set`, (value) => {
                self._onLinkChange(value);
            });
            this._linkOnUnset = this._link.on(`${this.path}:unset`, (value) => {
                self._onLinkChange(value);
            });
            this._onLinkChange(this._link.get(this.path));
            this.renderChanges = renderChanges;
        }
    }

    unlink() {
        if (!this._link) {
            return;
        }

        this.emit('unlink', this.path);

        if (this._linkOnSet) {
            this._linkOnSet.unbind();
            this._linkOnSet = null;

            this._linkOnUnset.unbind();
            this._linkOnUnset = null;
        }

        this._link = null;
        this.path = '';
    }

    destroy() {
        if (this._destroyed) {
            return;
        }

        this._destroyed = true;

        if (this._parent) {
            this._evtParentDestroy.unbind();
            this._evtParentDisable.unbind();
            this._evtParentEnable.unbind();
            this._parent = null;
        }

        if (this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }

        this.unlink();

        this.emit('destroy');

        this.unbind();
    }

    flash() {
        this.class.add('flash');
        setTimeout(this._onFlashDelay, 200);
    }

    get dom() {
        return this._element;
    }
}

export { LegacyElement };
