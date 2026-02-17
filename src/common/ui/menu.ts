import { LegacyContainer } from './container';
import { LegacyMenuItem } from './menu-item';

class LegacyMenu extends LegacyContainer {
    constructor(args: Record<string, any> = {}) {
        super();
        this.element = document.createElement('div');
        this._element.tabIndex = 1;
        this._element.classList.add('ui-menu');
        this._element.addEventListener('keydown', this._onKeyDown.bind(this), false);

        this.elementOverlay = document.createElement('div');
        this.elementOverlay.ui = this;
        this.elementOverlay.classList.add('overlay');
        this.elementOverlay.addEventListener('click', this._onClick.bind(this), false);
        this.elementOverlay.addEventListener('contextmenu', this._onContextMenu.bind(this), false);
        this._element.appendChild(this.elementOverlay);

        this.innerElement = document.createElement('div');
        this.innerElement.classList.add('inner');
        this._element.appendChild(this.innerElement);

        this._index = {};
        this._hovered = [];
        this._clickableSubmenus = args.clickableSubmenus;

        this.on('select-propagate', this._onSelectPropagate.bind(this));
        this.on('append', this._onAppend.bind(this));
        this.on('over', this._onOver.bind(this));
        this.on('open', this._onOpen.bind(this));
    }

    set open(value) {
        if (this.class.contains('open') === !!value) {
            return;
        }

        if (value) {
            this.class.add('open');
            this._element.focus();
        } else {
            this.class.remove('open');
        }

        this.emit('open', !!value);
    }

    get open() {
        return this.class.contains('open');
    }

    _onClick() {
        this.open = false;
    }

    _onContextMenu() {
        this.open = false;
    }

    _onKeyDown(evt) {
        if (this.open && evt.keyCode === 27) {
            this.open = false;
        }
    }

    _onSelectPropagate(path, selectedItemHasChildren, mouseEvent) {
        if (this._clickableSubmenus && selectedItemHasChildren) {
            this._updatePath(path);
        } else {
            this.open = false;
            this.emit(`${path.join('.')}:select`, path, mouseEvent);
            this.emit('select', path, mouseEvent);
        }
    }

    _onAppend(item: any) {
        this._index[item._value] = item;

        item.on('value', (value: any, valueOld: any) => {
            delete this._index[valueOld];
            this._index[value] = item;
        });
        item.once('destroy', () => {
            delete this._index[item._value];
        });
    }

    _onOver(path) {
        this._updatePath(path);
    }

    _onOpen(state) {
        if (state) {
            return;
        }
        this._updatePath([]);
    }

    findByPath(path) {
        if (!(path instanceof Array)) {
            path = path.split('.');
        }

        let item = this;

        for (let i = 0; i < path.length; i++) {
            item = item._index[path[i]];
            if (!item) {
                return null;
            }
        }

        return item;
    }

    _updatePath(path) {
        let node = this;

        for (let i = 0; i < this._hovered.length; i++) {
            node = node._index[this._hovered[i]];
            if (!node) {
                break;
            }
            if (path.length <= i || path[i] !== this._hovered[i]) {
                node.class.remove('hover');
                node.innerElement.style.top = '';
                node.innerElement.style.left = '';
                node.innerElement.style.right = '';
            }
        }

        this._hovered = path;
        node = this;

        for (let i = 0; i < this._hovered.length; i++) {
            node = node._index[this._hovered[i]];

            if (!node) {
                break;
            }

            node.class.add('hover');
            node.innerElement.style.top = '';
            node.innerElement.style.left = '';
            node.innerElement.style.right = '';

            const rect = node.innerElement.getBoundingClientRect();

            if (rect.bottom > window.innerHeight) {
                node.innerElement.style.top = `${-(rect.bottom - window.innerHeight)}px`;
            }
            if (rect.right > window.innerWidth) {
                node.innerElement.style.left = 'auto';
                node.innerElement.style.right = `${node.parent.innerElement.clientWidth}px`;
            }
        }
    }

    position(x, y) {
        this._element.style.display = 'block';

        const rect = this.innerElement.getBoundingClientRect();

        let left = (x || 0);
        let top = (y || 0);

        if (top + rect.height > window.innerHeight) {
            top = window.innerHeight - rect.height;
        } else if (top < 0) {
            top = 0;
        }
        if (left + rect.width > window.innerWidth) {
            left = window.innerWidth - rect.width;
        } else if (left < 0) {
            left = 0;
        }

        this.innerElement.style.left = `${left}px`;
        this.innerElement.style.top = `${top}px`;

        this._element.style.display = '';
    }

    createItem(key, data) {
        const item = new LegacyMenuItem({
            text: data.title || key,
            className: data.className || null,
            value: key,
            icon: data.icon,
            hasChildren: !!(data.items && Object.keys(data.items).length > 0),
            clickableSubmenus: this._clickableSubmenus
        });

        if (data.select) {
            item.on('select', data.select);
        }

        if (data.filter) {
            this.on('open', () => {
                item.enabled = data.filter();
            });
        }

        if (data.hide) {
            this.on('open', () => {
                item.hidden = data.hide();
            });
        }

        return item;
    }

    static fromData(data, args) {
        const menu = new LegacyMenu(args);

        const listItems = function (data, parent) {
            for (const key in data) {
                const item = menu.createItem(key, data[key]);
                parent.append(item);

                if (data[key].items) {
                    listItems(data[key].items, item);
                }
            }
        };

        listItems(data, menu);

        return menu;
    }
}

export { LegacyMenu };
