Object.assign(pcui, (function () {
    'use strict';

    const CLASS_TABLE = 'pcui-table';
    const CLASS_ROW = 'pcui-table-row';
    const CLASS_CELL = 'pcui-table-cell';
    const CLASS_CELL_ACTIVE = CLASS_CELL + '-active';
    const CLASS_SORT_CELL = CLASS_CELL + '-sort';
    const CLASS_SORT_CELL_DESCENDING = CLASS_SORT_CELL + '-descending';
    const CLASS_CELL_HANDLE = CLASS_CELL + '-handle';
    const CLASS_RESIZING = CLASS_TABLE + '-resizing';

    class TableRow extends pcui.Container {
        constructor(args) {
            args = Object.assign({
                dom: document.createElement('tr')
            }, args);

            super(args);

            this.class.add(CLASS_ROW);
        }
    }

    class TableCell extends pcui.Container {
        constructor(args) {
            let dom;
            if (args && args.header) {
                dom = document.createElement('th');
                dom.setAttribute('scope', 'col');
            } else {
                dom = document.createElement('td');
            }

            args = Object.assign({
                dom: dom
            }, args);

            super(args);

            this.class.add(CLASS_CELL);
        }
    }

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

            this._selectedRows = [];

            this._observers = null;
        }

        _refreshLayout() {
            this._containerHead.clear();
            this._containerBody.clear();

            // create header
            if (this._columns.length) {
                const headRow = new pcui.TableRow();

                this._columns.forEach((column, colIndex) => {
                    const cell = new pcui.TableCell({
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

            this._sortObservers(this._observers);

            this._observers.forEach(observer => {
                const row = this._createRowFn(observer);
                row.on('click', evt => this._onRowClick(evt, row));
                this.body.append(row);
            });
        }

        _onRowClick(evt, row) {
            if (evt.ctrlKey || evt.metaKey)  {

            } else if (evt.shiftKey) {

            } else {
                this.selectedRows = [row];
            }
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
            return;
            const rows = this._containerHead.dom.childNodes;
            rows.forEach(row => {
                row.childNodes.forEach((child, index) => {
                    if (child.ui instanceof pcui.TableCell) {
                        // if (index === len - 1) {
                            // child.ui.style.width = '';
                            // child.ui.style.minWidth = child.ui.width + 'px';
                        // } else {
                            child.ui.width = child.ui.width;

                        // }
                        this._columns[index].width = child.ui.width;
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

                this._freezeColumnWidth();

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

            handle.on('destroy', () => {
                cleanUp();
            });
        }

        _scrollWhileDragging() {
            if (this._dragScroll === 0) return;

            this.dom.scrollLeft += this._dragScroll * 8;
        }

        _sortObservers(observers) {
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

        link(observers) {
            this.unlink();

            this._observers = observers;
            if (!this._observers) return;

            this._sortObservers();
            this._refreshLayout();
        }

        unlink() {
            if (!this._observers) return;

            this._observers = null;

            this._containerColumns.clear();
            this.head.clear();
            this.body.clear();
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

        get selectedRows() {
            return this._selectedRows.slice();
        }

        set selectedRows(value) {
            this._selectedRows.forEach(row => row.class.remove(CLASS_SELECTED_ROW));

            this._selectedRows = (value || []).slice();

            this._selectedRows.forEach(row => row.class.add(CLASS_SELECTED_ROW));
        }
    }

    return {
        Table: Table,
        TableCell: TableCell,
        TableRow: TableRow
    };

})());

// const table = new pcui.Table({
//     scrollable: true,
//     width: 500,
//     columns: [{
//         title: 'Name',
//         sortKey: 'name'
//     }, {
//         title: 'ID',
//         sortKey: 'id',
//         width: 10
//     }, {
//         title: 'Runtime',
//         width: 20
//     }, {
//         title: 'Type',
//         sortKey: 'type'
//     }, {
//         title: 'Preload',
//         sortKey: 'preload',
//         width: 10
//     }, {
//         title: 'Size',
//         sortKey: 'file.size'
//     }],
//     createRowFn: (observer) => {
//         const row = new pcui.TableRow();

//         ['name', 'id', 'runtime', 'type', 'preload', 'file.size'].forEach(field => {
//             const cell = new pcui.TableCell();
//             const label = new pcui.Label({
//                 binding: new pcui.BindingObserversToElement()
//             });
//             label.link(observer, field);
//             cell.append(label);
//             row.append(cell);
//         });

//         return row;
//     }
// });

// table.style.position = 'absolute';
// table.style.backgroundColor = '#364346';
// table.style.top = '0';
// table.style.left = '0';
// table.style.zIndex = '1';
// table.style.height = '400px';

// var myInterval = setInterval(() => {
//     if (!window.editor) return;
//     if (!editor.call('layout.root')) return;

//     clearInterval(myInterval);

//     editor.call('layout.root').append(table);

//     editor.on('assets:load', () => {
//         table.link(editor.call('assets:list').slice());
//     });
// });
