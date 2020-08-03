Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.BindingTwoWay
     * @classdesc Provides two way data binding between Observers and IBindable elements. This means
     * that when the value of the Observers changes the IBindable will be updated and vice versa.
     * @extends pcui.BindingBase
     */
    class BindingTwoWay extends pcui.BindingBase {
        /**
         * Creates a new BindingTwoWay instance.
         * @param {Object} args The arguments.
         */
        constructor(args) {
            if (!args) args = {};

            super(args);

            this._bindingElementToObservers = args.bindingElementToObservers || new pcui.BindingElementToObservers(args);
            this._bindingObserversToElement = args.bindingObserversToElement || new pcui.BindingObserversToElement(args);

            this._applyingChange = false;
            this._bindingElementToObservers.on('applyingChange', (value) => {
                this.applyingChange = value;
            });

            this._bindingObserversToElement.on('applyingChange', (value) => {
                this.applyingChange = value;
            });
        }

        link(observers, paths) {
            super.link(observers, paths);
            this._bindingElementToObservers.link(observers, paths);
            this._bindingObserversToElement.link(observers, paths);
        }


        unlink() {
            this._bindingElementToObservers.unlink();
            this._bindingObserversToElement.unlink();
            super.unlink();
        }

        clone() {
            return new pcui.BindingTwoWay({
                bindingElementToObservers: this._bindingElementToObservers.clone(),
                bindingObserversToElement: this._bindingObserversToElement.clone()
            });
        }

        setValue(value) {
            this._bindingElementToObservers.setValue(value);
        }

        setValues(values) {
            this._bindingElementToObservers.setValues(values);
        }

        addValue(value) {
            this._bindingElementToObservers.addValue(value);
        }

        addValues(values) {
            this._bindingElementToObservers.addValues(values);
        }

        removeValue(value) {
            this._bindingElementToObservers.removeValue(value);
        }

        removeValues(values) {
            this._bindingElementToObservers.removeValues(values);
        }

        get element() {
            return this._element;
        }

        set element(value) {
            this._element = value;
            this._bindingElementToObservers.element = value;
            this._bindingObserversToElement.element = value;
        }

        get applyingChange() {
            return super.applyingChange;
        }

        set applyingChange(value) {
            if (super.applyingChange === value) return;

            this._bindingElementToObservers.applyingChange = value;
            this._bindingObserversToElement.applyingChange = value;
            super.applyingChange = value;
        }

        get historyCombine() {
            return this._bindingElementToObservers.historyCombine;
        }

        set historyCombine(value) {
            this._bindingElementToObservers.historyCombine = value;
        }

        get historyPrefix() {
            return this._bindingElementToObservers.historyPrefix;
        }

        set historyPrefix(value) {
            this._bindingElementToObservers.historyPrefix = value;
        }

        get historyPostfix() {
            return this._bindingElementToObservers.historyPostfix;
        }

        set historyPostfix(value) {
            this._bindingElementToObservers.historyPostfix = value;
        }

        get historyEnabled() {
            return this._bindingElementToObservers.historyEnabled;
        }

        set historyEnabled(value) {
            this._bindingElementToObservers.historyEnabled = value;
        }
    }

    return {
        BindingTwoWay: BindingTwoWay
    };
})());
