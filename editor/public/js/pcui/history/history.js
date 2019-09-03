Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.HistoryAction
     * @classdesc A history action
     * @property {String} name The name of the action
     * @property {Function} undo The undo function
     * @property {Function} redo The redo function
     * @property {Boolean} combine Whether to combine with the previous action with the same name.
     * The effect of combining is merely changing the redo function to be the redo function of this action.
     * The original undo function is not modified.
     */

    /**
     * @name pcui.History
     * @classdesc Manages history actions for undo / redo operations.
     * @property {pcui.HistoryAction} currentAction Returns the current history action
     * @property {pcui.HistoryAction} lastAction Returns the last history action
     * @property {Boolean} canUndo Whether we can undo at this time.
     * @property {Boolean} canRedo Whether we can redo at this time.
     * @extends Events
     */
    class History extends Events {
        /**
         * Creates a new pcui.History.
         */
        constructor() {
            super();
            this._actions = [];
            this._currentActionIndex = -1;
            this._canUndo = false;
            this._canRedo = false;
        }

        /**
         * @name pcui.History#add
         * @description Adds a new history action
         * @param {pcui.HistoryAction} action The action
         */
        add(action) {
            if (!action.name) {
                console.error('Trying to add history action without name');
                return;
            }

            if (!action.undo) {
                console.error('Trying to add history action without undo method', action.name);
                return;
            }

            if (!action.redo) {
                console.error('Trying to add history action without redo method', action.name);
                return;
            }

            // if we are adding an action
            // but we have undone some actions in the meantime
            // then we should erase the actions that come after our
            // last action before adding this
            if (this._currentActionIndex !== this._actions.length - 1) {
                this._actions = this._actions.slice(0, this._currentActionIndex + 1);
            }

            // if combine is true then replace the redo of the current action
            // if it has the same name
            if (action.combine && this.currentAction && this.currentAction.name === action.name) {
                this.currentAction.redo = action.redo;
            } else {
                const length = this._actions.push(action);
                this._currentActionIndex = length - 1;
            }

            this.emit('add', action.name);

            this.canUndo = true;
            this.canRedo = false;
        }

        /**
         * @name pcui.History#undo
         * @description Undo the last history action
         */
        undo() {
            if (!this.canUndo) return;

            const name = this.currentAction.name;

            try {
                this.currentAction.undo();
            } catch (ex) {
                console.info('%c(pcui.History#undo)', 'color: #f00');
                console.log(ex.stack);
                return;
            }

            this._currentActionIndex--;

            this.emit('undo', name);

            if (this._currentActionIndex < 0) {
                this.canUndo = false;
            }

            this.canRedo = true;
        }

        /**
         * @name pcui.History#redo
         * @description Redo the current history action
         */
        redo() {
            if (!this.canRedo) return;

            this._currentActionIndex++;

            try {
                this.currentAction.redo();
            } catch (ex) {
                console.info('%c(pcui.History#redo)', 'color: #f00');
                console.log(ex.stack);
                return;
            }

            this.emit('redo', this.currentAction.name);

            this.canUndo = true;

            if (this._currentActionIndex === this._actions.length - 1) {
                this.canRedo = false;
            }
        }

        /**
         * @name pcui.History#clear
         * @description Clears all history actions.
         */
        clear() {
            if (! this._actions.length) return;

            this._actions.length = 0;
            this._currentActionIndex = -1;

            this.canUndo = false;
            this.canRedo = false;
        }

        get currentAction() {
            return this._actions[this._currentActionIndex] || null;
        }

        get lastAction() {
            return this._actions[this._actions.length - 1] || null;
        }

        get canUndo() {
            return this._canUndo;
        }

        set canUndo(value) {
            if (this._canUndo === value) return;
            this._canUndo = value;
            this.emit('canUndo', value);
        }

        get canRedo() {
            return this._canRedo;
        }

        set canRedo(value) {
            if (this._canRedo === value) return;
            this._canRedo = value;
            this.emit('canRedo', value);
        }
    }

    return {
        History: History
    };
})());
