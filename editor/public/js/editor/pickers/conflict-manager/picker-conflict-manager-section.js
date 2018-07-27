editor.once('load', function () {
    'use strict';

    var ConflictSection = function (title, foldable) {
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

        this._panelTheirs = new ui.Panel();
        this._panelTheirs.class.add('theirs');
        this.panel.append(this._panelTheirs);

        this._panelMine = new ui.Panel();
        this._panelMine.class.add('mine');
        this.panel.append(this._panelMine);

        this.panels = [
            this._panelBase,
            this._panelTheirs,
            this._panelMine
        ];

        this._labelNumConflicts = new ui.Label({
            text: '0/0'
        });
        this._labelNumConflicts.renderChanges = false;
        this._labelNumConflicts.class.add('num-conflicts');
        this.panel.headerElement.appendChild(this._labelNumConflicts.element);

        this._rows = [];
    };

    ConflictSection.prototype.indent = function () {
        this._indent++;
    };

    ConflictSection.prototype.unindent = function () {
        this._indent--;
    };

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

    ConflictSection.prototype._appendField = function (args) {
        var row = new ui.ConflictSectionRow(args);
        this._rows.push(row);

        for (var i = 0; i < this._indent; i++) {
            row.indent();
        }

        row.appendToParents(this.panels);

        row.on('resolve', this.onConflictResolved.bind(this));
        row.on('unresolve', this.onConflictUnresolved.bind(this));

        this.numConflicts++;
        if (row.resolved) {
            this.onConflictResolved();
        }
    };

    ConflictSection.prototype.onConflictResolved = function () {
        this.numResolvedConflicts++;
    };

    ConflictSection.prototype.onConflictUnresolved = function () {
        this.numResolvedConflicts--;
    };

    ConflictSection.prototype.appendField = function (name, type, conflict) {
        var isArray = type.startsWith('array:');
        if (isArray) {
            type = type.slice(6);
        }
        this._appendField({
            name: name,
            type: type,
            array: isArray,
            conflict: conflict
        });
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
        this.panel.destroy();
        this.panels.length = 0;
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
