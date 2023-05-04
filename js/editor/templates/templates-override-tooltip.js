import { Button } from '@playcanvas/pcui';

/**
 * A template override tooltip.
 */
class TemplateOverrideTooltip extends pcui.Tooltip {
    /**
     * Creates a new tooltip.
     *
     * @param {object} args - The arguments.
     * @param {import('@playcanvas/observer').Observer} args.templateRoot - The entity that
     * represents the template root in the scene.
     * @param {import('@playcanvas/observer').ObserverList} args.entities - The entities observer list.
     * @param {object} args.override - The override.
     */
    constructor(args) {
        if (!args) args = {};

        args.flex = true;

        super(args);

        this._templateRoot = args.templateRoot;
        this._entities = args.entities;
        this._override = args.override;

        this.title = 'Override';

        if (this._override.override_type === 'override_reorder_scripts') {
            this.subTitle = 'Reorder scripts';
        } else if (this._override.override_type === 'override_add_script') {
            this.subTitle = 'Add script';
        } else {
            this.subTitle = 'Adjustment';
        }

        const templates = editor.call('templates:findApplyCandidatesForOverride', this._override, this._entities, this._templateRoot);

        templates.forEach((template) => {
            // button to apply override
            const btnApply = new Button({
                text: `APPLY TO "${template.get('name')}"`,
                flexGrow: 1
            });

            btnApply.style.marginBottom = 0;
            btnApply.style.minWidth = '150px';

            btnApply.on('click', () => {
                btnApply.enabled = false;
                if (!editor.call('templates:applyOverride', template, this._override)) {
                    btnApply.enabled = true;
                }
            });

            this.append(btnApply);
        });

        // button to revert override
        const btnRevert = new Button({
            text: 'REVERT',
            flexGrow: 1
        });

        this.append(btnRevert);

        btnRevert.on('click', () => {
            editor.call('templates:revertOverride', this._override, this._entities);
        });
    }
}

export { TemplateOverrideTooltip };
