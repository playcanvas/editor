Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.BindingObserversToElement
     * @classdesc Provides one way binding between Observers and an IBindable element and Observers. Any changes from the observers
     * will be propagated to the element.
     * @extends pcui.BindingBase
     */
    class BindingObserversToElement extends pcui.BindingBase {
        /**
         * Creates a new BindingObserversToElement instance.
         * @param {Object} args The arguments.
         */
        constructor(args) {
            super(args);

            this._events = [];
            this._updateElementHandler = this._updateElement.bind(this);
            this._updateTimeout = null;
        }

        _linkObserver(observer, path) {
            this._events.push(observer.on(path + ':set', this._deferUpdateElement.bind(this)));
            this._events.push(observer.on(path + ':unset', this._deferUpdateElement.bind(this)));
            this._events.push(observer.on(path + ':insert', this._deferUpdateElement.bind(this)));
            this._events.push(observer.on(path + ':remove', this._deferUpdateElement.bind(this)));
        }

        _deferUpdateElement() {
            if (this.applyingChange) return;
            this.applyingChange = true;

            this._updateTimeout = setTimeout(this._updateElementHandler);
        }

        _updateElement() {
            if (this._updateTimeout) {
                clearTimeout(this._updateTimeout);
                this._updateTimeout = null;
            }

            this._updateTimeout = null;
            this.applyingChange = true;

            if (this._observers.length === 1) {
                if (this._paths.length > 1) {
                    // if using multiple paths for the single observer (e.g. curves)
                    // then return an array of values for each path
                    this._element.value = this._paths.map(path => {
                        return this._observers[0].has(path) ? this._observers[0].get(path) : undefined;
                    });
                } else {
                    this._element.value = (this._observers[0].has(this._paths[0]) ? this._observers[0].get(this._paths[0]) : undefined);
                }
            } else {
                this._element.values = this._observers.map((observer, i) => {
                    const path = this._pathAt(this._paths, i);
                    return observer.has(path) ? observer.get(path) : undefined;
                });
            }

            this.applyingChange = false;
        }

        link(observers, paths) {
            super.link(observers, paths);

            this._updateElement();

            if (this._observers.length === 1) {
                if (this._paths.length > 1) {
                    for (let i = 0; i < this._paths.length; i++) {
                        this._linkObserver(this._observers[0], this._paths[i]);
                    }
                    return;
                }
            }

            for (let i = 0; i < this._observers.length; i++) {
                this._linkObserver(this._observers[i], this._pathAt(this._paths, i));
            }
        }

        unlink() {
            for (let i = 0; i < this._events.length; i++) {
                this._events[i].unbind();
            }
            this._events.length = 0;

            if (this._updateTimeout) {
                clearTimeout(this._updateTimeout);
                this._updateTimeout = null;
            }

            super.unlink();
        }

        clone() {
            return new pcui.BindingObserversToElement();
        }
    }

    return {
        BindingObserversToElement: BindingObserversToElement
    };
})());
