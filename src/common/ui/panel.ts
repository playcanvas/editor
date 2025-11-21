import { LegacyContainer } from './container';

class LegacyPanel extends LegacyContainer {
    constructor(header) {
        super();
        this.element = document.createElement('div');
        this._element.classList.add('ui-panel', 'noHeader', 'noAnimation');

        this.headerElement = null;
        this.headerElementTitle = null;

        if (header) {
            this.header = header;
        }

        this.on('nodesChanged', this._onNodesChanged.bind(this));

        this.innerElement = document.createElement('div');
        this.innerElement.ui = this;
        this.innerElement.classList.add('content');
        this._element.appendChild(this.innerElement);

        this.innerElement.addEventListener('scroll', this._onScroll.bind(this), false);

        this._resizeEvtMove = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            this._resizeMove(evt.clientX, evt.clientY);
        };

        this._resizeEvtEnd = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            this._resizeEnd();
        };

        this._resizeEvtTouchMove = (evt) => {
            for (let i = 0; i < evt.changedTouches.length; i++) {
                const touch = evt.changedTouches[i];

                if (touch.identifier !== this._resizeTouchId) {
                    continue;
                }

                evt.preventDefault();
                evt.stopPropagation();
                this._resizeMove(touch.clientX, touch.clientY);

                return;
            }
        };

        this._resizeEvtTouchEnd = (evt) => {
            for (let i = 0; i < evt.changedTouches.length; i++) {
                const touch = evt.changedTouches[i];

                if (touch.identifier !== this._resizeTouchId) {
                    continue;
                }

                this._resizeTouchId = null;

                evt.preventDefault();
                evt.stopPropagation();
                this._resizeEnd();

                return;
            }
        };

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.class.remove('noAnimation');
            });
        });

        this.on('parent', this._onParent.bind(this));

        this._handleElement = null;
        this._handle = null;
        this._resizeTouchId = null;
        this._resizeData = null;
        this._resizeLimits = {
            min: 0,
            max: Infinity
        };

        this.headerSize = 0;
    }

    set header(value) {
        if (!this.headerElement && value) {
            this.headerElement = document.createElement('header');
            this.headerElement.classList.add('ui-header');

            this.headerElementTitle = document.createElement('span');
            this.headerElementTitle.classList.add('title');
            this.headerElementTitle.textContent = value;
            this.headerElement.appendChild(this.headerElementTitle);

            const first = this._element.firstChild;
            if (first) {
                this._element.insertBefore(this.headerElement, first);
            } else {
                this._element.appendChild(this.headerElement);
            }

            this.class.remove('noHeader');

            this.headerElement.addEventListener('click', (evt) => {
                if (!this.foldable || (evt.target !== this.headerElement && evt.target !== this.headerElementTitle)) {
                    return;
                }

                this.folded = !this.folded;
            }, false);
        } else if (!value && this.headerElement) {
            this.headerElement.parentNode.removeChild(this.headerElement);
            this.headerElement = null;
            this.headerElementTitle = null;
            this.class.add('noHeader');
        } else {
            this.headerElementTitle.textContent = value || '';
            this.class.remove('noHeader');
        }
    }

    get header() {
        return (this.headerElement && this.headerElementTitle.textContent) || '';
    }

    set foldable(value) {
        if (value) {
            this.class.add('foldable');

            if (this.class.contains('folded')) {
                this.emit('fold');
            }
        } else {
            this.class.remove('foldable');

            if (this.class.contains('folded')) {
                this.emit('unfold');
            }
        }

        this._reflow();
    }

    get foldable() {
        return this.class.contains('foldable');
    }

    set folded(value) {
        if (this.hidden) {
            return;
        }

        if (this.class.contains('folded') === !!value) {
            return;
        }

        if (this.headerElement && this.headerSize === 0) {
            this.headerSize = this.headerElement.clientHeight;
        }

        if (value) {
            this.class.add('folded');

            if (this.class.contains('foldable')) {
                this.emit('fold');
            }
        } else {
            this.class.remove('folded');

            if (this.class.contains('foldable')) {
                this.emit('unfold');
            }
        }

        this._reflow();
    }

    get folded() {
        return this.class.contains('foldable') && this.class.contains('folded');
    }

    set horizontal(value) {
        if (value) {
            this.class.add('horizontal');
        } else {
            this.class.remove('horizontal');
        }
        this._reflow();
    }

    get horizontal() {
        return this.class.contains('horizontal');
    }

    set resizable(value) {
        if (this._handle === value) {
            return;
        }

        const oldHandle = this._handle;
        this._handle = value;

        if (this._handle) {
            if (!this._handleElement) {
                this._handleElement = document.createElement('div');
                this._handleElement.ui = this;
                this._handleElement.classList.add('handle');
                this._handleElement.addEventListener('mousedown', this._resizeStart.bind(this), false);
                this._handleElement.addEventListener('touchstart', this._resizeStart.bind(this), { passive: false });
            }

            if (this._handleElement.parentNode) {
                this._element.removeChild(this._handleElement);
            }
            this._element.appendChild(this._handleElement);
            this.class.add('resizable', `resizable-${this._handle}`);
        } else {
            this._element.removeChild(this._handleElement);
            this.class.remove('resizable', `resizable-${oldHandle}`);
        }

        this._reflow();
    }

    get resizable() {
        return this._handle;
    }

    set resizeMin(value) {
        this._resizeLimits.min = Math.max(0, Math.min(this._resizeLimits.max, value));
    }

    get resizeMin() {
        return this._resizeLimits.min;
    }

    set resizeMax(value) {
        this._resizeLimits.max = Math.max(this._resizeLimits.min, value);
    }

    get resizeMax() {
        return this._resizeLimits.max;
    }

    headerAppend(element) {
        if (!this.headerElement) {
            return;
        }

        const html = (element instanceof HTMLElement);
        const node = html ? element : element.element;

        this.headerElement.insertBefore(node, this.headerElementTitle);

        if (!html) {
            element.parent = this;
        }
    }

    _reflow() {
        if (this.hidden) {
            return;
        }

        if (this.folded) {
            if (this.horizontal) {
                this.style.height = '';
                this.style.width = `${this.headerSize || 32}px`;
            } else {
                this.style.height = `${this.headerSize || 32}px`;
            }
        } else if (this.foldable) {
            if (this.horizontal) {
                this.style.height = '';
                this.style.width = `${this._innerElement.clientWidth}px`;
            } else {
                this.style.height = `${(this.headerSize || 32) + this._innerElement.clientHeight}px`;
            }
        }
    }

    _onNodesChanged() {
        if (!this.foldable || this.folded || this.horizontal || this.hidden) {
            return;
        }

        this.style.height = `${Math.max(0, (this.headerSize || 32)) + this.innerElement.clientHeight}px`;
    }

    _onParent() {
        setTimeout(this._reflow.bind(this));
    }

    _onScroll(evt) {
        this.emit('scroll', evt);
    }

    _resizeStart(evt) {
        if (!this._handle) {
            return;
        }

        if (evt.changedTouches) {
            for (let i = 0; i < evt.changedTouches.length; i++) {
                const touch = evt.changedTouches[i];
                if (touch.target !== this) {
                    continue;
                }

                this._resizeTouchId = touch.identifier;
            }
        }

        this.class.add('noAnimation', 'resizing');
        this._resizeData = null;

        window.addEventListener('mousemove', this._resizeEvtMove, false);
        window.addEventListener('mouseup', this._resizeEvtEnd, false);

        window.addEventListener('touchmove', this._resizeEvtTouchMove, false);
        window.addEventListener('touchend', this._resizeEvtTouchEnd, false);

        evt.preventDefault();
        evt.stopPropagation();
    }

    _resizeMove(x, y) {
        if (!this._resizeData) {
            this._resizeData = {
                x: x,
                y: y,
                width: this._innerElement.clientWidth,
                height: this._innerElement.clientHeight
            };
        } else {
            if (this._handle === 'left' || this._handle === 'right') {
                let offsetX = this._resizeData.x - x;

                if (this._handle === 'right') {
                    offsetX = -offsetX;
                }

                const width = Math.max(this._resizeLimits.min, Math.min(this._resizeLimits.max, (this._resizeData.width + offsetX)));

                this.style.width = `${width + 4}px`;
                this._innerElement.style.width = `${width + 4}px`;
            } else {
                let offsetY = this._resizeData.y - y;

                if (this._handle === 'bottom') {
                    offsetY = -offsetY;
                }

                const height = Math.max(this._resizeLimits.min, Math.min(this._resizeLimits.max, (this._resizeData.height + offsetY)));

                this.style.height = `${height + (this.headerSize === -1 ? 0 : this.headerSize || 32)}px`;
                this._innerElement.style.height = `${height}px`;
            }
        }

        this.emit('resize');
    }

    _resizeEnd(evt) {
        window.removeEventListener('mousemove', this._resizeEvtMove, false);
        window.removeEventListener('mouseup', this._resizeEvtEnd, false);

        window.removeEventListener('touchmove', this._resizeEvtTouchMove, false);
        window.removeEventListener('touchend', this._resizeEvtTouchEnd, false);

        this.class.remove('noAnimation', 'resizing');
        this._resizeData = null;
    }
}

export { LegacyPanel };
