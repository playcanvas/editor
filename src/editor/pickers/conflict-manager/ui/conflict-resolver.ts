import { Events } from '@playcanvas/observer';

import { ConflictSection } from './conflict-section';
import { LegacyLabel } from '@/common/ui/label';

// Shows all the conflicts for an item
class ConflictResolver extends Events {
    constructor(conflicts, mergeObject) {
        super();

        // holds conflict UI elements
        this.elements = [];

        this._conflicts = conflicts;
        this._mergeId = mergeObject.id;
        this.isDiff = mergeObject.isDiff;

        this.srcAssetIndex = mergeObject.srcCheckpoint.assets;
        this.dstAssetIndex = mergeObject.dstCheckpoint.assets;

        const srcScene = conflicts.itemType === 'scene' ? mergeObject.srcCheckpoint.scenes[conflicts.itemId] : null;
        this.srcEntityIndex = srcScene && srcScene.entities || {};
        const dstScene = conflicts.itemType === 'scene' ? mergeObject.dstCheckpoint.scenes[conflicts.itemId] : null;
        this.dstEntityIndex = dstScene && dstScene.entities || {};

        this.srcSettingsIndex = mergeObject.srcCheckpoint.settings;
        this.dstSettingsIndex = mergeObject.dstCheckpoint.settings;

        this._pendingResolvedConflicts = {};
        this._pendingRevertedConflicts = {};
        this._timeoutSave = null;

        this._parent = null;

        this._scrollListener = () => {
            this.emit('scroll');
        };
    }

    // When a conflict is resolved add it to the pending resolved conflicts
    // So that it's saved to the server after a frame
    onConflictResolved(conflictId, data) {
        delete this._pendingRevertedConflicts[conflictId];
        this._pendingResolvedConflicts[conflictId] = data;
        if (this._timeoutSave) {
            clearTimeout(this._timeoutSave);
        }
        this._timeoutSave = setTimeout(this.saveConflicts.bind(this));

        this.emit('resolve', conflictId, data);
    }

    // When a conflict is unresolved add it to the pending unresolved conflicts
    // so that it's saved to the server after a frame
    onConflictUnresolved(conflictId) {
        delete this._pendingResolvedConflicts[conflictId];
        this._pendingRevertedConflicts[conflictId] = true;
        if (this._timeoutSave) {
            clearTimeout(this._timeoutSave);
        }
        this._timeoutSave = setTimeout(this.saveConflicts.bind(this));

        this.emit('unresolve', conflictId);
    }

    // Save conflict status on the server
    saveConflicts() {
        const useSrc = [];
        const useDst = [];
        const revert = Object.keys(this._pendingRevertedConflicts);

        // Group conflicts by status to minimize REST API calls
        for (const conflictId in this._pendingResolvedConflicts) {
            if (this._pendingResolvedConflicts[conflictId].useSrc) {
                useSrc.push(conflictId);
            } else {
                useDst.push(conflictId);
            }
        }

        if (useSrc.length) {
            editor.api.globals.rest.conflicts.conflictsResolve({
                mergeId: this._mergeId,
                conflictIds: useSrc,
                useSrc: true
            });
        }
        if (useDst.length) {
            editor.api.globals.rest.conflicts.conflictsResolve({
                mergeId: this._mergeId,
                conflictIds: useDst,
                useDst: true
            });
        }
        if (revert.length) {
            editor.api.globals.rest.conflicts.conflictsResolve({
                mergeId: this._mergeId,
                conflictIds: revert,
                revert: true
            });
        }
    }

    // Creates a section that has a title and can be foldable. Sections contain conflicts
    createSection(title, foldable, cloakIfNecessary) {
        const section = new ConflictSection(this, title, foldable, cloakIfNecessary);
        section.on('resolve', this.onConflictResolved.bind(this));
        section.on('unresolve', this.onConflictUnresolved.bind(this));
        this.elements.push(section);
        return section;
    }

    // Creates a separator which is a title that spans all conflict panels
    createSeparator(title) {
        const label = new LegacyLabel({
            text: title
        });
        label.class.add('section-separator');
        this.elements.push(label);
        return label;
    }

    // Append the resolver to a parent
    appendToParent(parent) {
        this._parent = parent;

        for (let i = 0, len = this.elements.length; i < len; i++) {
            const element = this.elements[i];
            if (element instanceof ConflictSection) {
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
        const self = this;
        requestAnimationFrame(() => {
            requestAnimationFrame(self.reflow.bind(self));
        });
    }

    // Calls onAddedToDom on every section
    reflow() {
        for (let i = 0, len = this.elements.length; i < len; i++) {
            const element = this.elements[i];
            if (element instanceof ConflictSection) {
                element.onAddedToDom();
            }
        }

        this.emit('reflow');
    }

    // Resolves all conflicts using the source values
    resolveUsingSource() {
        for (let i = 0, len = this.elements.length; i < len; i++) {
            const element = this.elements[i];
            if (element instanceof ConflictSection) {
                element.resolveUsingSource();
            }
        }
    }

    // Resolves all conflicts using the destination values
    resolveUsingDestination() {
        for (let i = 0, len = this.elements.length; i < len; i++) {
            const element = this.elements[i];
            if (element instanceof ConflictSection) {
                element.resolveUsingDestination();
            }
        }
    }

    // Destroys the resolver and its UI elements
    destroy() {
        this.unbind();

        if (this._parent) {
            this._parent.element.removeEventListener('scroll', this._scrollListener, false);
            this._parent = null;
        }

        for (let i = 0, len = this.elements.length; i < len; i++) {
            this.elements[i].destroy();
        }
        this.elements.length = 0;
    }
}

export { ConflictResolver };
