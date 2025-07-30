import { Element, SelectInput } from '@playcanvas/pcui';

/**
 * @import { Observer } from '@playcanvas/observer';
 * @import { SelectInputArgs } from '@playcanvas/pcui';
 */

/**
 * @typedef BatchGroupInputArgs
 * @property {Observer} [projectSettings] - The project settings observer.
 */

/**
 * A select input that holds batch group options.
 */
class BatchGroupInput extends SelectInput {
    /**
     * Creates a new BatchGroupInput.
     *
     * @param {BatchGroupInputArgs & SelectInputArgs} [args] - The arguments.
     */
    constructor(args = {}) {
        args.type = 'number';
        args.allowNull = true;
        args.allowInput = true;
        args.allowCreate = true;
        args.createLabelText = 'Create';
        args.options = [];

        super(args);

        this._createFn = this._createGroup.bind(this);

        this._projectSettings = args.projectSettings;

        this._refreshOptions();
    }

    _refreshOptions() {
        const options = [{
            v: null, t: 'None'
        }];

        const batchGroups = this._projectSettings.get('batchGroups');
        if (batchGroups) {
            for (const key in batchGroups) {
                options.push({
                    v: parseInt(key, 10), t: batchGroups[key].name
                });
            }
        }


        this.options = options;
    }

    _createGroup(name) {
        const group = editor.call('editorSettings:batchGroups:create', name);
        this._refreshOptions();
        this.value = group;
        editor.call('selector:set', 'editorSettings', [this._projectSettings]);
        setTimeout(() => {
            editor.call('editorSettings:batchGroups:focus', group);
        });
    }

    link(observers, paths) {
        // order is important here
        // we have to refresh the options first
        // and then link because updating options
        // hides tags
        this._refreshOptions();
        super.link(observers, paths);
    }
}

Element.register('batchgroup', BatchGroupInput, { renderChanges: true });

export { BatchGroupInput };
