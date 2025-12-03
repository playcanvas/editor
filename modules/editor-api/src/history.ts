import { Events, History as apiHistory } from '@playcanvas/observer';
import type { HistoryAction } from '@playcanvas/observer/types/history';

/**
 * The history API responsible for undo / redo.
 */
class History extends Events {
    private _history: apiHistory;

    /**
     * Creates new instance of the API
     *
     * @category Internal
     */
    constructor() {
        super();
        this._history = new apiHistory();
        this._history.on('add', name => this.emit('add', name));
        this._history.on('undo', name => this.emit('undo', name));
        this._history.on('redo', name => this.emit('redo', name));
        this._history.on('canUndo', value => this.emit('canUndo', value));
        this._history.on('canRedo', value => this.emit('canRedo', value));
    }

    /**
     * Adds history action
     *
     * @param action - The action
     * @example
     * ```javascript
     * const prevSelection = editor.selection.items;
     * editor.history.add({
     *     name: 'clear selection',
     *     redo: () => { editor.selection.clear({ history: false }); },
     *     undo: () => { editor.selection.set(prevSelection, { history: false }); },
     * });
     * ```
     */
    add(action: HistoryAction) {
        this._history.add(action);
    }

    /**
     * Adds history action and execute redo
     *
     * @param action - The action
     * @example
     * ```javascript
     * const prevSelection = editor.selection.items;
     * editor.history.addAndExecute({
     *     name: 'clear selection',
     *     redo: () => { editor.selection.clear({ history: false }); },
     *     undo: () => { editor.selection.set(prevSelection, { history: false }); },
     * });
     * ```
     */
    addAndExecute(action: HistoryAction) {
        this._history.addAndExecute(action);
    }

    /**
     * Undo last action
     *
     * @example
     * ```javascript
     * editor.history.undo();
     * ```
     */
    undo() {
        this._history.undo();
    }

    /**
     * Redo last action
     *
     * @example
     * ```javascript
     * editor.history.redo();
     * ```
     */
    redo() {
        this._history.redo();
    }

    /**
     * Clear history
     *
     * @example
     * ```javascript
     * editor.history.clear();
     * ```
     */
    clear() {
        this._history.clear();
    }

    /**
     * Gets the current action
     */
    get currentAction() {
        return this._history.currentAction;
    }

    /**
     * Gets the last action
     */
    get lastAction() {
        return this._history.lastAction;
    }

    /**
     * Sets whether there are actions to undo.
     */
    set canUndo(value) {
        this._history.canUndo = value;
    }

    /**
     * Gets whether there are actions to undo.
     */
    get canUndo() {
        return this._history.canUndo;
    }

    /**
     * Sets whether there are actions to redo.
     */
    set canRedo(value) {
        this._history.canRedo = value;
    }

    /**
     * Gets whether there are actions to redo.
     */
    get canRedo() {
        return this._history.canRedo;
    }
}

export { History };
