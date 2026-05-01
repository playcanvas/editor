import { Events } from '@playcanvas/observer';
import { Container, Label } from '@playcanvas/pcui';

import type { LegacyPanel } from '@/common/ui/panel';

import {
    ConflictArrayField,
    ConflictField,
    ConflictFieldCreated,
    ConflictFieldDeleted,
    ConflictFieldEdited,
    ConflictFieldNotAvailable,
    ConflictFieldNotRenderable
} from './conflict-field';

export interface ConflictSectionRowArgs {
    /** The name of the field */
    name?: string;
    /** If true then this field has no path (which means the whole object is considered to be a conflict e.g. a whole asset) */
    noPath?: boolean;
    /** The type of the field (if same type for base, source and destination values) */
    type?: string;
    /** The type of the base value */
    baseType?: string;
    /** The type of the source value */
    sourceType?: string;
    /** The type of the destination value */
    destType?: string;
    /** The conflict object */
    conflict: Record<string, unknown>;
    /** If true the name will be prettified */
    prettify?: boolean;
}

const BASE_PANEL = 0;
const DEST_PANEL = 1;
const SOURCE_PANEL = 2;

/**
 * A row that contains the base, source and destination fields.
 */
class ConflictSectionRow extends Events {
    private _resolver: Record<string, unknown>;

    private _name: string | undefined;

    private _types: string[];

    private _conflict: Record<string, unknown>;

    private _resolved = false;

    private _indent = 0;

    private _panels: Container[] = [];

    private _fields: ConflictField[] = [];

    /**
     * Creates a new ConflictSectionRow.
     *
     * @param resolver - The conflict resolver object
     * @param args - The arguments
     */
    constructor(resolver: Record<string, unknown>, args: ConflictSectionRowArgs) {
        super();

        this._resolver = resolver;
        this._name = args.name;
        if (args.type) {
            this._types = [args.type, args.type, args.type];
        } else {
            this._types = [args.baseType || '', args.destType || '', args.sourceType || ''];
        }
        this._conflict = args.conflict;

        const values = this._convertValues(this._conflict);

        // Create 3 panels for base, source and destination values
        for (let i = 0; i < 3; i++) {
            const panel = new Container({ class: 'conflict-field', isRoot: true });
            const isArray = this._types[i].startsWith('array:');
            if (isArray) {
                panel.class.add('field-array-container');
                this._types[i] = this._types[i].slice('array:'.length);
            }
            this._panels.push(panel);

            if (!resolver.isDiff) {
                panel.on('hover', this._onHover);
                panel.on('hoverend', this._onUnHover);
            }

            // Add indentation to all panels
            // except the base
            if (i !== BASE_PANEL) {
                if (this._indent) {
                    panel.class.add(`indent-${this._indent}`);
                }
            }

            if (this._name) {
                const label = new Label({
                    class: 'name',
                    text: `${args.prettify ? this._prettifyName(this._name) : this._name}:`
                });
                panel.append(label);
            }

            let field = null;

            if (this._wasMissing(i, this._conflict, resolver.isDiff)) {
                field = new ConflictFieldNotAvailable();
            } else if (this._wasDeleted(i, this._conflict, resolver.isDiff)) {
                field = new ConflictFieldDeleted();
            } else if (this._wasCreated(i, this._conflict, resolver.isDiff)) {
                field = new ConflictFieldCreated();
            } else if (this._types[i].endsWith('object') || args.noPath) {
                if (this._wasEdited(i, this._conflict, resolver.isDiff)) {
                    field = new ConflictFieldEdited();
                } else {
                    field = new ConflictFieldNotRenderable();
                }
            }

            // if for some reason the value is undefined (e.g it could have been too big)
            // then show a missing field
            if (!field && values[i] === undefined) {
                field = new ConflictFieldNotAvailable();
            }

            if (!field) {
                if (isArray) {
                    field = new ConflictArrayField(this._types[i], values[i]);
                } else {
                    field = ConflictField.create(this._types[i], values[i]);
                }
            }

            field.element.class.add('value');
            this._fields.push(field);

            panel.append(field.element);
        }

        if (this._conflict.useSrc) {
            this._panels[SOURCE_PANEL].class.add('selected');
            this._resolved = true;
        } else if (this._conflict.useDst) {
            this._panels[DEST_PANEL].class.add('selected');
            this._resolved = true;
        }

        if (!resolver.isDiff) {
            this._panels[SOURCE_PANEL].on('click', () => {
                if (this._conflict.useSrc) {
                    this.unresolve();
                } else {
                    this.resolveUsingSource();
                }
            });

            this._panels[DEST_PANEL].on('click', () => {
                if (this._conflict.useDst) {
                    this.unresolve();
                } else {
                    this.resolveUsingDestination();
                }
            });
        }
    }

    _wasMissing(side: number, conflict: Record<string, unknown>, isDiff: boolean): boolean {
        if (side === BASE_PANEL && conflict.missingInBase) {
            return true;
        }
        if (side === SOURCE_PANEL && conflict.missingInSrc) {
            if (isDiff) {
                return conflict.missingInDst;
            }
            return conflict.missingInBase;
        }

        if (side === DEST_PANEL && conflict.missingInDst) {
            if (isDiff) {
                return true;
            }
            return conflict.missingInBase;
        }

        return false;
    }

    _wasDeleted(side: number, conflict: Record<string, unknown>, isDiff: boolean): boolean {
        if (side === SOURCE_PANEL) {
            if (conflict.missingInSrc) {
                if (isDiff) {
                    return !conflict.missingInDst;
                }
                return !conflict.missingInBase;
            }
        } else if (side === DEST_PANEL) {
            if (conflict.missingInDst) {
                if (isDiff) {
                    // for diffs 'dest' is considered to be the base
                    return false;
                }
                return !conflict.missingInBase;
            }
        }

        return false;
    }

    _wasCreated(side: number, conflict: Record<string, unknown>, isDiff: boolean): boolean {
        if (side === SOURCE_PANEL) {
            if (!conflict.missingInSrc) {
                if (isDiff) {
                    return conflict.missingInDst;
                }
                return conflict.missingInBase;
            }
        } else if (side === DEST_PANEL) {
            if (!conflict.missingInDst) {
                if (isDiff) {
                    // we assume the base is the dest when diffing
                    return false;
                }
                return conflict.missingInBase;
            }
        }

        return false;
    }

    _wasEdited(side: number, conflict: Record<string, unknown>, isDiff: boolean): boolean {
        if (side === SOURCE_PANEL) {
            if (!conflict.missingInSrc) {
                if (isDiff) {
                    return !conflict.missingInDst;
                }
                return !conflict.missingInBase;
            }
        } else if (side === DEST_PANEL) {
            if (!conflict.missingInDst) {
                if (isDiff) {
                    // we assume the base is the dest when diffing
                    return false;
                }
                return !conflict.missingInBase;
            }
        }

        return false;
    }

    // Returns an array of the 3 values (base, source, dest) after it converts
    // those values from IDs to names (if necessary)
    _convertValues(conflict: Record<string, unknown>): unknown[] {
        let base = conflict.baseValue;
        let src = conflict.srcValue;
        let dst = conflict.dstValue;

        const baseType = this._types[BASE_PANEL];
        const srcType = this._types[SOURCE_PANEL];
        const dstType = this._types[DEST_PANEL];

        const indexes = {
            'asset': [this._resolver.srcAssetIndex, this._resolver.dstAssetIndex],
            'entity': [this._resolver.srcEntityIndex, this._resolver.dstEntityIndex],
            'layer': [this._resolver.srcSettingsIndex.layers, this._resolver.dstSettingsIndex.layers],
            'batchGroup': [this._resolver.srcSettingsIndex.batchGroups, this._resolver.dstSettingsIndex.batchGroups]
        };

        // convert ids to names
        if (base) {
            // for base values try to find the name first in the source index and then in the destination index
            let handled = false;
            for (const type in indexes) {
                if (baseType === type) {
                    base = this._convertIdToName(base, indexes[type][0], indexes[type][1]);
                    handled = true;
                    break;
                } else if (baseType === `array:${type}`) {
                    base = base.map((id) => {
                        return this._convertIdToName(id, indexes[type][0], indexes[type][1]);
                    });
                    handled = true;
                    break;
                }
            }

            // special handling for sublayers - use the 'layer' field as the id for the field
            if (!handled && baseType === 'array:sublayer' && base) {
                base.forEach((sublayer) => {
                    this._convertSublayer(sublayer, indexes.layer[0], indexes.layer[1]);
                });
            }
        }

        if (src) {
            let handled = false;
            for (const type in indexes) {
                if (srcType === type) {
                    src = this._convertIdToName(src, indexes[type][0]);
                    handled = true;
                    break;

                    // TODO: Commented out because in order to do this we also need the base checkpoint
                    // to see if the entity exists in there. Ideally whether the parent was deleted or not should
                    // be stored in the conflict object.
                    // if (type === 'entity' && conflict.path.endsWith('.parent')) {
                    //     // check if parent is deleted
                    //     if (! this._resolver.dstEntityIndex[conflict.srcValue]) {
                    //         src.deleted = true;
                    //     }
                    // }

                } else if (srcType === `array:${type}`) {
                    if (Array.isArray(src)) {
                        src = src.map((id: unknown) => {
                            return this._convertIdToName(id, indexes[type][0]);
                        });
                    }

                    handled = true;
                    break;
                }
            }

            // special handling for sublayers - use the 'layer' field as the id for the field
            if (!handled && srcType === 'array:sublayer' && src) {
                src.forEach((sublayer: { layer: unknown }) => {
                    this._convertSublayer(sublayer, indexes.layer[0]);
                });
            }
        }

        if (dst) {
            let handled = false;
            for (const type in indexes) {
                if (dstType === type) {
                    dst = this._convertIdToName(dst, indexes[type][1]);
                    handled = true;
                    break;

                    // TODO: Commented out because in order to do this we also need the base checkpoint
                    // to see if the entity exists in there. Ideally whether the parent was deleted or not should
                    // be stored in the conflict object.
                    // if (type === 'entity' && conflict.path.endsWith('.parent')) {
                    //     // check if parent is deleted
                    //     if (! this._resolver.srcEntityIndex[conflict.dstValue]) {
                    //         dst.deleted = true;
                    //     }
                    // }
                } else if (dstType === `array:${type}`) {
                    dst = dst.map((id: unknown) => {
                        return this._convertIdToName(id, indexes[type][1]);
                    });
                    handled = true;
                    break;
                }
            }

            // special handling for sublayers - use the 'layer' field as the id for the field
            if (!handled && dstType === 'array:sublayer' && dst) {
                dst.forEach((sublayer: { layer: unknown }) => {
                    this._convertSublayer(sublayer, indexes.layer[1]);
                });
            }
        }

        const result = new Array(3);
        result[BASE_PANEL] = base;
        result[SOURCE_PANEL] = src;
        result[DEST_PANEL] = dst;
        return result;
    }

    _convertIdToName(id: unknown, index: Record<string, string>, alternativeIndex?: Record<string, string>) {
        if (id === null || id === undefined) {
            return id;
        }

        const result = {
            id: id,
            name: null
        };

        let name = index[id];
        if (name === undefined && alternativeIndex) {
            name = alternativeIndex[id];
        }

        if (name !== undefined) {
            result.name = name;
        }

        return result;
    }

    _convertSublayer(sublayer: { layer: unknown }, index: Record<string, string>, alternativeIndex?: Record<string, string>) {
        const layer = this._convertIdToName(sublayer.layer, index, alternativeIndex);
        sublayer.layer = (layer.name || layer.id);
    }

    _onHover = () => {
        for (let i = 0; i < 3; i++) {
            this._panels[i].class.add('hovered');
        }
    };

    _onUnHover = () => {
        for (let i = 0; i < 3; i++) {
            this._panels[i].class.remove('hovered');
        }
    };

    indent() {
        this._panels[BASE_PANEL].class.remove(`indent-${this._indent}`);
        this._indent++;
        this._panels[BASE_PANEL].class.add(`indent-${this._indent}`);
    }

    unindent() {
        this._panels[BASE_PANEL].class.remove(`indent-${this._indent}`);
        this._indent--;
        if (this._indent) {
            this._panels[BASE_PANEL].class.add(`indent-${this._indent}`);
        }
    }

    // Converts values like so: thisIsSomeValue to this: This Is Some Value
    _prettifyName(name: string): string {
        const firstLetter = name[0];
        const rest = name.slice(1);
        return firstLetter.toUpperCase() +
        rest
        // insert a space before all caps and numbers
        .replace(/([A-Z0-9])/g, ' $1')
        // replace special characters with spaces
        .replace(/[^a-z0-9](.)/gi, (match: string, group: string) => {
            return ` ${group.toUpperCase()}`;
        });
    }

    unresolve() {
        if (!this._resolved) {
            return;
        }

        this._resolved = false;

        this._conflict.useDst = false;
        this._conflict.useSrc = false;

        this._panels[SOURCE_PANEL].class.remove('selected');
        this._panels[DEST_PANEL].class.remove('selected');

        this.emit('unresolve', this._conflict.id);
    }

    resolveUsingSource() {
        if (this._conflict.useSrc) {
            return;
        }

        this.unresolve();
        this._conflict.useSrc = true;
        this._panels[SOURCE_PANEL].class.add('selected');
        this._resolved = true;

        this.emit('resolve', this._conflict.id, {
            useSrc: true
        });
    }

    resolveUsingDestination() {
        if (this._conflict.useDst) {
            return;
        }

        this.unresolve();
        this._conflict.useDst = true;
        this._panels[DEST_PANEL].class.add('selected');
        this._resolved = true;

        this.emit('resolve', this._conflict.id, {
            useDst: true
        });
    }

    // Appends all row panels to parent panels
    appendToParents(parents: LegacyPanel[]) {
        for (let i = 0; i < parents.length; i++) {
            parents[i].append(this._panels[i]);
        }
    }

    // Sets the height of each value to be the maximum of the 3 heights
    onAddedToDom() {
        let i;
        for (i = 0; i < 3; i++) {
            this._fields[i].onAddedToDom();
        }

        let maxHeight = Math.max(this._fields[0].height, this._fields[1].height);
        maxHeight = Math.max(maxHeight, this._fields[2].height);

        for (i = 0; i < 3; i++) {
            this._fields[i].height = maxHeight;
        }
    }

    destroy() {
        this.unbind();

        // Legacy parent containers only auto-destroy children with `node.ui` set,
        // which PCUI elements don't have. Destroy our PCUI fields and panels
        // explicitly so their resources (e.g. CurveInput's resize interval) are
        // released. This can be removed once the parent containers are PCUI.
        for (const field of this._fields) {
            field.element?.destroy();
        }
        this._fields.length = 0;

        for (const panel of this._panels) {
            panel.destroy();
        }
        this._panels.length = 0;
    }

    get resolved() {
        return this._resolved;
    }
}

export { ConflictSectionRow };
