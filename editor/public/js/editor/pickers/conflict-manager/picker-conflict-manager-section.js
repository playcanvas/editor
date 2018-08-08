editor.once('load', function () {
    'use strict';

    // A section contains multiple conflicts and it's meant to group
    // conflicts into meaningful categories
    var ConflictSection = function (resolver, title, foldable) {
        Events.call(this);
        this._resolver = resolver;
        this._numConflicts = 0;
        this._numResolvedConflicts = 0;
        this._indent = 0;

        this.panel = new ui.Panel(title);
        this.panel.class.add('section');
        this.panel.foldable = foldable;
        this.panel.flex = true;

        this._panelBase = new ui.Panel();
        this._panelBase.class.add('base');
        this.panel.append(this._panelBase);

        this._panelSource = new ui.Panel();
        this._panelSource.class.add('theirs');
        this.panel.append(this._panelSource);

        this._panelDest = new ui.Panel();
        this._panelDest.class.add('mine');
        this.panel.append(this._panelDest);

        this.panels = [
            this._panelBase,
            this._panelSource,
            this._panelDest
        ];

        this._labelNumConflicts = new ui.Label({
            text: '0/0'
        });
        this._labelNumConflicts.renderChanges = false;
        this._labelNumConflicts.class.add('num-conflicts');
        this.panel.headerElement.appendChild(this._labelNumConflicts.element);

        this._rows = [];
    };

    ConflictSection.prototype = Object.create(Events.prototype);

    ConflictSection.prototype.indent = function () {
        this._indent++;
    };

    ConflictSection.prototype.unindent = function () {
        this._indent--;
    };

    // Adds a title that spans all 3 panels
    ConflictSection.prototype.appendTitle = function (title, light) {
        var label;

        for (var i = 0; i < 3; i++) {
            label = new ui.Label({
                text: i === 0 ? title : ''
            });
            label.class.add('title');
            if (light) {
                label.class.add('light');
            }
            if (this._indent) {
                label.class.add('indent-' + this._indent);
            }
            this.panels[i].append(label);
        }
    };

    /**
     * Append a new field to the section. This will create
     * a new field on all 3 panels (base, source, destination);
     * @param {Object} args The field options
     * @param {String} args.name The name of the field
     * @param {Boolean} args.prettify If true the name will be 'prettified'
     * @param {String} args.type The type of the field if it's the same for all base, source and destination values
     * @param {String} args.baseType The type of the base value
     * @param {String} args.sourceType The type of the source value
     * @param {String} args.destType The type of the destination value
     * @param {Object} args.conflict The conflict object
     */
    ConflictSection.prototype.appendField = function (args) {
        var row = new ui.ConflictSectionRow(this._resolver, args);
        this._rows.push(row);

        for (var i = 0; i < this._indent; i++) {
            row.indent();
        }

        row.appendToParents(this.panels);

        row.on('resolve', this.onConflictResolved.bind(this));
        row.on('unresolve', this.onConflictUnresolved.bind(this));

        this.numConflicts++;
        if (row.resolved) {
            this.numResolvedConflicts++;
        }
    };

    ConflictSection.prototype.appendAllFields = function (args) {
        var fields = args.fields;
        var title = args.title;
        var except = args.except;
        var schema = args.schema;

        // check if 'fields' is actually a conflict object already
        // and if missingInDst or missingInSrc is true in which case
        // report this entry as 'deleted' or 'edited' in the UI
        if (fields.missingInDst || fields.missingInSrc) {
            this.appendField({
                type: editor.call('schema:' + schema + ':getType', fields.path),
                conflict: fields
            });
            return;
        }

        var addedTitle = false;

        for (var field in fields)  {
            if (except && except.indexOf(field) !== -1) continue;

            var path = fields[field].path;
            if (! path) continue;

            if (! addedTitle && title) {
                addedTitle = true;
                this.appendTitle(title);
            }

            var type = editor.call('schema:' + schema + ':getType', path);

            this.appendField({
                name: field,
                type: type,
                conflict: fields[field],
                prettify: true
            });
        }
    };

    ConflictSection.prototype.onConflictResolved = function (conflictId, data) {
        this.numResolvedConflicts++;
        this.emit('resolve', conflictId, data);
    };

    ConflictSection.prototype.onConflictUnresolved = function (conflictId) {
        this.numResolvedConflicts--;
        this.emit('unresolve', conflictId);
    };

    ConflictSection.prototype.onAddedToDom = function () {
        // make value fields in the same row have equal heights
        for (var i = 0, len = this._rows.length; i < len; i++) {
            this._rows[i].onAddedToDom();
        }
    };

    ConflictSection.prototype.resolveUsingSource = function () {
        for (var i = 0, len = this._rows.length; i < len; i++) {
            this._rows[i].resolveUsingSource();
        }
    };

    ConflictSection.prototype.resolveUsingDestination = function () {
        for (var i = 0, len = this._rows.length; i < len; i++) {
            this._rows[i].resolveUsingDestination();
        }
    };

    ConflictSection.prototype.destroy = function () {
        this.unbind();
        this.panel.destroy();
        this.panels.length = 0;
        this._rows.forEach(function (row) {
            row.destroy();
        });
        this._rows.length = 0;
    };

    Object.defineProperty(ConflictSection.prototype, 'numConflicts', {
        get: function () {
            return this._numConflicts;
        },
        set: function (value) {
            this._numConflicts = value;
            this._labelNumConflicts.text = this._numResolvedConflicts + '/' + this._numConflicts;
        }
    });

    Object.defineProperty(ConflictSection.prototype, 'numResolvedConflicts', {
        get: function () {
            return this._numResolvedConflicts;
        },
        set: function (value) {
            this._numResolvedConflicts = value;
            this._labelNumConflicts.text = this._numResolvedConflicts + '/' + this._numConflicts;
        }
    });

    window.ui.ConflictSection = ConflictSection;
});
