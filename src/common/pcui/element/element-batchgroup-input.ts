import type { Observer } from '@playcanvas/observer';
import { Element, SelectInput, SelectInputArgs } from '@playcanvas/pcui';

/**
 * The arguments for the {@link BatchGroupInput} constructor.
 */
interface BatchGroupInputArgs extends SelectInputArgs {
    /** The project settings observer */
    projectSettings?: Observer;
}

/**
 * A select input that holds batch group options.
 */
class BatchGroupInput extends SelectInput {
    protected _projectSettings?: Observer;

    constructor(args: BatchGroupInputArgs = {}) {
        const selectArgs: BatchGroupInputArgs = {
            ...args,
            type: 'number',
            allowNull: true,
            allowInput: true,
            allowCreate: true,
            createLabelText: 'Create',
            options: []
        };

        super(selectArgs);

        this._createFn = this._createGroup.bind(this);

        this._projectSettings = args.projectSettings;

        this._refreshOptions();
    }

    protected _refreshOptions() {
        const options: { v: number | null, t: string }[] = [{
            v: null, t: 'None'
        }];

        const batchGroups = this._projectSettings?.get('batchGroups');
        if (batchGroups) {
            for (const key in batchGroups) {
                options.push({
                    v: parseInt(key, 10), t: batchGroups[key].name
                });
            }
        }

        this.options = options;
    }

    protected _createGroup(name: string) {
        const group = editor.call('editorSettings:batchGroups:create', name);
        this._refreshOptions();
        this.value = group;
        editor.call('selector:set', 'editorSettings', [this._projectSettings]);
        setTimeout(() => {
            editor.call('editorSettings:batchGroups:focus', group);
        });
    }

    link(observers: Observer | Observer[], paths: string | string[]) {
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
