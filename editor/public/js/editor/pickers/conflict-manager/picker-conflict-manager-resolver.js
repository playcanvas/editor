editor.once('load', function () {
    'use strict';

    var ConflictResolver = function (conflicts, mergeObject) {
        Events.call(this);
        this.elements = [];

        this._mergeId = mergeObject.id;

        this.srcAssetIndex = mergeObject.srcCheckpoint.assets;
        this.dstAssetIndex = mergeObject.dstCheckpoint.assets;

        this.srcEntityIndex = conflicts.itemType === 'scene' ? mergeObject.srcCheckpoint.scenes[conflicts.itemId].entities : null;
        this.dstEntityIndex = conflicts.itemType === 'scene' ? mergeObject.dstCheckpoint.scenes[conflicts.itemId].entities : null;

        this.srcSettingsIndex = mergeObject.srcCheckpoint.settings;
        this.dstSettingsIndex = mergeObject.dstCheckpoint.settings;

        this._pendingResolvedConflicts = {};
        this._pendingRevertedConflicts = {};
        this._timeoutSave = null;
    };

    ConflictResolver.prototype = Object.create(Events.prototype);

    ConflictResolver.prototype.onConflictResolved = function (conflictId, data) {
        delete this._pendingRevertedConflicts[conflictId];
        this._pendingResolvedConflicts[conflictId] = data;
        if (this._timeoutSave) {
            clearTimeout(this._timeoutSave);
        }
        this._timeoutSave = setTimeout(this.saveConflicts.bind(this));

        this.emit('resolve', conflictId, data);
    };

    ConflictResolver.prototype.onConflictUnresolved = function (conflictId) {
        delete this._pendingResolvedConflicts[conflictId];
        this._pendingRevertedConflicts[conflictId] = true;
        if (this._timeoutSave) {
            clearTimeout(this._timeoutSave);
        }
        this._timeoutSave = setTimeout(this.saveConflicts.bind(this));

        this.emit('unresolve', conflictId);
    };

    ConflictResolver.prototype.saveConflicts = function () {
        var useSrc = [];
        var useDst = [];
        var revert = Object.keys(this._pendingRevertedConflicts);

        for (var conflictId in this._pendingResolvedConflicts) {
            if (this._pendingResolvedConflicts[conflictId].useSrc) {
                useSrc.push(conflictId);
            } else {
                useDst.push(conflictId);
            }
        }

        if (useSrc.length) {
            editor.call('branches:resolveConflicts', this._mergeId, useSrc, { useSrc: true });
        }
        if (useDst.length) {
            editor.call('branches:resolveConflicts', this._mergeId, useDst, { useDst: true });
        }
        if (revert.length) {
            editor.call('branches:resolveConflicts', this._mergeId, revert, { revert: true });
        }
    };

    ConflictResolver.prototype.createSection = function (title, foldable) {
        var section = new ui.ConflictSection(this, title, foldable);
        section.on('resolve', this.onConflictResolved.bind(this));
        section.on('unresolve', this.onConflictUnresolved.bind(this));
        this.elements.push(section);
        return section;
    };

    ConflictResolver.prototype.createSeparator = function (title) {
        var label = new ui.Label({
            text: title
        });
        label.class.add('section-separator');
        this.elements.push(label);
        return label;
    };

    ConflictResolver.prototype.appendToParent = function (parent) {
        for (var i = 0, len = this.elements.length; i < len; i++) {
            var element = this.elements[i];
            if (element instanceof ui.ConflictSection) {
                if (element.numConflicts) {
                    parent.append(element.panel);
                }
            } else {
                parent.append(element);
            }
        }

        // Reflow (call onAddedToDom) after 2 frames. The reason why it's 2 frames
        // and not 1 is it doesn't always work on 1 frame and I don't know why yet..
        var self = this;
        requestAnimationFrame(function () {
            requestAnimationFrame(self.reflow.bind(self));
        });
    };

    ConflictResolver.prototype.reflow = function () {
        for (var i = 0, len = this.elements.length; i < len; i++) {
            var element = this.elements[i];
            if (element instanceof ui.ConflictSection) {
                element.onAddedToDom();
            }
        }

        this.emit('reflow');
    };

    ConflictResolver.prototype.resolveUsingSource = function () {
        for (var i = 0, len = this.elements.length; i < len; i++) {
            var element = this.elements[i];
            if (element instanceof ui.ConflictSection) {
                element.resolveUsingSource();
            }
        }
    };

    ConflictResolver.prototype.resolveUsingDestination = function () {
        for (var i = 0, len = this.elements.length; i < len; i++) {
            var element = this.elements[i];
            if (element instanceof ui.ConflictSection) {
                element.resolveUsingDestination();
            }
        }
    };

    ConflictResolver.prototype.destroy = function () {
        this.unbind();

        for (var i = 0, len = this.elements.length; i < len; i++) {
            this.elements[i].destroy();
        }
        this.elements.length = 0;
    };

    window.ui.ConflictResolver = ConflictResolver;
});
