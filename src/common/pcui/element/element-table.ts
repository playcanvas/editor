import type { Observer } from '@playcanvas/observer';
import { Element, Container, ContainerArgs, Label } from '@playcanvas/pcui';

import { TableCell } from './element-table-cell';
import { TableRow } from './element-table-row';


const CLASS_TABLE = 'pcui-table';

const CLASS_CELL = 'pcui-table-cell';
const CLASS_CELL_ACTIVE = `${CLASS_CELL}-active`;
const CLASS_SORT_CELL = `${CLASS_CELL}-sort`;
const CLASS_SORT_CELL_DESCENDING = `${CLASS_SORT_CELL}-descending`;
const CLASS_CELL_HANDLE = `${CLASS_CELL}-handle`;

const CLASS_RESIZING = `${CLASS_TABLE}-resizing`;

const CLASS_RESIZING_VISIBLE = `${CLASS_RESIZING}-visible`;

const CSS_PROPERTY_HEIGHT_BEFORE = '--resizing-before';
const CSS_PROPERTY_HEIGHT_AFTER = '--resizing-after';

/**
 * Column definition for the Table.
 */
interface TableColumn {
    /** The title displayed on the column */
    title: string;
    /** CSS width of the initial column width */
    width?: number;
    /** The minimum width of the column */
    minWidth?: number;
    /** The observer field with which to sort the table when the column is clicked */
    sortKey?: string;
    /** Overrides the sortKey method to sort the observers using this function instead */
    sortFn?: (a: Observer, b: Observer, ascending: boolean) => number;
}

/**
 * The arguments for the {@link Table} constructor.
 */
interface TableArgs extends ContainerArgs {
    /** A function like (observer) => TableRow that creates a TableRow from an observer. */
    createRowFn?: (observer: Observer) => TableRow;
    /** A function like (observer) => TableRow that returns an existing row from an observer. Used for faster sorting. */
    getRowFn?: (observer: Observer) => TableRow;
    /** A function like (TableRow) => boolean that hides the row if it returns false. */
    filterFn?: (row: TableRow) => boolean;
    /** The columns of the table */
    columns?: TableColumn[];
    /** The default column index to sort by */
    defaultSortColumn?: number;
    /** Whether table rows will be focused on selection. Defaults to true. */
    allowRowFocus?: boolean;
}

/**
 * Represents a table view with optional resizable and sortable columns.
 */
class Table extends Container {
    private _containerTable: Container;

    private _containerHead: Container;

    private _containerBody: Container;

    private _createRowFn?: (observer: Observer) => TableRow;

    private _getRowFn?: (observer: Observer) => TableRow;

    private _filterFn?: (row: TableRow) => boolean;

    private _filterCanceled: boolean;

    private _filterAnimationFrame: number | null;

    private _sort: {
        ascending: boolean;
        key: string | null;
        fn: ((a: Observer, b: Observer, ascending: boolean) => number) | null;
    };

    private _draggedColumn: number | null;

    private _resizingVisibleRows: HTMLElement[];

    private _didFreezeColumnWidth: boolean;

    private _selectedRows: TableRow[];

    private _lastRowFocused: TableRow | null;

    private _allowRowFocus: boolean;

    private _columns: TableColumn[];

    private _observers: Observer[] | null;

    private _onRowSelectHandler: (row: TableRow) => void;

    private _onRowDeselectHandler: (row: TableRow) => void;

    private _onRowFocusHandler: (row: TableRow) => void;

    private _onRowBlurHandler: (row: TableRow) => void;

    private _onRowKeyDownHandler: (evt: KeyboardEvent) => void;

    private _domEvtWheel: (evt: WheelEvent) => void;

    private _prevScrollTop: number;

    constructor(args: TableArgs = {}) {
        const containerArgs: TableArgs = { ...args };

        super(containerArgs);

        this.class.add(CLASS_TABLE);

        this._containerTable = new Container({
            dom: document.createElement('table')
        });
        this.append(this._containerTable);
        this.domContent = this._containerTable.dom;

        this._containerHead = new Container({
            dom: document.createElement('thead')
        });
        this._containerTable.append(this._containerHead);

        this._containerBody = new Container({
            dom: document.createElement('tbody')
        });
        this._containerTable.append(this._containerBody);

        this._createRowFn = args.createRowFn;
        this._getRowFn = args.getRowFn;
        this._filterFn = args.filterFn;
        this._filterCanceled = false;
        this._filterAnimationFrame = null;

        this._sort = {
            ascending: true,
            key: null,
            fn: null
        };

        this._draggedColumn = null;
        this._resizingVisibleRows = [];
        this._didFreezeColumnWidth = false;

        this._selectedRows = [];
        this._lastRowFocused = null;
        this.allowRowFocus = (args.allowRowFocus !== undefined ? args.allowRowFocus : true);

        this._columns = [];

        if (args.columns) {
            this.columns = args.columns;
            if (args.defaultSortColumn !== undefined) {
                this.sortByColumnIndex(args.defaultSortColumn);
            }
        }

        this._observers = null;

        this._onRowSelectHandler = this._onRowSelect.bind(this);
        this._onRowDeselectHandler = this._onRowDeselect.bind(this);
        this._onRowFocusHandler = this._onRowFocus.bind(this);
        this._onRowBlurHandler = this._onRowBlur.bind(this);
        this._onRowKeyDownHandler = this._onRowKeyDown.bind(this);

        this._domEvtWheel = this._onWheelWhileResizing.bind(this);
    }

    // Recreates the table rows
    _refreshLayout() {
        this.deselect();

        this._containerHead.clear();
        this._containerBody.clear();

        // create header
        if (this._columns.length) {
            const headRow = new TableRow({
                header: true
            });

            this._columns.forEach((column, colIndex) => {
                const cell = new TableCell({
                    header: true
                });

                this._addResizeHandle(cell, colIndex);

                // set preferred width
                if (column.width !== undefined) {
                    cell.width = column.width;
                }

                // add sort class to header cell
                if (column.sortKey && this._sort.key === column.sortKey ||
                    column.sortFn && this._sort.fn === column.sortFn)  {
                    cell.class.add(CLASS_SORT_CELL);
                    if (!this._sort.ascending) {
                        cell.class.add(CLASS_SORT_CELL_DESCENDING);
                    }
                }

                const label = new Label({
                    text: column.title
                });
                // make inline to be able to use text-overflow: ellipsis
                label.style.display = 'inline';
                cell.append(label);

                // sort observers when clicking on header cell
                cell.on('click', () => this.sortByColumnIndex(colIndex));

                headRow.append(cell);
            });

            this.head.append(headRow);
        }

        if (!this._observers) {
            return;
        }

        this._sortObservers();

        this._observers.forEach((observer) => {
            const row = this._createRow(observer);
            this.body.append(row);
        });
    }

    _createRow(observer) {
        const row = this._createRowFn(observer);
        row.table = this;
        row.on('click', evt => this._onRowClick(evt, row));
        row.on('select', this._onRowSelectHandler);
        row.on('deselect', this._onRowDeselectHandler);
        row.on('focus', this._onRowFocusHandler);
        row.on('blur', this._onRowBlurHandler);

        row.dom.addEventListener('keydown', this._onRowKeyDownHandler);

        row.on('destroy', (dom) => {
            const idx = this._selectedRows.indexOf(row);
            if (idx !== -1) {
                this._selectedRows.splice(idx, 1);
            }
            dom.removeEventListener('keydown', this._onRowKeyDownHandler);
        });

        if (this._filterFn) {
            row.hidden = !this._filterFn(row);
        }

        return row;
    }

    _onRowClick(evt, row) {
        if (evt.ctrlKey || evt.metaKey)  {
            // toggle selection
            row.selected = !row.selected;
        } else if (evt.shiftKey) {
            const lastRowSelected = this._selectedRows[this._selectedRows.length - 1];
            if (lastRowSelected) {
                if (lastRowSelected === row) {
                    return;
                }

                // select everything between the last
                // row selected and this row
                const comparePosition = lastRowSelected.dom.compareDocumentPosition(row.dom);
                if (comparePosition & Node.DOCUMENT_POSITION_FOLLOWING) {
                    let next = lastRowSelected.nextSibling;
                    while (next) {
                        next.selected = true;

                        if (next === row) {
                            break;
                        }

                        next = next.nextSibling;
                    }
                } else {
                    let prev = lastRowSelected.previousSibling;
                    while (prev) {
                        prev.selected = true;

                        if (prev === row) {
                            break;
                        }

                        prev = prev.previousSibling;
                    }
                }
            } else {
                // no other row selected so just select this
                row.selected = !row.selected;
            }
        } else {
            let othersSelected = false;

            // deselect others
            this._containerBody.forEachChild((otherRow) => {
                const tableRow = otherRow as TableRow;
                if (tableRow !== row && tableRow.selected) {
                    tableRow.selected = false;
                    othersSelected = true;
                }
            });

            if (othersSelected) {
                row.selected = true;
            } else {
                row.selected = !row.selected;
            }
        }
    }

    _onRowSelect(row) {
        this._selectedRows.push(row);
        this.emit('select', row);
    }

    _onRowDeselect(row) {
        const idx = this._selectedRows.indexOf(row);
        if (idx !== -1) {
            this._selectedRows.splice(idx, 1);
        }

        this.emit('deselect', row);
    }

    _onRowFocus(row) {
        this._lastRowFocused = row;
    }

    _onRowBlur(row) {
        if (this._lastRowFocused === row) {
            this._lastRowFocused = null;
        }
    }

    _onRowKeyDown(evt) {
        if (!this._selectedRows.length) {
            return;
        }

        if (evt.target.tagName.toLowerCase() === 'input') {
            return;
        }

        // handle up and down arrow keys
        if ([38, 40].indexOf(evt.keyCode) === -1) {
            return;
        }

        evt.preventDefault();
        evt.stopPropagation();

        const lastRow = this._lastRowFocused || this._selectedRows[this._selectedRows.length - 1];

        const next = evt.keyCode === 40 ? lastRow.nextSibling : lastRow.previousSibling;
        if (!next) {
            return;
        }

        if (!evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
            // deselect others
            this._containerBody.forEachChild((otherRow) => {
                if (otherRow !== next) {
                    (otherRow as TableRow).selected = false;
                }
            });
        }

        next.selected = true;
    }

    // prevent scroll wheel while resizing
    // to avoid showing our 'clever' hacks
    _onWheelWhileResizing(evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }

    // Executes specified function for each cell in the
    // specified column index for the specified TableRow container
    // The function has a signature of (Element) => {}
    _forEachColumnCell(container: Container, columnIndex: number, fn: (cell: TableCell) => void) {
        container.forEachChild((row) => {
            if (row instanceof TableRow) {
                let index = columnIndex + 1;
                for (let i = 0; i < row.dom.childNodes.length; i++) {
                    const rowCell = row.dom.childNodes[i] as HTMLElement & { ui?: TableCell };
                    if (rowCell.ui && rowCell.ui instanceof TableCell) {
                        index -= ((rowCell.ui as any).colSpan || 1);
                        if (index === 0) {
                            fn(rowCell.ui);
                        } else if (index < 0) {
                            break;
                        }
                    }
                }
            }
        });
    }

    // Executes specified function for each cell in the
    // specified row index for the specified TableRow container
    // The function has a signature of (Element, cellIndex) => {}
    _forEachRowCell(container, rowIndex, fn) {
        const row = container.dom.childNodes[rowIndex];
        if (row.ui instanceof TableRow) {
            let index = -1;
            row.childNodes.forEach((child) => {
                if (child.ui instanceof TableCell) {
                    index++;
                    fn(child.ui, index);
                }
            });
        }
    }

    // Set the current width of each column to its style.width property
    _freezeColumnWidth() {
        this._forEachRowCell(this._containerHead, 0, (cell, columnIndex) => {
            const width = cell.width; // get current numeric width
            cell.width = width; // set width to style.width
            this._columns[columnIndex].width = cell.width; // fetch real width again and store it
        });
    }

    // Hides rows that are not visible in the scroll view
    // and adds filler space above and below the visible rows to
    // keep the scroll view the same height.
    _hideRowsOutOfView() {
        const rect = this.dom.getBoundingClientRect();
        const scrollTop = this.dom.scrollTop;
        this._prevScrollTop = scrollTop;

        this._resizingVisibleRows.length = 0;
        const visible = this._resizingVisibleRows;

        // Find all the rows that are inside the scroll view
        // and store them in _resizingVisibleRows.
        // We will hide the rest.
        let foundFirst = false;
        let row = this.body.dom.childNodes[0] as HTMLElement & { ui?: TableRow };
        while (row) {
            if (row.ui instanceof TableRow && !row.ui.hidden) {
                const rowRect = row.getBoundingClientRect();

                if (rowRect.bottom >= rect.top && rowRect.top <= rect.bottom) {
                    visible.push(row);
                    foundFirst = true;
                } else if (foundFirst) {
                    // early break as if this rect is not visible
                    // but we have already added one this means we are
                    // beyond the bottom bounds of the scroll view.
                    break;
                }
            }

            row = row.nextSibling as HTMLElement & { ui?: TableRow };
        }

        if (visible.length) {
            // calculate the height before the first visible row
            // and the height after the last visible row.
            const bodyRect = this.body.dom.getBoundingClientRect();
            const firstRect = visible[0].getBoundingClientRect();
            const lastRect = visible[visible.length - 1].getBoundingClientRect();
            const beforeHeight = firstRect.top - bodyRect.top;
            const afterHeight = bodyRect.bottom - lastRect.bottom;

            requestAnimationFrame(() => {
                if (!visible.length) {
                    return;
                }

                // Set custom CSS properties for before and after heights so that we fill
                // the table with a pseudo-element row before the first visible row and one
                // after the last visible row. This will ensure that our scrollview remains
                // the same height and the scroll position remains at the same place. The user
                // should not see any movement or changes to the scrollview that way.
                this.body.style.setProperty(CSS_PROPERTY_HEIGHT_BEFORE, `${beforeHeight}px`);
                this.body.style.setProperty(CSS_PROPERTY_HEIGHT_AFTER, `${afterHeight}px`);
                visible.forEach(dom => dom.classList.add(CLASS_RESIZING_VISIBLE));
                this.dom.scrollTop = scrollTop;
            });
        }
    }

    // Restore state of rows before we started resizing
    _restoreRowsOutOfView() {
        this.body.style.removeProperty(CSS_PROPERTY_HEIGHT_BEFORE);
        this.body.style.removeProperty(CSS_PROPERTY_HEIGHT_AFTER);
        this._resizingVisibleRows.forEach(dom => dom.classList.remove(CLASS_RESIZING_VISIBLE));
        this._resizingVisibleRows.length = 0;
        this.dom.scrollTop = this._prevScrollTop;
    }

    // Adds handle to resize column
    _addResizeHandle(cell, colIndex) {
        // add resize handle
        const handle = new Element({
            class: CLASS_CELL_HANDLE
        });
        cell.append(handle);

        handle.on('hover', () => {
            if (this._draggedColumn === null) {
                this._forEachColumnCell(this._containerHead, colIndex, (cell) => {
                    cell.class.add(CLASS_CELL_ACTIVE);
                });
            }
        });

        handle.on('hoverend', () => {
            if (this._draggedColumn === null) {
                this._forEachColumnCell(this._containerHead, colIndex, (cell) => {
                    cell.class.remove(CLASS_CELL_ACTIVE);
                });
            }
        });

        let pageX;
        let width;

        const onMouseUp = (evt) => {
            if (evt.button !== 0) {
                return;
            }
            if (this._draggedColumn === null) {
                return;
            }

            cleanUp();
        };

        const onMouseMove = (evt) => {
            evt.stopPropagation();

            const column = this._columns[colIndex];
            const newWidth = Math.max(width + evt.pageX - pageX, column.minWidth || 2);
            this._columns[colIndex].width = newWidth;
            cell.width = newWidth;
        };

        const onMouseDown = (evt) => {
            if (evt.button !== 0) {
                return;
            }
            if (this._draggedColumn !== null) {
                return;
            }

            this._draggedColumn = colIndex;

            // freeze width on all columns
            // the first time the user tries to resize
            // so that from now on the table width and the columns
            // width will be controlled by the user instead of the
            // table layout.
            if (!this._didFreezeColumnWidth) {
                this._freezeColumnWidth();
                this._didFreezeColumnWidth = true;
            }

            this._hideRowsOutOfView();

            this.dom.removeEventListener('wheel', this._domEvtWheel);
            this.dom.addEventListener('wheel', this._domEvtWheel);

            pageX = evt.pageX;
            // width = cell.width;
            width = this._columns[colIndex].width;

            this.class.add(CLASS_RESIZING);

            window.addEventListener('mouseup', onMouseUp, true);
            window.addEventListener('mousemove', onMouseMove, true);
        };

        const cleanUp = () => {
            window.removeEventListener('mouseup', onMouseUp, true);
            window.removeEventListener('mousemove', onMouseMove, true);

            if (this.destroyed) {
                return;
            }

            this.class.remove(CLASS_RESIZING);
            this._forEachColumnCell(this._containerHead, colIndex, (cell) => {
                cell.class.remove(CLASS_CELL_ACTIVE);
            });

            requestAnimationFrame(() => {
                this._draggedColumn = null;
            });

            this._restoreRowsOutOfView();

            this.dom.removeEventListener('wheel', this._domEvtWheel);

        };

        handle.dom.addEventListener('mousedown', onMouseDown, true);

        handle.on('destroy', (dom) => {
            dom.removeEventListener('mousedown', onMouseDown, true);
            cleanUp();
        });
    }

    _sortObservers() {
        const observers = this._observers;
        // sort.fn is provided sort with that
        if (this._sort.fn) {
            observers.sort((a, b) => {
                return this._sort.fn(a, b, this._sort.ascending);
            });
        } else if (this._sort.key) {
            // if sort.key provided sort with that
            observers.sort((a, b) => {
                let result = 0;
                if (!a.has(this._sort.key)) {
                    if (b.has(this._sort.key)) {
                        result = -1;
                    }
                } else if (!b.has(this._sort.key)) {
                    result = 1;
                } else {
                    const fieldA = a.get(this._sort.key);
                    const fieldB = b.get(this._sort.key);
                    if (fieldA < fieldB) {
                        result = -1;
                    } else if (fieldA > fieldB) {
                        result = 1;
                    }
                }

                if (!this._sort.ascending) {
                    result *= -1;
                }

                return result;
            });
        }
    }

    /**
     * Filters rows based on current filter function.
     */
    filter() {
        const children = this._containerBody.dom.childNodes;
        const len = children.length;

        for (let i = 0; i < len; i++) {
            const row = children[i].ui;
            if (row instanceof TableRow) {
                row.hidden = this._filterFn && !this._filterFn(row);
            }
        }
    }

    /**
     * Filters rows asynchronously by batching up to the specified number of row operations. Fires
     * the following events:
     *
     * - filter:start - When filtering starts
     * - filter:end - When filtering ends
     * - filter:delay - When an animation frame is requested to process another batch.
     * - filter:cancel - When filtering is canceled.
     *
     * @param {number} batchLimit - The maximum number of rows to show
     * before requesting another animation frame.
     */
    filterAsync(batchLimit) {
        let i = 0;
        batchLimit = batchLimit || 100;
        const children = this._containerBody.dom.childNodes;
        const len = children.length;

        this._filterCanceled = false;

        this.emit('filter:start');

        const next = () => {
            this._filterAnimationFrame = null;
            let visible = 0;
            for (; i < len && visible < batchLimit; i++) {
                if (this._filterCanceled) {
                    this._filterCanceled = false;
                    this.emit('filter:cancel');
                    return;
                }

                const row = children[i].ui;
                if (row instanceof TableRow) {
                    if (this._filterFn && !this._filterFn(row)) {
                        row.hidden = true;
                    } else {
                        row.hidden = false;
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
     * Cancels asynchronous filtering.
     */
    filterAsyncCancel() {
        if (this._filterAnimationFrame) {
            cancelAnimationFrame(this._filterAnimationFrame);
            this._filterAnimationFrame = null;
        } else {
            this._filterCanceled = true;
        }
    }

    link(observers) {
        this.unlink();

        this._observers = observers;
        if (!this._observers) {
            return;
        }

        this._refreshLayout();
    }

    unlink() {
        if (!this._observers) {
            return;
        }

        this.deselect();

        this._observers = null;

        if (this._filterAnimationFrame) {
            cancelAnimationFrame(this._filterAnimationFrame);
            this._filterAnimationFrame = null;
        }

        this.head.clear();
        this.body.clear();
    }

    /**
     * Adds a single observer to display. Note that if you are adding multiple observers you should
     * use {@link link} instead.
     *
     * @param {Observer} observer - The observer.
     */
    addObserver(observer) {
        if (!this._observers) {
            this._observers = [];
        }

        this._observers.push(observer);

        this._sortObservers();

        const index = this._observers.indexOf(observer);
        const row = this._createRow(observer);
        this.body.appendBefore(row, this.body.dom.childNodes[index]);
    }

    /**
     * Removes a single observer.
     *
     * @param {Observer} observer - The observer.
     */
    removeObserver(observer) {
        if (!this._observers) {
            return;
        }

        const index = this._observers.indexOf(observer);
        if (index === -1) {
            return;
        }

        this._observers.splice(index, 1);

        const row = this.body.dom.childNodes[index] as HTMLElement & { ui?: TableRow };
        if (row && row.ui) {
            row.ui.selected = false;
            row.ui.destroy();
        }
    }

    /**
     * Sorts the observers again but only moves the row that corresponds to the specified observer.
     *
     * @param {Observer} observer - The observer.
     */
    sortObserver(observer) {
        if (!this._observers) {
            return;
        }

        const index = this._observers.indexOf(observer);
        if (index === -1) {
            return;
        }

        let row = null;
        if (this._getRowFn) {
            row = this._getRowFn(observer);
        } else {
            row = this.body.dom.childNodes[index];
            if (row) {
                row = row.ui;
            }
        }

        if (!row) {
            return;
        }

        this._sortObservers();

        const newIndex = this._observers.indexOf(observer);
        // newIndex === index requires no changes
        if (newIndex > index) {
            this.body.dom.insertBefore(row.dom, this.body.dom.childNodes[newIndex + 1]);
        } else if (newIndex < index) {
            this.body.dom.insertBefore(row.dom, this.body.dom.childNodes[newIndex]);
        }
    }

    /**
     * Sort table entries by the column at the specified index.
     *
     * @param {number} index - The column index.
     */
    sortByColumnIndex(index) {
        const column = this._columns[index];
        if (!column) {
            return;
        }

        if (this._draggedColumn !== null) {
            return;
        }

        if (!column.sortKey && !column.sortFn) {
            return;
        }

        // toggle ascending
        if (column.sortKey && this._sort.key === column.sortKey ||
            column.sortFn && this._sort.fn === column.sortFn) {
            this._sort.ascending = !this._sort.ascending;
        }

        this._sort.key = column.sortKey;
        this._sort.fn = column.sortFn;

        if (this._getRowFn && this._observers) {
            const colIndex = this._columns.indexOf(column);
            this._forEachRowCell(this._containerHead, 0, (cell, index) => {
                if (index === colIndex) {
                    cell.class.add(CLASS_SORT_CELL);
                    if (!this._sort.ascending) {
                        cell.class.add(CLASS_SORT_CELL_DESCENDING);
                    } else {
                        cell.class.remove(CLASS_SORT_CELL_DESCENDING);
                    }
                } else {
                    cell.class.remove(CLASS_SORT_CELL);
                    cell.class.remove(CLASS_SORT_CELL_DESCENDING);
                }
            });

            requestAnimationFrame(() => {
                this._sortObservers();

                this._observers.forEach((observer, index) => {
                    const row = this._getRowFn(observer);
                    if (row) {
                        const rowSiblings = row.parent.dom.childNodes;
                        if (rowSiblings[index] !== row.dom) {
                            row.parent.dom.insertBefore(row.dom, rowSiblings[index]);
                        }
                    }
                });
            });

        } else {
            requestAnimationFrame(() => {
                this._refreshLayout();
            });
        }
    }

    /**
     * Deselects selected rows.
     */
    deselect() {
        let i = this._selectedRows.length;
        while (i--) {
            if (this._selectedRows[i]) {
                this._selectedRows[i].selected = false;
            }
        }
        // sanity check
        this._selectedRows.length = 0;
    }

    destroy() {
        if (this._destroyed) {
            return;
        }

        this._resizingVisibleRows.length = 0;
        this.dom.addEventListener('wheel', this._domEvtWheel);

        super.destroy();
    }

    set columns(value) {
        this._columns = value.slice();
        this._refreshLayout();
    }

    get columns() {
        return this._columns.slice();
    }

    get table() {
        return this._containerTable;
    }

    get head() {
        return this._containerHead;
    }

    get body() {
        return this._containerBody;
    }

    get selected() {
        return this._selectedRows.slice();
    }

    get sortKey() {
        return this._sort.key;
    }

    get sortFn() {
        return this._sort.fn;
    }

    get isAscending() {
        return this._sort.ascending;
    }

    set allowRowFocus(value) {
        this._allowRowFocus = value;
    }

    get allowRowFocus() {
        return this._allowRowFocus;
    }
}

export { Table };
