import { Events } from '@playcanvas/observer';

import { LegacyCheckbox } from '../../../../common/ui/checkbox.ts';
import { LegacyLabel } from '../../../../common/ui/label.ts';
import { LegacyPanel } from '../../../../common/ui/panel.ts';
import { LegacyTooltip } from '../../../../common/ui/tooltip.ts';

/**
 * Represents a box widget that is commonly used in version control side panels.
 */
class VersionControlSidePanelBox extends Events {
    /**
     * Create a new VersionControlSidePanelBox.
     *
     * @param {object} args - Various options for the widget
     * @param {string} [args.header] - The box title
     * @param {string} [args.headerNote] - The text of the note next to the header
     * @param {boolean} [args.createTargetCheckpoint] - If true then this box will also contain a panel to take a checkpoint in the target branch
     * @param {string} [args.targetCheckpointHelp] - The text of the help tooltip in the target checkpoint panel
     * @param {boolean} [args.createSourceCheckpoint] - If true then this box will also contain a panel to take a checkpoint in the source branch
     * @param {string} [args.sourceCheckpointHelp] - The text of the help tooltip in the source checkpoint panel
     * @param {boolean} [args.closeSourceBranch] - If true then this box will also contain a checkbox to close the source branch after merging
     * @param {string} [args.closeSourceBranchHelp] - The text of the help tooltip in the close source branch panel
     * @param {boolean} [args.noIcon] - If true the box header will not have a top left icon
     */
    constructor(args) {
        super();

        // main box panel
        this.panel = new LegacyPanel(args && args.header || ' ');
        this.panel.headerElementTitle.classList.add('selectable');

        if (args && args.noIcon) {
            this.panel.class.add('no-icon');
        }

        const panel = this.panel;
        panel.flexGrow = 1;
        panel.class.add('version-control-side-panel-box');

        // holds child panels appended to the box with the `append` method
        this.children = [];

        // add little note on the right of the header
        if (args && args.headerNote) {
            const labelHeader = new LegacyLabel({
                text: args.headerNote
            });
            labelHeader.class.add('header-note');
            panel.headerElement.appendChild(labelHeader.element);
        }

        if (args && args.createTargetCheckpoint) {
            [this.panelTargetCheckpoint, this.checkboxTargetCheckpoint] = this._createCheckbox(
                'Create checkpoint first?',
                args.targetCheckpointHelp
            );
            this.checkboxTargetCheckpoint.value = true;

            this.checkboxTargetCheckpoint.on('change', (value) => {
                this.emit('createTargetCheckpoint', value);
            });
        }

        if (args && args.createSourceCheckpoint) {
            [this.panelSourceCheckpoint, this.checkboxSourceCheckpoint] = this._createCheckbox(
                'Create checkpoint first?',
                args.sourceCheckpointHelp
            );

            this.checkboxSourceCheckpoint.on('change', (value) => {
                this.emit('createSourceCheckpoint', value);
            });
        }

        if (args && args.closeSourceBranch) {
            [this.panelSourceClose, this.checkboxSourceClose] = this._createCheckbox(
                'Close branch after merging?',
                args.closeSourceBranchHelp
            );
            this.panelSourceClose.style.paddingTop = '0';
            this.panelSourceClose.style.borderTop = '0';

            this.checkboxSourceClose.on('change', (value) => {
                this.emit('closeSourceBranch', value);
            });
        }
    }

    _createCheckbox(msg, tooltipMsg) {
        const panel = new LegacyPanel();
        panel.flexGrow = 1;
        const label = new LegacyLabel({
            text: msg
        });
        panel.append(label);
        panel.class.add('checkpoint-checkbox');

        const checkbox = new LegacyCheckbox();
        checkbox.class.add('tick');
        panel.append(checkbox);

        // add little help icon
        const labelHelp = new LegacyLabel({
            text: '&#57656;',
            unsafe: true
        });
        labelHelp.class.add('help');
        panel.append(labelHelp);

        if (tooltipMsg) {
            const tooltip = LegacyTooltip.attach({
                target: labelHelp.element,
                text: tooltipMsg,
                align: 'top',
                root: editor.call('layout.root')
            });
            tooltip.class.add('version-control-checkbox-tooltip');
        }

        return [panel, checkbox];
    }

    /**
     * Adds specified panel to the box
     *
     * @param {LegacyPanel} panel - The panel
     */
    append(panel) {
        // make sure we remove the checkpoint panels first
        // because they are meant to be added to the end
        if (this.panelTargetCheckpoint) {
            this.panel.remove(this.panelTargetCheckpoint);
        }
        if (this.panelSourceCheckpoint) {
            this.panel.remove(this.panelSourceCheckpoint);
        }
        if (this.panelSourceClose) {
            this.panel.remove(this.panelSourceClose);
        }

        this.panel.append(panel);
        this.children.push(panel);

        // add checkpoint panels after the content
        if (this.panelTargetCheckpoint) {
            this.panel.append(this.panelTargetCheckpoint);
        }
        if (this.panelSourceCheckpoint) {
            this.panel.append(this.panelSourceCheckpoint);
        }
        if (this.panelSourceClose) {
            this.panel.append(this.panelSourceClose);
        }
    }

    /**
     * Creates a panel to show info for the specified checkpoint and adds this panel to the box
     *
     * @param {object} checkpoint - The checkpoint
     */
    setCheckpoint(checkpoint) {
        // create panel to show checkpoint info
        if (checkpoint) {
            const panel = editor.call('picker:versioncontrol:widget:checkpoint', checkpoint);
            this.append(panel);

            // this needs to be called to update the 'read more' button
            panel.onAddedToDom();
        } else {
            // add checkpoint panels after the content
            if (this.panelTargetCheckpoint && !this.panelTargetCheckpoint.parent) {
                this.panel.append(this.panelTargetCheckpoint);
            }
            if (this.panelSourceCheckpoint && !this.panelSourceCheckpoint.parent) {
                this.panel.append(this.panelSourceCheckpoint);
            }
            if (this.panelSourceClose && !this.panelSourceClose.parent) {
                this.panel.append(this.panelSourceClose);
            }
        }
    }

    /**
     * Clears the contents of the box
     */
    clear() {
        const panel = this.panel;

        if (this.panelTargetCheckpoint) {
            panel.remove(this.panelTargetCheckpoint);
            this.checkboxTargetCheckpoint.value = true;
        }
        if (this.panelSourceCheckpoint) {
            panel.remove(this.panelSourceCheckpoint);
            this.checkboxSourceCheckpoint.value = false;
        }
        if (this.panelSourceClose) {
            panel.remove(this.panelSourceClose);
            this.checkboxSourceClose.value = false;
        }

        this.children.forEach((child) => {
            child.destroy();
        });
    }

    /**
     * Set the header text of the box.
     *
     * @type {string}
     */
    set header(value) {
        this.panel.header = value;
    }

    /**
     * Get the header text of the box.
     *
     * @type {string}
     */
    get header() {
        return this.panel.header;
    }
}

export { VersionControlSidePanelBox };
