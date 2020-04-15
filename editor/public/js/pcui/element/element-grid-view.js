Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-gridview';

    class GridView extends pcui.Container {
        constructor(args) {
            if (!args) args = {};

            super(args);

            this.class.add(CLASS_ROOT);

            this.on('append', this._onAppendGridViewItem.bind(this));
            this.on('remove', this._onRemoveGridViewItem.bind(this));

            this.filterFn = args.filterFn;

            this._selected = [];
        }

        _onAppendGridViewItem(item) {
            if (!(item instanceof pcui.GridViewItem)) return;

            const evtClick = item.on('click', (evt) => this._onClickItem(evt, item));
            const evtSelect = item.on('select', () => this._onSelectItem(item));
            const evtDeselect = item.on('deselect', () => this._onDeselectItem(item));

            if (this._filterFn && !this._filterFn(item)) {
                item.hidden = true;
            }

            item.once('griditem:remove', () => {
                evtClick.unbind();
                evtClick = null;

                evtSelect.unbind();
                evtSelect = null;

                evtDeselect.unbind();
                evtDeselect = null;
            });
        }

        _onRemoveGridViewItem(item) {
            if (!(item instanceof pcui.GridViewItem)) return;

            item.selected = false;

            item.emit('griditem:remove');
            item.unbind('griditem:remove');
        }

        _onClickItem(evt, item) {
            if (evt.ctrlKey || evt.metaKey) {
                item.selected = !item.selected;
            } else if (evt.shiftKey) {
                const lastSelected = this._selected[this._selected.length - 1];
                if (lastSelected) {
                    const comparePosition = lastSelected.dom.compareDocumentPosition(item.dom);
                    if (comparePosition & Node.DOCUMENT_POSITION_FOLLOWING) {
                        let sibling = lastSelected.nextSibling;
                        while (sibling) {
                            sibling.selected = true;
                            if (sibling === item) break;

                            sibling = sibling.nextSibling;
                        }
                    } else {
                        let sibling = lastSelected.previousSibling;
                        while (sibling) {
                            sibling.selected = true;
                            if (sibling === item) break;

                            sibling = sibling.previousSibling;
                        }
                    }
                } else {
                    item.selected = true;
                }
            } else {
                if (this._selected.length > 1) {
                    let i = this._selected.length;
                    while (i--) {
                        if (this._selected[i] !== item) {
                            this._selected[i].selected = false;
                        }
                    }
                } else {
                    item.selected = !item.selected;
                }
            }
        }

        _onSelectItem(item) {
            this._selected.push(item);
            this.emit('select', item);
        }

        _onDeselectItem(item) {
            const index = this._selected.indexOf(item);
            if (index !== -1) {
                this._selected.splice(index, 1);
                this.emit('deselect', item);
            }
        }

        deselect() {
            let i = this._selected.length;
            while (i--) {
                this._selected[i].selected = false;
            }
        }

        filter() {
            this.forEachChild(child => {
                if (child instanceof pcui.GridViewItem) {
                    child.hidden = this._filterFn && !this._filterFn(child);
                }
            });
        }

        get selected() {
            return this._selected.slice();
        }

        get filterFn() {
            return this._filterFn;
        }

        set filterFn(value) {
            if (this._filterFn === value) return;

            this._filterFn = value;

            this.filter();
        }
    }

    return {
        GridView: GridView
    };
})());
