import { LegacyContainer } from './container';

class LegacyList extends LegacyContainer {
    constructor(args = {}) {
        super();
        this.element = document.createElement('ul');
        this._element.classList.add('ui-list');
        this.selectable = args.selectable !== undefined ? args.selectable : true;

        this._changing = false;
        this._selected = [];

        this.on('select', this._onSelect.bind(this));
        this.on('deselect', this._onDeselect.bind(this));
        this.on('append', this._onAppend.bind(this));
    }

    set selectable(value) {
        if (this._selectable === !!value) {
            return;
        }

        this._selectable = value;

        if (this._selectable) {
            this.class.add('selectable');
        } else {
            this.class.remove('selectable');
        }
    }

    get selectable() {
        return this._selectable;
    }

    set selected(value) {
        this._changing = true;

        const items = this.selected;
        for (let i = 0; i < items.length; i++) {
            if (value.indexOf(items[i]) !== -1) {
                continue;
            }

            items[i].selected = false;
        }

        for (let i = 0; i < value.length; i++) {
            value[i].selected = true;
        }

        this._changing = false;
    }

    get selected() {
        return this._selected.slice(0);
    }

    _onSelect(item) {
        const ind = this._selected.indexOf(item);
        if (ind === -1) {
            this._selected.push(item);
        }

        if (this._changing) {
            return;
        }

        if (LegacyList._ctrl && LegacyList._ctrl()) {
            // ...
        } else if (LegacyList._shift && LegacyList._shift() && this.selected.length) {
            // ...
        } else {
            this._changing = true;

            const items = this.selected;

            if (items.length > 1) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i] === item) {
                        continue;
                    }

                    items[i].selected = false;
                }
            }

            this._changing = false;
        }

        this.emit('change');
    }

    _onDeselect(item) {
        const ind = this._selected.indexOf(item);
        if (ind !== -1) {
            this._selected.splice(ind, 1);
        }

        if (this._changing) {
            return;
        }

        if (LegacyList._ctrl && LegacyList._ctrl()) {
            // ...
        } else {
            this._changing = true;

            const items = this.selected;

            if (items.length) {
                for (let i = 0; i < items.length; i++) {
                    items[i].selected = false;
                }

                item.selected = true;
            }

            this._changing = false;
        }

        this.emit('change');
    }

    _onAppend(item) {
        if (!item.selected) {
            return;
        }

        const ind = this._selected.indexOf(item);
        if (ind === -1) {
            this._selected.push(item);
        }
    }

    clear() {
        this._selected = [];
        super.clear();
    }
}

export { LegacyList };
