Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.BindingBase
     * @classdesc Base class for data binding between IBindable Elements and Observers.
     * @property {pcui.Element} element The element
     * @property {Observer[]} observers The linked observers
     * @property {String[]} paths The linked paths
     * @property {Boolean} applyingChange Whether the binding is currently applying a change either to the observers or the element.
     * @property {Boolean} linked Whether the binding is linked to observers.
     * @property {Boolean} historyEnabled Whether history is enabled for the binding. A valid history object must have been provided first.
     * @property {Boolean} historyCombine If a history module is used whether to combine history actions when applying changes to observers.
     * @property {String} historyName The name of the history action when applying changes to observers.
     * @property {String} historyPrefix A string to prefix the historyName with.
     * @property {String} historyPostfix A string to postfix the historyName with.
     */
    class BindingBase extends Events {
        /**
         * Creates a new binding.
         * @param {Object} args The arguments.
         * @param {pcui.IBindable} [args.element] The IBindable element.
         * @param {pcui.History} [args.history] The history object which will be used to record undo / redo actions.
         * If none is provided then no history will be recorded.
         * @param {String} [args.historyPrefix] A prefix that will be used for the name of every history action.
         * @param {String} [args.historyPostfix] A postfix that will be used for the name of every history action.
         * @param {String} [args.historyName] The name of each history action.
         * @param {Boolean} [args.historyCombine] Whether to combine history actions.
         */
        constructor(args) {
            super();

            if (!args) args = {};

            // the observers we are binding to
            this._observers = null;
            // the paths to use for the observers
            this._paths = null;

            this._applyingChange = false;
            this._element = args.element || null;

            this._history = args.history || null;
            this._historyPrefix = args.historyPrefix || null;
            this._historyPostfix = args.historyPostfix || null;
            this._historyName = args.historyName || null;
            this._historyCombine = args.historyCombine || false;

            this._linked = false;
        }

        // Returns the path at the specified index
        // or the path at the first index if it doesn't exist.
        _pathAt(paths, index) {
            return paths[index] || paths[0];
        }

        /**
         * @name pcui.BindingBase#link
         * @description Links the specified observers to the specified paths.
         * @param {Observer[]|Observer} observers The observer(s).
         * @param {String[]|String} paths The path(s). The behaviour of the binding depends on how many paths are passed.
         * If an equal amount of paths and observers are passed then the binding will map each path to each observer at each index.
         * If more observers than paths are passed then the path at index 0 will be used for all observers.
         * If one observer and multiple paths are passed then all of the paths will be used for the observer (e.g. for curves).
         */
        link(observers, paths) {
            if (this._observers) {
                this.unlink();
            }

            this._observers = Array.isArray(observers) ? observers : [observers];
            this._paths = Array.isArray(paths) ? paths : [paths];

            this._linked = true;
        }

        /**
         * @name pcui.BindingBase#unlink
         * @description Unlinks the observers and paths.
         */
        unlink() {
            this._observers = null;
            this._paths = null;
            this._linked = false;
        }

        /**
         * @name pcui.BindingBase#clone
         * @description Clones the binding. To be implemented by derived classes.
         */
        clone() {
            throw new Error('pcui.BindingBase#clone: Not implemented');
        }

        /**
         * @name pcui.BindingBase#setValue
         * @description Sets a value to the linked observers at the linked paths.
         * @param {Any} value The value
         */
        setValue(value) {
        }

        /**
         * @name pcui.BindingBase#setValues
         * @description Sets an array of values to the linked observers at the linked paths.
         * @param {Any[]} values The values
         */
        setValues(values) {
        }

        /**
         * @name pcui.BindingBase#addValue
         * @description Adds (inserts) a value to the linked observers at the linked paths.
         * @param {Any} value The value
         */
        addValue(value) {
        }

        /**
         * @name pcui.BindingBase#addValues
         * @description Adds (inserts) multiple values to the linked observers at the linked paths.
         * @param {Any[]} values The values
         */
        addValues(values) {
        }

        /**
         * @name pcui.BindingBase#removeValue
         * @description Removes a value from the linked observers at the linked paths.
         * @param {Any} value The value
         */
        removeValue(value) {
        }

        /**
         * @name pcui.BindingBase#removeValues
         * @description Removes multiple values from the linked observers from the linked paths.
         * @param {Any[]} values The values
         */
        removeValues(values) {
        }

        get element() {
            return this._element;
        }

        set element(value) {
            this._element = value;
        }

        get applyingChange() {
            return this._applyingChange;
        }

        set applyingChange(value) {
            if (this._applyingChange === value) return;

            this._applyingChange = value;
            this.emit('applyingChange', value);
        }

        get linked() {
            return this._linked;
        }

        get historyCombine() {
            return this._historyCombine;
        }

        set historyCombine(value) {
            this._historyCombine = value;
        }

        get historyName() {
            return this._historyName;
        }

        set historyName(value) {
            this._historyName = value;
        }

        get historyPrefix() {
            return this._historyPrefix;
        }

        set historyPrefix(value) {
            this._historyPrefix = value;
        }

        get historyPostfix() {
            return this._historyPostfix;
        }

        set historyPostfix(value) {
            this._historyPostfix = value;
        }

        get historyEnabled() {
            return this._history && this._history.enabled;
        }

        set historyEnabled(value) {
            if (this._history) {
                this._history.enabled = value;
            }
        }

        get observers() {
            return this._observers;
        }

        get paths() {
            return this._paths;
        }
    }

    return {
        BindingBase: BindingBase
    };
})());
