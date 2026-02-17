import { LegacyElement } from './element';

class LegacyListItem extends LegacyElement {
    constructor(args: Record<string, any> = {}) {
        super();
        this._text = args.text || '';
        this._selected = args.selected || false;
        this._allowDeselect = args.allowDeselect !== undefined ? args.allowDeselect : true;

        this.element = document.createElement('li');
        this._element.classList.add('ui-list-item');

        this.elementText = document.createElement('span');
        this.elementText.textContent = this._text;
        this._element.appendChild(this.elementText);

        this.on('click', this._onClick.bind(this));
    }

    set text(value) {
        if (this._text === value) {
            return;
        }
        this._text = value;
        this.elementText.textContent = this._text;
    }

    get text() {
        return this._text;
    }

    set selected(value) {
        if (this._selected === value) {
            return;
        }

        this._selected = value;

        if (this._selected) {
            this._element.classList.add('selected');
        } else {
            this._element.classList.remove('selected');
        }

        this.emit(this.selected ? 'select' : 'deselect');

        if (this.parent) {
            this.parent.emit(this.selected ? 'select' : 'deselect', this);
        }

        this.emit('change', this.selected);
    }

    get selected() {
        return this._selected;
    }

    _onClick() {
        if (!this.selected) {
            this.selected = true;
        } else if (this._allowDeselect) {
            this.selected = false;
        }
    }
}

export { LegacyListItem };
