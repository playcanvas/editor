Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-gridview-item';
    const CLASS_SELECTED = CLASS_ROOT + '-selected';
    const CLASS_TEXT = CLASS_ROOT + '-text';

    class GridViewItem extends pcui.Container {
        constructor(args) {
            args = Object.assign({
                tabIndex: 0
            }, args);

            super(args);

            this.class.add(CLASS_ROOT);

            this.allowSelect = args.allowSelect !== undefined ? args.allowSelect : true;
            this._selected = false;

            this._labelText = new pcui.Label({
                class: CLASS_TEXT,
                binding: new pcui.BindingObserversToElement()
            });
            this.append(this._labelText);

            this.text = args.text;

            this._domEvtFocus = this._onFocus.bind(this);
            this._domEvtBlur = this._onBlur.bind(this);

            this.dom.addEventListener('focus', this._domEvtFocus);
            this.dom.addEventListener('blur', this._domEvtBlur);
        }

        _onFocus() {
            this.emit('focus');
        }

        _onBlur() {
            this.emit('blur');
        }

        focus() {
            this.dom.focus();
        }

        blur() {
            this.dom.blur();
        }

        link(observers, paths) {
            this._labelText.link(observers, paths);
        }

        unlink() {
            this._labelText.unlink();
        }

        destroy() {
            if (this._destroyed) return;

            this.dom.removeEventListener('focus', this._domEvtFocus);
            this.dom.removeEventListener('blur', this._domEvtBlur);

            super.destroy();
        }

        get allowSelect() {
            return this._allowSelect;
        }

        set allowSelect(value) {
            this._allowSelect = value;
        }

        get selected() {
            return this._selected;
        }

        set selected(value) {
            if (value) {
                this.focus();
            }

            if (this._selected === value) return;

            this._selected = value;

            if (value) {
                this.class.add(CLASS_SELECTED);
                this.emit('select', this);
            } else {
                this.class.remove(CLASS_SELECTED);
                this.emit('deselect', this);
            }
        }

        get text() {
            return this._labelText.text;
        }

        set text(value) {
            this._labelText.text = value;
        }

        get nextSibling() {
            let sibling = this.dom.nextSibling;
            while (sibling) {
                if (sibling.ui instanceof pcui.GridViewItem) {
                    return sibling.ui;
                }

                sibling = sibling.nextSibling;
            }

            return null;
        }

        get previousSibling() {
            let sibling = this.dom.previousSibling;
            while (sibling) {
                if (sibling.ui instanceof pcui.GridViewItem) {
                    return sibling.ui;
                }

                sibling = sibling.previousSibling;
            }

            return null;
        }


    }

    return {
        GridViewItem: GridViewItem
    };
})());
