Object.assign(pcui, (function () {
    'use strict';

    const CLASS_TABLE = 'pcui-table';

    const CLASS_CELL = 'pcui-table-cell';
    const CLASS_CELL_ACTIVE = CLASS_CELL + '-active';
    const CLASS_SORT_CELL = CLASS_CELL + '-sort';
    const CLASS_SORT_CELL_DESCENDING = CLASS_SORT_CELL + '-descending';
    const CLASS_CELL_HANDLE = CLASS_CELL + '-handle';

    const CLASS_RESIZING = CLASS_TABLE + '-resizing';

    class Table extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);

            this.class.add(CLASS_TABLE);

            this._containerTable = new pcui.Container({
                dom: document.createElement('table')
            });
            this.append(this._containerTable);
            this.domContent = this._containerTable.dom;

            this._containerHead = new pcui.Container({
                dom: document.createElement('thead')
            });
            this._containerTable.append(this._containerHead);

            this._containerBody = new pcui.Container({
                dom: document.createElement('tbody')
            });
            this._containerTable.append(this._containerBody);

            this._createRowFn = args.createRowFn;
            this._filterFn = args.filterFn;

            this._sort = {
                ascending: true,
                key: null,
                fn: null
            };

            this._draggedColumn = null;
            this._handleStartWidth = null;
            this._handleStartX = null;

            this._dragScroll = 0;

            this._columns = [];

            if (args.columns) {
                this.columns = args.columns;
            }

            this._lastRowSelected = null;
            this._lastRowFocused = null;

            this._observers = null;

            this._onRowSelectHandler = this._onRowSelect.bind(this);
            this._onRowDeselectHandler = this._onRowDeselect.bind(this);
            this._onRowFocusHandler = this._onRowFocus.bind(this);
            this._onRowBlurHandler = this._onRowBlur.bind(this);
            this._onRowKeyDownHandler = this._onRowKeyDown.bind(this);
        }

        _refreshLayout() {
            this.deselect();

            this._containerHead.clear();
            this._containerBody.clear();

            // create header
            if (this._columns.length) {
                const headRow = new pcui.TableRow({
                    header: true
                });

                this._columns.forEach((column, colIndex) => {
                    const cell = new pcui.TableCell({
                        header: true
                    });

                    if (colIndex < this._columns.length - 1) {
                        this._addResizeHandle(cell, colIndex);
                    }

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

                    const label = new pcui.Label({
                        text: column.title
                    });
                    // make inline to be able to use text-overflow: ellipsis
                    label.style.display = 'inline';
                    cell.append(label);

                    // sort observers when clicking on header cell
                    cell.on('click', () => {
                        if (!column.sortKey && !column.sortFn) return;

                        if (column.sortKey) {
                            this._sort.fn = null;
                            if (this._sort.key === column.sortKey) {
                                this._sort.ascending = !this._sort.ascending;
                            } else {
                                this._sort.key = column.sortKey;
                            }
                        } else if (column.sortFn) {
                            this._sort.key = null;
                            if (this._sort.fn === column.sortFn) {
                                this._sort.ascending = !this._sort.ascending;
                            } else {
                                this._sort.fn = column.sortFn;
                            }
                        }

                        this._refreshLayout();
                    });

                    headRow.append(cell);
                });

                this.head.append(headRow);
            }

            if (!this._observers) return;

            this._sortObservers();

            this._observers.forEach(observer => {
                const row = this._createRow(observer);
                this.body.append(row);
            });
        }

        _createRow(observer) {
            const row = this._createRowFn(observer);
            row.on('click', evt => this._onRowClick(evt, row));
            row.on('select', this._onRowSelectHandler);
            row.on('deselect', this._onRowDeselectHandler);
            row.on('focus', this._onRowFocusHandler);
            row.on('blur', this._onRowBlurHandler);

            row.dom.addEventListener('keydown', this._onRowKeyDownHandler);

            row.on('destroy', dom => {
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
                if (this._lastRowSelected) {
                    if (this._lastRowSelected === row) return;

                    // select everything between the last
                    // row selected and this row
                    const comparePosition = this._lastRowSelected.dom.compareDocumentPosition(row.dom);
                    if (comparePosition & Node.DOCUMENT_POSITION_FOLLOWING) {
                        let next = this._lastRowSelected.nextSibling;
                        while (next) {
                            next.selected = true;

                            if (next === row) break;

                            next = next.nextSibling;
                        }
                    } else {
                        let prev = this._lastRowSelected.previousSibling;
                        while (prev) {
                            prev.selected = true;

                            if (prev === row) break;

                            prev = prev.previousSibling;
                        }
                    }
                } else {
                    // no other row selected so just select this
                    row.selected = !row.selected;
                }
            } else {
                // deselect others
                this._containerBody.forEachChild(otherRow => {
                    if (otherRow !== row) {
                        otherRow.selected = false;
                    }
                });

                // select this row
                row.selected = true;
            }
        }

        _onRowSelect(row) {
            this._lastRowSelected = row;
            this.emit('select', row);
        }

        _onRowDeselect(row) {
            if (this._lastRowSelected === row) {
                this._lastRowSelected = null;
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
            if (!this._lastRowSelected) return;

            if (evt.target.tagName.toLowerCase() === 'input') return;

            if ([38, 40].indexOf(evt.keyCode) === -1) return;

            evt.preventDefault();
            evt.stopPropagation();

            const lastRow = this._lastRowFocused || this._lastRowSelected;

            const next = evt.keyCode === 40 ? lastRow.nextSibling : lastRow.previousSibling;
            if (!next) return;

            if (!evt.ctrlKey && !evt.metaKey && !evt.shiftKey) {
                // deselect others
                this._containerBody.forEachChild(otherRow => {
                    if (otherRow !== next) {
                        otherRow.selected = false;
                    }
                });
            }

            next.selected = true;
        }

        _forEachColumnCell(colIndex, fn, container) {
            if (!container) {
                this._forEachColumnCell(colIndex, fn, this._containerHead);
                this._forEachColumnCell(colIndex, fn, this._containerBody);
                return;
            }

            container.forEachChild(row => {
                if (row instanceof pcui.TableRow) {
                    let highlightIndex = colIndex + 1;
                    for (let i = 0; i < row.dom.childNodes.length; i++) {
                        const rowCell = row.dom.childNodes[i];
                        if (rowCell.ui && rowCell.ui instanceof pcui.TableCell) {
                            highlightIndex -= (rowCell.ui.colSpan || 1);
                            if (highlightIndex === 0) {
                                fn(rowCell.ui);
                            } else if (highlightIndex < 0) {
                                break;
                            }
                        }
                    }
                }
            });
        }

        _freezeColumnWidth() {
            this._containerTable.width = this._containerTable.width;
            this._containerTable.minWidth = 'initial';
            const rows = this._containerHead.dom.childNodes;
            rows.forEach(row => {
                const len = row.childNodes.length;
                row.childNodes.forEach((child, index) => {
                    if (child.ui instanceof pcui.TableCell) {
                        if (index < len - 1) {
                            if (!child.style.width) {
                                child.ui.width = child.ui.width;
                                this._columns[index].width = child.ui.width;
                            }
                        } else {
                            child.ui.width = '100%';
                            this._columns[index].width = '100%';
                        }
                    }
                });
            });
        }

        _addResizeHandle(cell, colIndex) {
            // add resize handle
            const handle = new pcui.Element(document.createElement('div'), {
                class: CLASS_CELL_HANDLE
            });
            cell.append(handle);

            handle.on('hover', () => {
                if (this._draggedColumn === null) {
                    this._forEachColumnCell(colIndex, cell => {
                        cell.class.add(CLASS_CELL_ACTIVE);
                    });
                }
            });

            handle.on('hoverend', () => {
                if (this._draggedColumn === null) {
                    this._forEachColumnCell(colIndex, cell => {
                        cell.class.remove(CLASS_CELL_ACTIVE);
                    });
                }
            });

            let pageX;
            let width;

            const onMouseDown = (evt) => {
                if (evt.button !== 0) return;
                if (this._draggedColumn !== null) return;

                this._draggedColumn = colIndex;
                this.class.add(CLASS_RESIZING);

                // freeze table width
                // this._containerTable.width = this._containerTable.width;

                // freeze width on all columns
                this._freezeColumnWidth();
                // let col = cell.parent.dom.lastChild;
                // let prevColIndex = this._columns.length - 1;
                // while (col) {
                //     if (col.ui instanceof pcui.TableCell) {
                //         this._columns[prevColIndex--].width = col.ui.width;
                //         col.ui.width = col.ui.width;
                //     }

                //     col = col.previousSibling;
                // }

                pageX = evt.pageX;
                width = cell.width;

                window.addEventListener('mouseup', onMouseUp, true);
                window.addEventListener('mousemove', onMouseMove, true);

                if (this.scrollable) {
                    this._dragScroll = 0;
                    this._dragScrollInterval = setInterval(this._scrollWhileDragging.bind(this), 1000 / 60);
                }
            };

            const cleanUp = () => {
                this.class.remove(CLASS_RESIZING);
                this._forEachColumnCell(colIndex, cell => {
                    cell.class.remove(CLASS_CELL_ACTIVE);
                });

                this._draggedColumn = null;

                clearInterval(this._dragScrollInterval);
                this._dragScrollInterval = null;

                window.removeEventListener('mouseup', onMouseUp, true);
                window.removeEventListener('mousemove', onMouseMove, true);
            };

            const onMouseUp = (evt) => {
                if (evt.button !== 0) return;
                if (this._draggedColumn === null) return;

                cleanUp();
            };

            const onMouseMove = (evt) => {
                const newWidth = Math.max(width + evt.pageX - pageX, 2);
                this._columns[colIndex].width = newWidth;

                if (colIndex === this._columns.length - 1) {
                    if (this._containerTable.width < 914 && newWidth < cell.width) {
                        cell.width = '100%';
                    } else {
                        cell.width = newWidth;
                    }
                } else {
                    cell.width = newWidth;
                }

                // this._freezeColumnWidth();

                // Determine if we need to scroll if we are dragging towards the edges
                const rect = this.dom.getBoundingClientRect();
                this._dragScroll = 0;
                if (evt.clientX - rect.right < 32 && this.dom.scrollLeft > 0) {
                    this._dragScroll = 1;
                } else if (rect.left - evt.clientX < 32 && this.dom.scrollWidth - (rect.width + this.dom.scrollLeft) > 0) {
                    this._dragScroll = -1;
                }
            };

            handle.dom.addEventListener('mousedown', onMouseDown, true);

            handle.on('destroy', dom => {
                dom.removeEventListener('mousedown', onMouseDown, true);
                cleanUp();
            });
        }

        _scrollWhileDragging() {
            if (this._dragScroll === 0) return;

            this.dom.scrollLeft += this._dragScroll * 8;
        }

        _sortObservers() {
            const observers = this._observers;
            if (this._sort.fn) {
                observers.sort((a, b) => {
                    let result = this._sort.fn(a, b);
                    if (!this._sort.ascending) {
                        result *= -1;
                    }

                    return result;
                });
            } else if (this._sort.key) {
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

        filter() {
            this._containerBody.forEachChild(row => {
                if (row instanceof pcui.TableRow) {
                    row.hidden = this._filterFn && !this._filterFn(row);
                }
            });
        }

        link(observers) {
            this.unlink();

            this._observers = observers;
            if (!this._observers) return;

            this._refreshLayout();
        }

        unlink() {
            if (!this._observers) return;

            this.deselect();

            this._observers = null;

            this.head.clear();
            this.body.clear();
        }

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

        removeObserver(observer) {
            if (!this._observers) return;

            const index = this._observers.indexOf(observer);
            if (index === -1) return;

            this._observers.splice(index, 1);

            const row = this.body.dom.childNodes[index];
            if (row && row.ui) {
                row.ui.selected = false;
                row.ui.destroy();
            }
        }

        sortObserver(observer) {
            if (!this._observers) return;

            const index = this._observers.indexOf(observer);
            if (index === -1) return;

            let row = this.body.dom.childNodes[index];
            if (!row || !row.ui) return;

            row = row.ui;

            this._sortObservers();

            const newIndex = this._observers.indexOf(observer);
            if (newIndex === index) return;

            this.body.remove(row);
            this.body.appendBefore(row, this.body.dom.childNodes[newIndex]);
        }

        deselect() {
            this.selected.forEach(row => {
                row.selected = false;
            });
        }

        get columns() {
            return this._columns.slice();
        }

        set columns(value) {
            this._columns = value.slice();
            this._refreshLayout();
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
            const selected = [];
            this._containerBody.forEachChild(child => {
                if (child.selected) {
                    selected.push(child);
                }
            });
            return selected;
        }

        get filterFn() {
            return this._filterFn;
        }

        set filterFn(value) {
            if (this._filterFn === value) return;

            this._filterFn = value;

            this._refreshLayout();
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
    }

    return {
        Table: Table
    };

})());
