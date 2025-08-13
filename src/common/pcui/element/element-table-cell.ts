import { Container } from '@playcanvas/pcui';

const CLASS_CELL = 'pcui-table-cell';

type TableCellArgs = {
    /** If true then this cell belongs to a header row so it will use the <th> element */
    header?: boolean;
};

/**
 * Represents a table cell inside a TableRow
 */
class TableCell extends Container {
    /**
     * Creates a new TableCell.
     *
     * @param {TableCellArgs} args - The arguments.
     */
    constructor(args?: TableCellArgs) {
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

export { TableCell };
