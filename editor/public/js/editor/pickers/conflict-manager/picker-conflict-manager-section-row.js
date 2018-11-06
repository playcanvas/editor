editor.once('load', function () {
    'use strict';

    var BASE_PANEL = 0;
    var SOURCE_PANEL = 1;
    var DEST_PANEL = 2;

    /**
     * A row that contains the base, source and destination fields.
     * @param {Object} resolver The conflict resolver object
     * @param {Object} args The arguments
     * @param {String} args.name The name of the field
     * @param {String} args.type The type of the field (if same type for base, source and destination values)
     * @param {String} args.baseType The type of the base value
     * @param {String} args.sourceType The type of the source value
     * @param {String} args.destType The type of the destination value
     * @param {Object} args.conflict The conflict object
     * @param {Boolean} args.prettify If true the name will be prettified
     */
    var ConflictSectionRow = function (resolver, args) {
        Events.call(this);

        var self = this;
        this._resolver = resolver;
        this._name = args.name;
        if (args.type) {
            this._types = [args.type, args.type, args.type];
        } else {
            this._types = [args.baseType || '', args.sourceType || '', args.destType || ''];
        }
        this._conflict = args.conflict;
        this._resolved = false;

        this._indent = 0;

        this._panels = [];
        this._fields = [];

        var values = this._convertValues(self._conflict);

        // Create 3 panels for base, source and destionation values
        for (var i = 0; i < 3; i++) {
            var panel = new ui.Panel();
            panel.class.add('conflict-field');
            var isArray = self._types[i].startsWith('array:');
            if (isArray) {
                panel.class.add('field-array-container');
                self._types[i] = self._types[i].slice('array:'.length);
            }
            this._panels.push(panel);

            panel.on('hover', this._onHover.bind(this));
            panel.on('blur', this._onUnHover.bind(this));

            // Add indentation to all panels
            // except the base
            if (i !== BASE_PANEL) {
                if (this._indent) {
                    panel.class.add('indent-' + this._indent);
                }
            }

            var label = null;
            if (self._name) {
                label = new ui.Label({
                    text: (args.prettify ? this._prettifyName(self._name) : self._name) + ' :'
                });
                label.class.add('name');
                panel.append(label);
            }

            var field = null;

            if (i === BASE_PANEL && self._conflict.missingInBase) {
                // if the value is missing in base show it as not available
                field = new ui.ConflictFieldMissing();
            } else if (i === SOURCE_PANEL && self._conflict.missingInSrc || i === DEST_PANEL && self._conflict.missingInDst) {
                // if this field is missing in its branch then show a deleted field
                field = new ui.ConflictFieldDeleted();
            } else if (self._types[i].endsWith('object')) {
                // if this field type is not a type we support ('object') then if it's missing in the other branch show
                // it has been edited in this branch
                if (i === SOURCE_PANEL && self._conflict.missingInDst || i === DEST_PANEL && self._conflict.missingInSrc) {
                    field = new ui.ConflictFieldKeep();
                }
            }

            // if there is no name (path is empty) and this is the source or dest panel then just show
            // that this field was edited
            if (! field && ! self._name && (i === SOURCE_PANEL || i === DEST_PANEL)) {
                field = new ui.ConflictFieldEdited();
            }

            // if for some reason the value is undefined (e.g it could have been too big)
            // then show a missing field
            if (! field && values[i] === undefined) {
                field = new ui.ConflictFieldMissing();
            }

            if (! field) {
                if (isArray) {
                    field = new ui.ConflictArrayField(self._types[i], values[i]);
                } else {
                    field = ui.ConflictField.create(self._types[i], values[i]);
                }
            } else if (label) {
                // if the field is one of the deleted, edited or missing type fields
                // then hide the name label
                label.hidden = true;
            }

            field.element.class.add('value');
            this._fields.push(field);

            panel.append(field.element);
        }

        if (self._conflict.useSrc) {
            this._panels[SOURCE_PANEL].class.add('selected');
            this._resolved = true;
        } else if (self._conflict.useDst) {
            this._panels[DEST_PANEL].class.add('selected');
            this._resolved = true;
        }

        this._panels[SOURCE_PANEL].on('click', function () {
            if (self._conflict.useSrc) {
                self.unresolve();
            } else {
                self.resolveUsingSource();
            }
        });

        this._panels[DEST_PANEL].on('click', function () {
            if (self._conflict.useDst) {
                self.unresolve();
            } else {
                self.resolveUsingDestination();
            }
        });
    };

    ConflictSectionRow.prototype = Object.create(Events.prototype);

    // Returns an array of the 3 values (base, source, dest) after it converts
    // those values from IDs to names (if necessary)
    ConflictSectionRow.prototype._convertValues = function (conflict) {
        var self = this;

        var base = conflict.baseValue;
        var src = conflict.srcValue;
        var dst = conflict.dstValue;

        var baseType = self._types[BASE_PANEL];
        var srcType = self._types[SOURCE_PANEL];
        var dstType = self._types[DEST_PANEL];

        var indexes = {
            'asset': [self._resolver.srcAssetIndex, self._resolver.dstAssetIndex],
            'entity': [self._resolver.srcEntityIndex, self._resolver.dstEntityIndex],
            'layer': [self._resolver.srcSettingsIndex.layers, self._resolver.dstSettingsIndex.layers],
            'batchGroup': [self._resolver.srcSettingsIndex.batchGroups, self._resolver.dstSettingsIndex.batchGroups]
        };

        // convert ids to names
        if (base) {
            // for base values try to find the name first in the source indes and then in the destination index
            var handled = false;
            for (var type in indexes) {
                if (baseType === type) {
                    base = self._convertIdToName(base, indexes[type][0], indexes[type][1]);
                    handled = true;
                    break;
                } else if (baseType === 'array:' + type) {
                    base = base.map(function (id) {
                        return self._convertIdToName(id, indexes[type][0], indexes[type][1]);
                    });
                    handled = true;
                    break;
                }
            }

            // special handling for sublayers - use the 'layer' field as the id for the field
            if (! handled && baseType === 'array:sublayer' && base) {
                base.forEach(function (sublayer) {
                    self._convertSublayer(sublayer, indexes.layer[0], indexes.layer[1]);
                });
            }
        }

        if (src) {
            var handled = false;
            for (var type in indexes) {
                if (srcType === type) {
                    src = self._convertIdToName(src, indexes[type][0]);
                    handled = true;
                    break;

                    // TODO: Commented out because in order to do this we also need the base checkpoint
                    // to see if the entity exists in there. Ideally whether the parent was deleted or not should
                    // be stored in the conflict object.
                    // if (type === 'entity' && conflict.path.endsWith('.parent')) {
                    //     // check if parent is deleted
                    //     if (! self._resolver.dstEntityIndex[conflict.srcValue]) {
                    //         src.deleted = true;
                    //     }
                    // }

                } else if (srcType === 'array:' + type) {
                    src = src.map(function (id) {
                        return self._convertIdToName(id, indexes[type][0]);
                    });
                    handled = true;
                    break;
                }
            }

            // special handling for sublayers - use the 'layer' field as the id for the field
            if (! handled && srcType === 'array:sublayer' && src) {
                src.forEach(function (sublayer) {
                    self._convertSublayer(sublayer, indexes.layer[0]);
                });
            }
        }

        if (dst) {
            var handled = false;
            for (var type in indexes) {
                if (dstType === type) {
                    dst = self._convertIdToName(dst, indexes[type][1]);
                    handled = true;
                    break;

                    // TODO: Commented out because in order to do this we also need the base checkpoint
                    // to see if the entity exists in there. Ideally whether the parent was deleted or not should
                    // be stored in the conflict object.
                    // if (type === 'entity' && conflict.path.endsWith('.parent')) {
                    //     // check if parent is deleted
                    //     if (! self._resolver.srcEntityIndex[conflict.dstValue]) {
                    //         dst.deleted = true;
                    //     }
                    // }
                } else if (dstType === 'array:' + type) {
                    dst = dst.map(function (id) {
                        return self._convertIdToName(id, indexes[type][1]);
                    });
                    handled = true;
                    break;
                }
            }

            // special handling for sublayers - use the 'layer' field as the id for the field
            if (! handled && dstType === 'array:sublayer' && dst) {
                dst.forEach(function (sublayer) {
                    self._convertSublayer(sublayer, indexes.layer[1]);
                });
            }
        }

        var result = new Array(3);
        result[BASE_PANEL] = base;
        result[SOURCE_PANEL] = src;
        result[DEST_PANEL] = dst;
        return result;
    };

    ConflictSectionRow.prototype._convertIdToName = function (id, index, alternativeIndex) {
        if (id === null || id === undefined) {
            return id;
        }

        var result = {
            id: id,
            name: null
        };

        var name = index[id];
        if (name === undefined && alternativeIndex) {
            name = alternativeIndex[id];
        }

        if (name !== undefined) {
            result.name = name;
        }

        return result;
    };

    ConflictSectionRow.prototype._convertSublayer = function (sublayer, index, alternativeIndex) {
        var layer = this._convertIdToName(sublayer.layer, index, alternativeIndex);
        sublayer.layer = (layer.name || layer.id);
    };

    ConflictSectionRow.prototype._onHover = function () {
        for (var i = 0; i < 3; i++) {
            this._panels[i].class.add('hovered');
        }
    };

    ConflictSectionRow.prototype._onUnHover = function () {
        for (var i = 0; i < 3; i++) {
            this._panels[i].class.remove('hovered');
        }
    };

    ConflictSectionRow.prototype.indent = function () {
        this._panels[BASE_PANEL].class.remove('indent-' + this._indent);
        this._indent++;
        this._panels[BASE_PANEL].class.add('indent-' + this._indent);
    };

    ConflictSectionRow.prototype.unindent = function () {
        this._panels[BASE_PANEL].class.remove('indent-' + this._indent);
        this._indent--;
        if (this._indent) {
            this._panels[BASE_PANEL].class.add('indent-' + this._indent);
        }
    };

    // Converts values like so: thisIsSomeValue to this: This Is Some Value
    ConflictSectionRow.prototype._prettifyName = function (name) {
        var firstLetter = name[0];
        var rest = name.slice(1);
        return firstLetter.toUpperCase() +
        rest
        // insert a space before all caps
        .replace(/([A-Z])/g, ' $1')
        // replace special characters with spaces
        .replace(/[^a-zA-Z0-9](.)/g, function (match, group) {
            return ' ' + group.toUpperCase();
        });
    };

    ConflictSectionRow.prototype.unresolve = function () {
        if (! this._resolved) return;

        this._resolved = false;

        this._conflict.useDst = false;
        this._conflict.useSrc = false;

        this._panels[SOURCE_PANEL].class.remove('selected');
        this._panels[DEST_PANEL].class.remove('selected');

        this.emit('unresolve', this._conflict.id);
    };

    ConflictSectionRow.prototype.resolveUsingSource = function () {
        if (this._conflict.useSrc) return;

        this.unresolve();
        this._conflict.useSrc = true;
        this._panels[SOURCE_PANEL].class.add('selected');
        this._resolved = true;

        this.emit('resolve', this._conflict.id, {
            useSrc: true
        });
    };

    ConflictSectionRow.prototype.resolveUsingDestination = function () {
        if (this._conflict.useDst) return;

        this.unresolve();
        this._conflict.useDst = true;
        this._panels[DEST_PANEL].class.add('selected');
        this._resolved = true;

        this.emit('resolve', this._conflict.id, {
            useDst: true
        });
    };

    // Appends all row panels to parent panels
    ConflictSectionRow.prototype.appendToParents = function (parents) {
        for (var i = 0; i < parents.length; i++) {
            parents[i].append(this._panels[i]);
        }
    };

    // Sets the height of each value to be the maximum of the 3 heights
    ConflictSectionRow.prototype.onAddedToDom = function () {
        var i;
        for (i = 0; i < 3; i++) {
            this._fields[i].onAddedToDom();
        }

        var maxHeight = Math.max(this._fields[0].height, this._fields[1].height);
        maxHeight = Math.max(maxHeight, this._fields[2].height);

        for (i = 0; i < 3; i++) {
            this._fields[i].height = maxHeight;
        }
    };

    ConflictSectionRow.prototype.destroy = function () {
        this.unbind();
    };

    Object.defineProperty(ConflictSectionRow.prototype, 'resolved', {
        get: function () {
            return this._resolved;
        }
    });

    window.ui.ConflictSectionRow = ConflictSectionRow;
});
