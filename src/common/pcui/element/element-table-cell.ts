import { Container } from '@playcanvas/pcui';

/** @import { ContainerArgs } from '@playcanvas/pcui'; */

const CLASS_CELL = 'pcui-table-cell';

/**
 * @typedef TableCellArgs
 * @property {boolean} [header] - If true then this cell belongs to a header row so it will use the
 * <th> element.
 */

/**
 * Represents a table cell inside a TableRow
 */
class TableCell extends Container {
    /**
     * Creates a new TableCell.
     *
     * @param {TableCellArgs & ContainerArgs} [args] - The arguments.
     */
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

export { TableCell };
