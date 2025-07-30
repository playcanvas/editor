import { Events } from '@playcanvas/observer';

import { ConflictSectionRow } from './conflict-section-row.ts';
import { LegacyLabel } from '../../../../common/ui/label.ts';
import { LegacyPanel } from '../../../../common/ui/panel.ts';

// A section contains multiple conflicts and it's meant to group
// conflicts into meaningful categories
class ConflictSection extends Events {
    constructor(resolver, title, foldable, allowCloaking) {
        super();

        this._resolver = resolver;
        this._numConflicts = 0;
        this._numResolvedConflicts = 0;
        this._indent = 0;

        this._foldable = foldable;
        this._allowCloaking = allowCloaking;
        this._cloaked = false;
        this._cloakFn = this.cloakIfNecessary.bind(this);

        this.panel = new LegacyPanel(title);
        this.panel.class.add('section');
        this.panel.foldable = foldable;
        this.panel.flex = true;
        this.panel.on('fold', () => {
            resolver.emit('section:fold');
        });
        this.panel.on('unfold', () => {
            resolver.emit('section:unfold');
        });

        if (this._allowCloaking) {
            resolver.on('section:fold', this.cloakIfNecessaryDeferred.bind(this));
            resolver.on('section:unfold', this.cloakIfNecessaryDeferred.bind(this));
            resolver.on('scroll', this.cloakIfNecessaryDeferred.bind(this));
        }

        this._panelBase = new LegacyPanel();
        this._panelBase.class.add('base');
        this.panel.append(this._panelBase);
        this._panelBase.hidden = resolver.isDiff;

        this._panelDest = new LegacyPanel();
        this._panelDest.class.add('mine');
        this.panel.append(this._panelDest);

        this._panelSource = new LegacyPanel();
        this._panelSource.class.add('theirs');
        this.panel.append(this._panelSource);

        this.panels = [
            this._panelBase,
            this._panelDest,
            this._panelSource
        ];

        this._labelNumConflicts = new LegacyLabel({
            text: '0/0'
        });
        this._labelNumConflicts.renderChanges = false;
        this._labelNumConflicts.class.add('num-conflicts');
        this._labelNumConflicts.hidden = resolver.isDiff;
        this.panel.headerElement.appendChild(this._labelNumConflicts.element);

        this._rows = [];
    }

    indent() {
        this._indent++;
    }

    unindent() {
        this._indent--;
    }

    // Adds a title that spans all 3 panels
    appendTitle(title, light) {
        let label;

        const startIndex = this._resolver.isDiff ? 1 : 0;

        for (let i = startIndex; i < 3; i++) {
            label = new LegacyLabel({
                text: i === startIndex ? title : ''
            });
            label.class.add('title');
            if (light) {
                label.class.add('light');
            }
            if (this._indent) {
                label.class.add(`indent-${this._indent}`);
            }
            this.panels[i].append(label);
        }
    }

    /**
     * Append a new field to the section. This will create
     * a new field on all 3 panels (base, source, destination);
     *
     * @param {object} args - The field options
     * @param {string} args.name - The name of the field
     * @param {boolean} args.prettify - If true the name will be 'prettified'
     * @param {string} args.type - The type of the field if it's the same for all base, source and destination values
     * @param {string} args.baseType - The type of the base value
     * @param {string} args.sourceType - The type of the source value
     * @param {string} args.destType - The type of the destination value
     * @param {object} args.conflict - The conflict object
     */
    appendField(args) {
        const row = new ConflictSectionRow(this._resolver, args);
        this._rows.push(row);

        for (let i = 0; i < this._indent; i++) {
            row.indent();
        }

        row.appendToParents(this.panels);

        row.on('resolve', this.onConflictResolved.bind(this));
        row.on('unresolve', this.onConflictUnresolved.bind(this));

        this.numConflicts++;
        if (row.resolved) {
            this.numResolvedConflicts++;
        }
    }

    appendAllFields(args) {
        const fields = args.fields;
        const title = args.title;
        const except = args.except;
        const schema = args.schema;

        // check if 'fields' is actually a conflict object already
        // and if missingInDst or missingInSrc is true in which case
        // report this entry as 'deleted' or 'edited' in the UI
        if (fields.missingInDst || fields.missingInSrc) {
            this.appendField({
                type: editor.call(`schema:${schema}:getType`, fields.path),
                conflict: fields
            });
            return;
        }

        let addedTitle = false;

        for (const field in fields) {
            if (except && except.indexOf(field) !== -1) continue;

            const path = fields[field].path;
            if (!path) continue;

            if (!addedTitle && title) {
                addedTitle = true;
                this.appendTitle(title);
            }

            const type = editor.call(`schema:${schema}:getType`, path);

            this.appendField({
                name: field,
                type: type,
                conflict: fields[field],
                prettify: true
            });
        }
    }

    onConflictResolved(conflictId, data) {
        this.numResolvedConflicts++;
        this.emit('resolve', conflictId, data);
    }

    onConflictUnresolved(conflictId) {
        this.numResolvedConflicts--;
        this.emit('unresolve', conflictId);
    }

    onAddedToDom() {
        // make value fields in the same row have equal heights
        for (let i = 0, len = this._rows.length; i < len; i++) {
            this._rows[i].onAddedToDom();
        }

        if (this._allowCloaking) {
            this.cloakIfNecessary();
        }
    }

    cloakIfNecessaryDeferred() {
        setTimeout(this._cloakFn, 100);
    }

    // Checks if the section is visible in the viewport. If not it will 'cloak'
    // it meaning it will hide all of its contents but keep its original height
    // to make the DOM faster to render
    cloakIfNecessary() {
        if (!this.panel.parent) {
            return;
        }

        const parentRect = this.panel.parent.element.getBoundingClientRect();
        const rect = this.panel.element.getBoundingClientRect();
        const safetyMargin = 200;
        if (rect.bottom < parentRect.top - safetyMargin || rect.top > parentRect.bottom + safetyMargin) {
            if (!this._cloaked) {
                this._cloaked = true;
                const height = rect.height;
                this.panel.element.style.height = `${height}px`;
                this.panel.class.remove('foldable');
                this.panel.class.add('cloaked');
            }
        } else if (this._cloaked) {
            this._cloaked = false;
            this.panel.element.style.height = '';
            this.panel.class.remove('cloaked');
            if (this._foldable) {
                this.panel.foldable = true;
            }
        }
    }

    resolveUsingSource() {
        for (let i = 0, len = this._rows.length; i < len; i++) {
            this._rows[i].resolveUsingSource();
        }
    }

    resolveUsingDestination() {
        for (let i = 0, len = this._rows.length; i < len; i++) {
            this._rows[i].resolveUsingDestination();
        }
    }

    destroy() {
        this.unbind();
        this.panel.destroy();
        this.panels.length = 0;
        this._rows.forEach((row) => {
            row.destroy();
        });
        this._rows.length = 0;
    }

    set numConflicts(value) {
        this._numConflicts = value;
        this._labelNumConflicts.text = `${this._numResolvedConflicts}/${this._numConflicts}`;
    }

    get numConflicts() {
        return this._numConflicts;
    }

    set numResolvedConflicts(value) {
        this._numResolvedConflicts = value;
        this._labelNumConflicts.text = `${this._numResolvedConflicts}/${this._numConflicts}`;
    }

    get numResolvedConflicts() {
        return this._numResolvedConflicts;
    }
}

export { ConflictSection };
