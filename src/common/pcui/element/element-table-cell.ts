import { Container, ContainerArgs } from '@playcanvas/pcui';

const CLASS_CELL = 'pcui-table-cell';

/**
 * The arguments for the {@link TableCell} constructor.
 */
interface TableCellArgs extends ContainerArgs {
    /** If true then this cell belongs to a header row so it will use the <th> element */
    header?: boolean;
}

/**
 * Represents a table cell inside a TableRow
 */
class TableCell extends Container {
    /**
     * Creates a new TableCell.
     *
     * @param args - The arguments.
     */
    constructor(args: TableCellArgs = {}) {
        let dom;
        if (args.header) {
            dom = document.createElement('th');
            dom.setAttribute('scope', 'col');
        } else {
            dom = document.createElement('td');
        }

        const cellArgs: TableCellArgs = {
            ...args,
            dom: dom
        };

        super(cellArgs);

        this.class.add(CLASS_CELL);
    }

    /**
     * The number of columns this cell spans.
     */
    set colSpan(value: number) {
        (this.dom as HTMLTableCellElement).colSpan = value;
    }

    get colSpan(): number {
        return (this.dom as HTMLTableCellElement).colSpan;
    }
}

export { TableCell };
