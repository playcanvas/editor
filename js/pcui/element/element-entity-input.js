Object.assign(pcui, (function () {
    const CLASS_ENTITY_INPUT = 'pcui-entity-input';
    const CLASS_EMPTY = CLASS_ENTITY_INPUT + '-empty';

    /**
     * @name pcui.EntityInput
     * @classdesc An input that accepts an Entity.
     * @property {boolean} renderChanges If true then the Element will flash when its value changes.
     * @augments pcui.Element
     */
    class EntityInput extends pcui.Element {
        /**
         * Creates a new pcui.EntityInput.
         *
         * @param {object} args - The arguments.
         * @param {ObserverList} args.entities - The entities list
         * @param {Function} [args.pickEntityFn] - A function with signature (callback) => void. The function should allow the user to pick an Entity and then the functino should call the callback passing the Entity's resource id as the argument.
         * @param {Function} [args.highlightEntityFn] - A function that highlights an Entity with signature (string, boolean) => void. The first argument is the resource id of the Entity and the second argument signifies whether we should highlight the entity or not.
         * @param {boolean} [args.allowDragDrop] - If true then this will enable drag and drop of entities on the input
         */
        constructor(args) {
            const container = new pcui.Container();

            args = Object.assign({
                tabIndex: 0
            }, args);

            super(container.dom, args);

            this.class.add(CLASS_ENTITY_INPUT);

            this._entities = args.entities;

            this._container = container;
            this._container.parent = this;

            this._domEvtFocus = this._onFocus.bind(this);
            this._domEvtBlur = this._onBlur.bind(this);
            this._domEvtKeyDown = this._onKeyDown.bind(this);

            this.dom.addEventListener('focus', this._domEvtFocus);
            this.dom.addEventListener('blur', this._domEvtBlur);
            this.dom.addEventListener('keydown', this._domEvtKeyDown);

            this._label = new pcui.Label({
                flexGrow: 1,
                binding: new pcui.BindingObserversToElement()
            });

            this._container.append(this._label);

            this._buttonRemove = new pcui.Button({
                icon: 'E132'
            });
            this._container.append(this._buttonRemove);
            this._buttonRemove.on('click', (evt) => {
                // don't propagate click to container
                // because it will open the entity picker
                evt.stopPropagation();

                this.value = null;
            });

            this._pickEntityFn = args.pickEntityFn || this._pickEntity.bind(this);
            this._highlightEntityFn = args.highlightEntityFn || this._highlightEntity.bind(this);

            this.value = args.value || null;

            this.renderChanges = args.renderChanges || false;

            this.on('change', () => {
                if (this.renderChanges) {
                    this.flash();
                }
            });

            this.on('click', (evt) => {
                if (this.readOnly) return;

                this.focus();

                this._pickEntity((resourceId) => {
                    this.value = resourceId;
                });
            });

            this.on('hover', () => {
                if (this.value) {
                    this._highlightEntityFn(this.value, true);
                }
            });

            this.on('hoverend', () => {
                if (this.value) {
                    this._highlightEntityFn(this.value, false);
                }
            });

            this.on('hide', () => {
                if (this.value) {
                    this._highlightEntityFn(this.value, false);
                }
            });

            if (args.allowDragDrop) {
                this._initializeDropTarget();
            }
        }

        _initializeDropTarget() {
            editor.call('drop:target', {
                ref: this,
                filter: (type, dropData) => {
                    return (dropData.resource_id && dropData.resource_id !== this.value && type === 'entity');
                },
                drop: (type, dropData) => {
                    this.value = dropData.resource_id;
                }
            });
        }

        _pickEntity(callback) {
            let evtEntityPick = editor.once('picker:entity', (entity) => {
                callback(entity ? entity.get('resource_id') : null);
                evtEntityPick = null;
            });

            editor.call('picker:entity', this.value);

            editor.once('picker:entity:close', function () {
                if (evtEntityPick) {
                    evtEntityPick.unbind();
                    evtEntityPick = null;
                }
            });
        }

        _highlightEntity(resourceId, highlight) {
            editor.call('entities:panel:highlight', resourceId, highlight);
        }

        _updateValue(value) {
            if (this._value) {
                this._highlightEntityFn(this._value, false);
            }

            this._value = value;

            this.class.remove(pcui.CLASS_MULTIPLE_VALUES);

            if (value) {
                const entity = this._entities.get(value);
                this.class.remove(CLASS_EMPTY);
                if (entity) {
                    this._label.link(entity, 'name');
                } else {
                    this._label.unlink();
                    this._label.value = 'Missing';
                }
            } else {
                this._label.unlink();
                this._label.value = this.readOnly ? '' : 'Select Entity';
                this.class.add(CLASS_EMPTY);
            }

            this.emit('change', value);
        }

        _onFocus() {
            this.class.add(pcui.CLASS_FOCUS);
            this.emit('focus');
        }

        _onBlur() {
            this.class.remove(pcui.CLASS_FOCUS);
            this.emit('blur');
        }

        _onKeyDown(evt) {
            // blur on esc
            if (evt.keyCode === 27) {
                evt.stopPropagation();
                this.blur();
                return;
            }

            // open picker on space
            if (evt.keyCode !== 32) return;
            if (!this.enabled || this.readOnly) return;

            evt.stopPropagation();

            this._pickEntityFn((resourceId) => {
                this.value = resourceId;
                this.focus();
            });
        }

        focus() {
            this.dom.focus();
        }

        blur() {
            this.dom.blur();
        }

        destroy() {
            if (this._destroyed) return;
            this.dom.removeEventListener('focus', this._domEvtFocus);
            this.dom.removeEventListener('blur', this._domEvtBlur);
            this._highlightEntity(this.value, false);

            super.destroy();
        }

        set value(value) {
            if (this._value === value) return;
            this._updateValue(value);

            if (this._binding) {
                this._binding.setValue(value);
            }
        }

        get value() {
            return this._value;
        }

        set values(values) {
            let different = false;
            const value = values[0];
            for (let i = 1; i < values.length; i++) {
                if (values[i] !== value) {
                    different = true;
                    break;
                }
            }

            if (different) {
                this._updateValue(null);
                this.class.add(pcui.CLASS_MULTIPLE_VALUES);
            } else {
                this._updateValue(values[0]);
            }
        }
    }

    pcui.Element.register('entity', EntityInput, { allowDragDrop: true, renderChanges: true });

    return {
        EntityInput: EntityInput
    };
})());
