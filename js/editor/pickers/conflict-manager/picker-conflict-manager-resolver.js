editor.once('load', function () {
    // Shows all the conflicts for an item
    var ConflictResolver = function (conflicts, mergeObject) {
        window.assignEvents(this);

        // holds conflict UI elements
        this.elements = [];

        this._conflicts = conflicts;
        this._mergeId = mergeObject.id;
        this.isDiff = mergeObject.isDiff;

        this.srcAssetIndex = mergeObject.srcCheckpoint.assets;
        this.dstAssetIndex = mergeObject.dstCheckpoint.assets;

        var srcScene = conflicts.itemType === 'scene' ? mergeObject.srcCheckpoint.scenes[conflicts.itemId] : null;
        this.srcEntityIndex = srcScene && srcScene.entities || {};
        var dstScene = conflicts.itemType === 'scene' ? mergeObject.dstCheckpoint.scenes[conflicts.itemId] : null;
        this.dstEntityIndex = dstScene && dstScene.entities || {};

        this.srcSettingsIndex = mergeObject.srcCheckpoint.settings;
        this.dstSettingsIndex = mergeObject.dstCheckpoint.settings;

        this._pendingResolvedConflicts = {};
        this._pendingRevertedConflicts = {};
        this._timeoutSave = null;

        this._parent = null;

        this._scrollListener = function () {
            this.emit('scroll');
        }.bind(this);
    };

    ConflictResolver.prototype = Object.create(Events.prototype);

    // When a conflict is resolved add it to the pending resolved conflicts
    // So that it's saved to the server after a frame
    ConflictResolver.prototype.onConflictResolved = function (conflictId, data) {
        delete this._pendingRevertedConflicts[conflictId];
        this._pendingResolvedConflicts[conflictId] = data;
        if (this._timeoutSave) {
            clearTimeout(this._timeoutSave);
        }
        this._timeoutSave = setTimeout(this.saveConflicts.bind(this));

        this.emit('resolve', conflictId, data);
    };

    // When a conflict is unresolved add it to the pending unresolved conflicts
    // so that it's saved to the server after a frame
    ConflictResolver.prototype.onConflictUnresolved = function (conflictId) {
        delete this._pendingResolvedConflicts[conflictId];
        this._pendingRevertedConflicts[conflictId] = true;
        if (this._timeoutSave) {
            clearTimeout(this._timeoutSave);
        }
        this._timeoutSave = setTimeout(this.saveConflicts.bind(this));

        this.emit('unresolve', conflictId);
    };

    // Save conflict status on the server
    ConflictResolver.prototype.saveConflicts = function () {
        var useSrc = [];
        var useDst = [];
        var revert = Object.keys(this._pendingRevertedConflicts);

        // Group conflicts by status to minimize REST API calls
        for (const conflictId in this._pendingResolvedConflicts) {
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

    // Creates a section that has a title and can be foldable. Sections contain conflicts
    ConflictResolver.prototype.createSection = function (title, foldable, cloakIfNecessary) {
        var section = new ui.ConflictSection(this, title, foldable, cloakIfNecessary);
        section.on('resolve', this.onConflictResolved.bind(this));
        section.on('unresolve', this.onConflictUnresolved.bind(this));
        this.elements.push(section);
        return section;
    };

    // Creates a separator which is a title that spans all conflict panels
    ConflictResolver.prototype.createSeparator = function (title) {
        var label = new ui.Label({
            text: title
        });
        label.class.add('section-separator');
        this.elements.push(label);
        return label;
    };

    // Append the resolver to a parent
    ConflictResolver.prototype.appendToParent = function (parent) {
        this._parent = parent;

        for (let i = 0, len = this.elements.length; i < len; i++) {
            var element = this.elements[i];
            if (element instanceof ui.ConflictSection) {
                // only append a section if it has conflicts
                if (element.numConflicts) {
                    parent.append(element.panel);
                }
            } else {
                parent.append(element);
            }
        }

        parent.element.addEventListener('scroll', this._scrollListener, false);

        // Reflow (call onAddedToDom) after 2 frames. The reason why it's 2 frames
        // and not 1 is it doesn't always work on 1 frame and I don't know why yet..
        // The problem is that if we don't wait then sometimes some elements will not report
        // the correct height, probably because of some animation or delayed layout calculation
        // somewhere...
        var self = this;
        requestAnimationFrame(function () {
            requestAnimationFrame(self.reflow.bind(self));
        });
    };

    // Calls onAddedToDom on every section
    ConflictResolver.prototype.reflow = function () {
        for (let i = 0, len = this.elements.length; i < len; i++) {
            var element = this.elements[i];
            if (element instanceof ui.ConflictSection) {
                element.onAddedToDom();
            }
        }

        this.emit('reflow');
    };

    // Resolves all conflicts using the source values
    ConflictResolver.prototype.resolveUsingSource = function () {
        for (let i = 0, len = this.elements.length; i < len; i++) {
            var element = this.elements[i];
            if (element instanceof ui.ConflictSection) {
                element.resolveUsingSource();
            }
        }
    };

    // Resolves all conflicts using the destination values
    ConflictResolver.prototype.resolveUsingDestination = function () {
        for (let i = 0, len = this.elements.length; i < len; i++) {
            var element = this.elements[i];
            if (element instanceof ui.ConflictSection) {
                element.resolveUsingDestination();
            }
        }
    };

    // Destroys the resolver and its UI elements
    ConflictResolver.prototype.destroy = function () {
        this.unbind();

        if (this._parent) {
            this._parent.element.removeEventListener('scroll', this._scrollListener, false);
            this._parent = null;
        }

        for (let i = 0, len = this.elements.length; i < len; i++) {
            this.elements[i].destroy();
        }
        this.elements.length = 0;
    };

    window.ui.ConflictResolver = ConflictResolver;
});
