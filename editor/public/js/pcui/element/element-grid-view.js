Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-gridview';

    /**
     * @name pcui.GridView
     * @extends pcui.Container
     * @classdesc Represents a container that shows a flexible wrappable
     * list of items that looks like a grid. Contains pcui.GridViewItem's.
     * @property {pcui.GridViewItem[]} selected Gets the selected grid view items.
     */
    class GridView extends pcui.Container {
        /**
         * Creates new GridView.
         * @param {Object} [args] The arguments
         * @param {Function} [args.filterFn] A filter function to filter gridview items with signature (pcui.GridViewItem) => Boolean.
         */
        constructor(args) {
            if (!args) args = {};

            super(args);

            this.class.add(CLASS_ROOT);

            this.on('append', this._onAppendGridViewItem.bind(this));
            this.on('remove', this._onRemoveGridViewItem.bind(this));

            this._filterFn = args.filterFn;
            this._filterAnimationFrame = null;
            this._filterCanceled = false;

            this._selected = [];
        }

        _onAppendGridViewItem(item) {
            if (!(item instanceof pcui.GridViewItem)) return;

            let evtClick = item.on('click', (evt) => this._onClickItem(evt, item));
            let evtSelect = item.on('select', () => this._onSelectItem(item));
            let evtDeselect = item.on('deselect', () => this._onDeselectItem(item));

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
                let othersSelected = false;
                let i = this._selected.length;
                while (i--) {
                    if (this._selected[i] !== item) {
                        this._selected[i].selected = false;
                        othersSelected = true;
                    }
                }

                if (othersSelected) {
                    item.selected = true;
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

        /**
         * @name pcui.GridView#deselect
         * @description Deselects all selected grid view items.
         */
        deselect() {
            let i = this._selected.length;
            while (i--) {
                this._selected[i].selected = false;
            }
        }

        /**
         * @name pcui.GridView#filter
         * @description Filters grid view items with the filter function provided in the constructor.
         */
        filter() {
            this.forEachChild(child => {
                if (child instanceof pcui.GridViewItem) {
                    child.hidden = this._filterFn && !this._filterFn(child);
                }
            });
        }

        /**
         * @name pcui.GridView#filterAsync
         * @description Filters grid view items asynchronously by only allowing up to the specified
         * number of grid view item operations. Fires following events:
         * filter:start - When filtering starts
         * filter:end - When filtering ends
         * filter:delay - When an animation frame is requested to process another batch.
         * filter:cancel - When filtering is canceled.
         * @param {Number} batchLimit The maximum number of items to show
         * before requesting another animation frame.
         */
        filterAsync(batchLimit) {
            let i = 0;
            batchLimit = batchLimit || 100;
            const children = this.dom.childNodes;
            const len = children.length;

            this.emit('filter:start');

            this._filterCanceled = false;

            const next = () => {
                this._filterAnimationFrame = null;
                let visible = 0;
                for (; i < len && visible < batchLimit; i++) {
                    if (this._filterCanceled) {
                        this._filterCanceled = false;
                        this.emit('filter:cancel');
                        return;
                    }

                    const child = children[i].ui;
                    if (child instanceof pcui.GridViewItem) {
                        if (this._filterFn && !this._filterFn(child)) {
                            child.hidden = true;
                        } else {
                            child.hidden = false;
                            visible++;
                        }
                    }
                }

                if (i < len) {
                    this.emit('filter:delay');
                    this._filterAnimationFrame = requestAnimationFrame(next);
                } else {
                    this.emit('filter:end');
                }
            };

            next();
        }

        /**
         * @name pcui.GridView#filterAsyncCancel
         * @description Cancels asynchronous filtering.
         */
        filterAsyncCancel() {
            if (this._filterAnimationFrame) {
                cancelAnimationFrame(this._filterAnimationFrame);
                this._filterAnimationFrame = null;
            } else {
                this._filterCanceled = true;
            }
        }

        destroy() {
            if (this._destroyed) return;

            if (this._filterAnimationFrame) {
                cancelAnimationFrame(this._filterAnimationFrame);
                this._filterAnimationFrame = null;
            }

            super.destroy();
        }

        get selected() {
            return this._selected.slice();
        }
    }

    return {
        GridView: GridView
    };
})());
