import { Events } from '@playcanvas/observer';

import { Asset } from './asset';
import { Entity } from './entity';
import { globals as api } from './globals';

/**
 * Enables undo / redo of selection changes
 */
class SelectionHistory {
    private _selection: Selection;

    private _enabled: boolean;

    private _executingAction: boolean;

    /**
     * Constructor
     *
     * @category Internal
     */
    constructor(selection: Selection) {
        this._selection = selection;
        this._enabled = true;
        this._executingAction = false;
    }

    /**
     * Sets enabled state of selection undo / redo.
     */
    set enabled(value) {
        this._enabled = value;
    }

    /**
     * Gets enabled state of selection undo / redo.
     */
    get enabled() {
        return this._enabled;
    }

    /**
     * Record history action after executing function.
     * The history action will restore the previous selection.
     */
    wrapAction(name: any, fn: () => void) {
        if (!this._enabled || !api.history || this._executingAction) {
            fn();
            return;
        }

        this._executingAction = true;
        const previousSelection = this._selection.items;
        fn();
        const newSelection = this._selection.items;
        this._executingAction = false;

        api.history.add({
            name: name,
            combine: false,
            undo: () => {
                // set previous selection making sure every item still exists
                this._selection.set(previousSelection.map((item: any) => item.latest()).filter((item: any) => !!item), {
                    history: false
                });
            },
            redo: () => {
                // set new selection making sure every item still exists
                this._selection.set(newSelection.map((item: any) => item.latest()).filter((item: any) => !!item), {
                    history: false
                });
            }
        });
    }
}

/**
 * Selection API. Allows selecting Entities, Assets etc.
 */
class Selection extends Events {
    private _history: SelectionHistory;

    private _items: (Asset | Entity)[];

    private _enabled: boolean;

    private _timeoutChange: ReturnType<typeof setTimeout>;

    /**
     * Constructor
     *
     * @category Internal
     */
    constructor() {
        super();

        this._history = new SelectionHistory(this);
        this._items = [];
        this._enabled = true;
        this._timeoutChange = null;
    }

    /**
     * Fire 'change' event in timeout
     */
    private _deferChangeEvt() {
        if (this._timeoutChange) return;
        this._timeoutChange = setTimeout(() => {
            this._timeoutChange = null;
            this.emit('change', this.items);
        });
    }

    /**
     * Add item to selection
     *
     * @example
     * ```javascript
     * // add root entity to selection
     * editor.selection.add(editor.entities.root);
     * ```
     */
    add(item: any, options: { history?: boolean } = {}) {
        if (!this.enabled) return;
        if (this.has(item)) return;

        if (options.history === undefined) {
            options.history = true;
        }

        const history = this._history.enabled;
        if (!options.history) {
            this._history.enabled = false;
        }
        this._history.wrapAction('select', () => {
            if (this._items[0] && this._items[0].constructor !== item.constructor) {
                this.clear();
            }

            this._items.push(item);
            this.emit('add', item);
            this._deferChangeEvt();
        });
        this._history.enabled = history;
    }

    /**
     * Remove item from selection
     *
     * @example
     * ```javascript
     * // remove root entity from selection
     * editor.selection.remove(editor.entities.root);
     * ```
     */
    remove(item: any, options: { history?: boolean } = {}) {
        if (!this.enabled) return;

        if (options.history === undefined) {
            options.history = true;
        }

        const index = this._items.indexOf(item);
        if (index !== -1) {

            const history = this._history.enabled;
            if (!options.history) {
                this._history.enabled = false;
            }
            this._history.wrapAction('deselect', () => {
                this._items.splice(index, 1);
                this.emit('remove', item);
                this._deferChangeEvt();
            });
            this._history.enabled = history;
        }
    }

    /**
     * Toggle item selection
     *
     * @example
     * ```javascript
     * // toggle root entity selection
     * editor.selection.toggle(editor.entities.root);
     * ```
     */
    toggle(item: any, options: { history?: boolean } = {}) {
        if (!this.enabled) return;

        if (options.history === undefined) {
            options.history = true;
        }

        const history = this._history.enabled;
        if (!options.history) {
            this._history.enabled = false;
        }
        this._history.wrapAction('toggle selection', () => {
            if (this._items[0] && this._items[0].constructor !== item.constructor) {
                this.clear();
            }

            if (this.has(item)) {
                this.remove(item);
            } else {
                this.add(item);
            }
        });

        this._history.enabled = history;
    }

    /**
     * Checks if item is in selection
     *
     * @example
     * ```javascript
     * const isRootSelected = editor.selection.has(editor.entities.root);
     * ```
     */
    has(item: any) {
        return this._items.includes(item);
    }

    /**
     * Clears selection
     *
     * @example
     * ```javascript
     * editor.selection.clear();
     * ```
     */
    clear(options: { history?: boolean } = {}) {
        if (!this.enabled) return;

        const length = this._items.length;
        if (!length) return;

        if (options.history === undefined) {
            options.history = true;
        }

        const history = this._history.enabled;
        if (!options.history) {
            this._history.enabled = false;
        }
        this._history.wrapAction('deselect', () => {
            let i = length;
            const changed = (i > 0);
            while (i--) {
                const item = this._items[i];
                this._items.splice(i, 1);
                this.emit('remove', item);
            }

            if (changed) {
                this._deferChangeEvt();
            }
        });
        this._history.enabled = history;
    }

    /**
     * Sets current selection
     *
     * @example
     * ```javascript
     * // select root entity
     * editor.selection.set([editor.entities.root]);
     * ```
     */
    set(items: any[], options: { history?: boolean } = {}) {
        if (!this.enabled) return;

        if (options.history === undefined) {
            options.history = true;
        }

        const history = this._history.enabled;
        if (!options.history) {
            this._history.enabled = false;
        }
        this._history.wrapAction('modify selection', () => {
            // remove items no longer selected
            const removed = this._items.filter(item => !items.includes(item));
            removed.forEach((item) => {
                this.remove(item);
            });

            // add new items
            items.forEach(item => this.add(item));
        });
        this._history.enabled = history;
    }

    /**
     * Gets the selected items. This creates a new array every time it is called.
     *
     * @example
     * ```javascript
     * editor.selection.items.add(editor.entities.root);
     * const selectedEntities = editor.selection.items;
     * ```
     */
    get items() {
        return this._items.slice();
    }

    /**
     * Gets the first selected item. Short for this.items[0].
     */
    get item() {
        return this._items[0];
    }

    /**
     * Sets enabled state of the selection methods.
     */
    set enabled(value) {
        this._enabled = value;
    }

    /**
     * Gets enabled state of the selection methods.
     */
    get enabled() {
        return this._enabled;
    }

    /**
     * Gets the number of selected items
     */
    get count() {
        return this._items.length;
    }

    /**
     * Gets the selection history
     */
    get history() {
        return this._history;
    }
}

export { Selection, SelectionHistory };
