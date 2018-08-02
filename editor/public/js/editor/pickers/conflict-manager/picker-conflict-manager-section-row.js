editor.once('load', function () {
    'use strict';

    var BASE_PANEL = 2;
    var SOURCE_PANEL = 1;
    var DEST_PANEL = 2;

    var convertAssetValue = function (assetId, assetIndex, alternativeAssetIndex) {
        if (! assetId) {
            return assetId;
        }

        var result = {
            id: assetId,
            name: null
        };

        var name = assetIndex[assetId];
        if (name === undefined && alternativeAssetIndex) {
            name = alternativeAssetIndex[assetId];
        }

        if (name !== undefined) {
            result.name = name;
        }

        return result;
    };

    var convertEntityValue = function (entityId, entityIndex, alternativeEntityIndex) {
        if (! entityId) {
            return entityId;
        }

        var result = {
            id: entityId,
            name: null
        };

        var name = entityIndex[entityId];
        if (name === undefined && alternativeEntityIndex) {
            name = alternativeEntityIndex[entityId];
        }

        if (name !== undefined) {
            result.name = name;
        }

        return result;
    };

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
            this._types = [args.baseType, args.sourceType, args.destType];
        }
        this._conflict = args.conflict;
        this._resolved = false;

        this._indent = 0;

        this._panels = [];
        this._fields = [];

        var values = [self._conflict.baseValue, self._conflict.srcValue, self._conflict.dstValue];

        // convert asset ids and entity guids to {id: __, name: __} objects
        if (values[0]) {
            if (self._types[0] === 'asset') {
                values[0] = convertAssetValue(values[0], self._resolver.srcAssetIndex, self._resolver.dstAssetIndex);
            } else if (self._types[0] === 'array:asset') {
                values[0] = values[0].map(function (assetId) {
                    return convertAssetValue(assetId, self._resolver.srcAssetIndex, self._resolver.dstAssetIndex);
                });
            } else if (self._types[0] === 'entity') {
                values[0] = convertEntityValue(values[0], self._resolver.srcEntityIndex, self._resolver.dstEntityIndex);
            } else if (self._types[0] === 'array:entity') {
                values[0] = values[0].map(function (entityId) {
                    return convertEntityValue(entityId, self._resolver.srcEntityIndex, self._resolver.dstEntityIndex);
                });
            }
        }

        if (values[1]) {
            if (this._types[1] === 'asset') {
                values[1] = convertAssetValue(values[1], self._resolver.srcAssetIndex);
            } else if (this._types[1] === 'array:asset') {
                values[1] = values[1].map(function (assetId) {
                    return convertAssetValue(assetId, self._resolver.srcAssetIndex);
                });
            } else if (this._types[1] === 'entity') {
                values[1] = convertEntityValue(values[1], self._resolver.srcEntityIndex);
            } else if (this._types[1] === 'array:entity') {
                values[1] = values[1].map(function (entityId) {
                    return convertEntityValue(entityId, self._resolver.srcEntityIndex);
                });
            }
        }

        if (values[2]) {
            if (this._types[2] === 'asset') {
                values[2] = convertAssetValue(values[2], self._resolver.dstAssetIndex);
            } else if (this._types[2] === 'array:asset') {
                values[2] = values[2].map(function (assetId) {
                    return convertAssetValue(assetId, self._resolver.dstAssetIndex);
                });
            } else if (this._types[2] === 'entity') {
                values[2] = convertEntityValue(values[2], self._resolver.dstEntityIndex);
            } else if (this._types[2] === 'array:entity') {
                values[2] = values[2].map(function (entityId) {
                    return convertEntityValue(entityId, self._resolver.dstEntityIndex);
                });
            }
        }

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

            if (i !== BASE_PANEL) {
                if (this._indent) {
                    panel.class.add('indent-' + this._indent);
                }
            }

            var label = new ui.Label({
                text: (args.prettify ? this._prettifyName(self._name) : self._name) + ' :'
            });
            label.class.add('name');
            panel.append(label);

            var field;

            if (isArray) {
                field = new ui.ConflictArrayField(self._types[i], values[i]);
            } else {
                field = ui.ConflictField.create(self._types[i], values[i]);
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

    ConflictSectionRow.prototype.appendToParents = function (parents) {
        for (var i = 0; i < parents.length; i++) {
            parents[i].append(this._panels[i]);
        }
    };

    ConflictSectionRow.prototype.onAddedToDom = function () {
        for (var i = 0; i < 3; i++) {
            this._fields[i].onAddedToDom();
        }

        var maxHeight = Math.max(this._fields[0].height, this._fields[1].height);
        maxHeight = Math.max(maxHeight, this._fields[2].height);

        for (var i = 0; i < 3; i++) {
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
