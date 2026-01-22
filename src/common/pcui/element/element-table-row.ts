import { Container, ContainerArgs } from '@playcanvas/pcui';

import type { Table } from './element-table';

const CLASS_ROW = 'pcui-table-row';
const CLASS_SELECTED_ROW = `${CLASS_ROW}-selected`;

/**
 * The arguments for the {@link TableRow} constructor.
 */
interface TableRowArgs extends ContainerArgs {
    /** If true then this is a header row */
    header?: boolean;
}

/**
 * Represents the row of a Table.
 */
class TableRow extends Container {
    private _header: boolean;

    private _table: Table | null;

    private _selected: boolean;

    private _domEvtFocus?: () => void;

    private _domEvtBlur?: () => void;

    /**
     * Creates new TableRow.
     *
     * @param args - The arguments.
     */
    constructor(args: TableRowArgs = {}) {
        const rowArgs: TableRowArgs = {
            tabIndex: args.header ? -1 : 0,
            dom: document.createElement('tr'),
            ...args
        };

        super(rowArgs);

        this.class.add(CLASS_ROW);

        this._header = !!args.header;
        this._table = null;
        this._selected = false;

        if (!this._header) {
            this._domEvtFocus = this._onFocus.bind(this);
            this._domEvtBlur = this._onBlur.bind(this);

            this.dom.addEventListener('focus', this._domEvtFocus);
            this.dom.addEventListener('blur', this._domEvtBlur);
        }
    }

    _onFocus() {
        this.emit('focus', this);
    }

    _onBlur() {
        this.emit('blur', this);
    }

    focus() {
        if (this._header) {
            return;
        }
        this.dom.focus();
    }

    blur() {
        if (this._header) {
            return;
        }
        this.dom.blur();
    }

    destroy() {
        if (this._destroyed) {
            return;
        }

        if (this._domEvtFocus) {
            this.dom.removeEventListener('focus', this._domEvtFocus);
        }
        if (this._domEvtBlur) {
            this.dom.removeEventListener('blur', this._domEvtBlur);
        }

        super.destroy();
    }

    set selected(value) {
        if (this._header) {
            return;
        }

        if (value) {
            if (this.table && this.table.allowRowFocus) {
                this.focus();
            }
        }

        if (this.selected === value) {
            return;
        }

        this._selected = value;

        if (value) {
            this.class.add(CLASS_SELECTED_ROW);
            this.emit('select', this);
        } else {
            this.class.remove(CLASS_SELECTED_ROW);
            this.emit('deselect', this);
        }
    }

    get selected() {
        return this._selected;
    }

    get nextSibling() {
        let next = this.dom.nextSibling;
        while (next) {
            if (next.ui instanceof TableRow && !next.ui.hidden) {
                return next.ui;
            }

            next = next.nextSibling;
        }

        return null;
    }

    get previousSibling() {
        let prev = this.dom.previousSibling;
        while (prev) {
            if (prev.ui instanceof TableRow && !prev.ui.hidden) {
                return prev.ui;
            }

            prev = prev.previousSibling;
        }

        return null;
    }

    set table(value) {
        this._table = value;
    }

    get table() {
        return this._table;
    }
}

export { TableRow };
