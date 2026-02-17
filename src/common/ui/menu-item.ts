import { LegacyContainer } from './container';

class LegacyMenuItem extends LegacyContainer {
    constructor(args: Record<string, any> = {}) {
        super();
        this._value = args.value || '';
        this._hasChildren = args.hasChildren;
        this._clickableSubmenus = args.clickableSubmenus;

        this.element = document.createElement('div');
        this._element.classList.add('ui-menu-item');

        if (args.className) {
            this._element.classList.add(args.className);
        }

        this.elementTitle = document.createElement('div');
        this.elementTitle.classList.add('title');
        this.elementTitle.ui = this;
        this._element.appendChild(this.elementTitle);

        this.elementIcon = null;

        this.elementText = document.createElement('span');
        this.elementText.classList.add('text');
        this.elementText.textContent = args.text || 'Untitled';
        this.elementTitle.appendChild(this.elementText);

        this.innerElement = document.createElement('div');
        this.innerElement.classList.add('content');
        this._element.appendChild(this.innerElement);

        this._index = {};
        this._container = false;

        this.elementTitle.addEventListener('mouseenter', this._onMouseEnter.bind(this), false);
        this.elementTitle.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: true });
        this.elementTitle.addEventListener('touchend', this._onTouchEnd.bind(this), false);
        this.elementTitle.addEventListener('click', this._onClick.bind(this), false);

        this.on('over', this._onOver.bind(this));
        this.on('select-propagate', this._onSelectPropagate.bind(this));
        this.on('append', this._onAppend.bind(this));

        if (args.icon) {
            this.icon = args.icon;
        }
    }

    set value(value: string) {
        if (this._value === value) {
            return;
        }

        const valueOld = this._value;
        this._value = value;
        this.emit('value', value, valueOld);
    }

    get value() {
        return this._value;
    }

    set text(value: string) {
        if (this.elementText.textContent === value) {
            return;
        }

        this.elementText.textContent = value;
    }

    get text() {
        return this.elementText.textContent;
    }

    set icon(value: string | null) {
        if ((!value && !this.elementIcon) || (this.elementIcon && this.elementIcon.textContent === value)) {
            return;
        }

        if (!value) {
            this.elementIcon.parentNode.removeChild(this.elementIcon);
            this.elementIcon = null;
        } else {
            if (!this.elementIcon) {
                this.elementIcon = document.createElement('span');
                this.elementIcon.classList.add('icon');
                this.elementTitle.insertBefore(this.elementIcon, this.elementText);
            }

            this.elementIcon.innerHTML = value;
        }
    }

    get icon() {
        return this.elementIcon ? this.elementIcon.textContent : null;
    }

    _onMouseEnter(evt: MouseEvent) {
        evt.stopPropagation();
        evt.preventDefault();

        this.parent.emit('over', [this._value]);
    }

    _onOver(path: string[]) {
        if (!this.parent) {
            return;
        }

        path.splice(0, 0, this._value);

        this.parent.emit('over', path);
    }

    _onClick(evt: MouseEvent) {
        if (!this.parent || this.disabled) {
            return;
        }

        this.emit('select', this._value, this._hasChildren, evt);
        this.parent.emit('select-propagate', [this._value], this._hasChildren, evt);

        if (!this._clickableSubmenus || !this._hasChildren) {
            this.class.remove('hover');
        }
    }

    _onTouchStart(evt: TouchEvent) {
        if (!this.parent || this.disabled) {
            return;
        }

        if (!this._container || this.class.contains('hover')) {
            this.emit('select', this._value, this._hasChildren, evt);
            this.parent.emit('select-propagate', [this._value], this._hasChildren, evt);
            this.class.remove('hover');
        } else {
            this.parent.emit('over', [this._value]);
        }
    }

    _onTouchEnd(evt: TouchEvent) {
        if (!this.parent || this.disabled) {
            return;
        }

        evt.preventDefault();
        evt.stopPropagation();
    }

    _onSelectPropagate(path: string[], selectedItemHasChildren: boolean, mouseEvent: MouseEvent) {
        if (!this.parent) {
            return;
        }

        path.splice(0, 0, this._value);

        this.parent.emit('select-propagate', path, selectedItemHasChildren, mouseEvent);

        if (!this._clickableSubmenus || !selectedItemHasChildren) {
            this.class.remove('hover');
        }
    }

    _onAppend(item: any) {
        this._container = true;
        this.class.add('container');

        this._index[item._value] = item;

        item.on('value', (value: any, valueOld: any) => {
            delete this._index[valueOld];
            this._index[value] = item;
        });
        item.once('destroy', () => {
            delete this._index[item._value];
        });
    }
}

export { LegacyMenuItem };
