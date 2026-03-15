import { Events } from '@playcanvas/observer';
import { BooleanInput, Container, Label, Panel } from '@playcanvas/pcui';

import { LegacyTooltip } from '@/common/ui/tooltip';

type VersionControlSidePanelBoxArgs = {
    /** The box title */
    header?: string;
    /** The text of the note next to the header */
    headerNote?: string;
    /** If true then this box will also contain a panel to take a checkpoint in the target branch */
    createTargetCheckpoint?: boolean;
    /** The text of the help tooltip in the target checkpoint panel */
    targetCheckpointHelp?: string;
    /** If true then this box will also contain a panel to take a checkpoint in the source branch */
    createSourceCheckpoint?: boolean;
    /** The text of the help tooltip in the source checkpoint panel */
    sourceCheckpointHelp?: string;
    /** If true then this box will also contain a checkbox to close the source branch after merging */
    closeSourceBranch?: boolean;
    /** The text of the help tooltip in the close source branch panel */
    closeSourceBranchHelp?: string;
    /** If true the box header will not have a top left icon */
    noIcon?: boolean;
};

/**
 * Represents a box widget that is commonly used in version control side panels.
 */
class VersionControlSidePanelBox extends Events {
    panel: Panel;

    children: any[] = [];

    panelTargetCheckpoint?: Container;

    checkboxTargetCheckpoint?: BooleanInput;

    panelSourceCheckpoint?: Container;

    checkboxSourceCheckpoint?: BooleanInput;

    panelSourceClose?: Container;

    checkboxSourceClose?: BooleanInput;

    constructor(args: VersionControlSidePanelBoxArgs = {}) {
        super();

        // main box panel
        this.panel = new Panel({
            headerText: args.header || ' ',
            flex: true,
            class: args.noIcon ? ['version-control-side-panel-box', 'no-icon'] : 'version-control-side-panel-box'
        });

        const titleEl = this.panel.header.dom.querySelector('.pcui-panel-header-title');
        if (titleEl) {
            titleEl.classList.add('selectable');
        }

        // add little note on the right of the header
        if (args.headerNote) {
            const labelHeader = new Label({
                text: args.headerNote,
                class: 'header-note'
            });
            this.panel.header.append(labelHeader);
        }

        if (args.createTargetCheckpoint) {
            [this.panelTargetCheckpoint, this.checkboxTargetCheckpoint] = this._createCheckbox(
                'Create checkpoint first?',
                args.targetCheckpointHelp
            );
            this.checkboxTargetCheckpoint.value = true;

            this.checkboxTargetCheckpoint.on('change', (value: boolean) => {
                this.emit('createTargetCheckpoint', value);
            });
        }

        if (args.createSourceCheckpoint) {
            [this.panelSourceCheckpoint, this.checkboxSourceCheckpoint] = this._createCheckbox(
                'Create checkpoint first?',
                args.sourceCheckpointHelp
            );

            this.checkboxSourceCheckpoint.on('change', (value: boolean) => {
                this.emit('createSourceCheckpoint', value);
            });
        }

        if (args.closeSourceBranch) {
            [this.panelSourceClose, this.checkboxSourceClose] = this._createCheckbox(
                'Close branch after merging?',
                args.closeSourceBranchHelp
            );
            this.panelSourceClose.dom.style.paddingTop = '0';
            this.panelSourceClose.dom.style.borderTop = '0';

            this.checkboxSourceClose.on('change', (value: boolean) => {
                this.emit('closeSourceBranch', value);
            });
        }
    }

    _createCheckbox(msg: string, tooltipMsg?: string): [Container, BooleanInput] {
        const container = new Container({
            flexGrow: 1,
            class: 'checkpoint-checkbox'
        });
        const label = new Label({
            text: msg
        });
        container.append(label);

        const checkbox = new BooleanInput({
            class: 'tick'
        });
        container.append(checkbox);

        // add little help icon
        const labelHelp = new Label({
            text: '\uE138',
            class: 'help'
        });
        container.append(labelHelp);

        if (tooltipMsg) {
            const tooltip = LegacyTooltip.attach({
                target: labelHelp.dom,
                text: tooltipMsg,
                align: 'top',
                root: editor.call('layout.root')
            });
            tooltip.class.add('version-control-checkbox-tooltip');
        }

        return [container, checkbox];
    }

    /**
     * Adds specified panel to the box
     *
     * @param panel - The panel
     */
    append(panel: any) {
        // make sure we remove the checkpoint panels first
        // because they are meant to be added to the end
        if (this.panelTargetCheckpoint) {
            this.panel.content.remove(this.panelTargetCheckpoint);
        }
        if (this.panelSourceCheckpoint) {
            this.panel.content.remove(this.panelSourceCheckpoint);
        }
        if (this.panelSourceClose) {
            this.panel.content.remove(this.panelSourceClose);
        }

        this.panel.content.append(panel);
        this.children.push(panel);

        // add checkpoint panels after the content
        if (this.panelTargetCheckpoint) {
            this.panel.content.append(this.panelTargetCheckpoint);
        }
        if (this.panelSourceCheckpoint) {
            this.panel.content.append(this.panelSourceCheckpoint);
        }
        if (this.panelSourceClose) {
            this.panel.content.append(this.panelSourceClose);
        }
    }

    /**
     * Creates a panel to show info for the specified checkpoint and adds this panel to the box
     *
     * @param checkpoint - The checkpoint
     */
    setCheckpoint(checkpoint: Record<string, unknown> | null) {
        // create panel to show checkpoint info
        if (checkpoint) {
            const panel = editor.call('picker:versioncontrol:widget:checkpoint', checkpoint);
            this.append(panel);

            // this needs to be called to update the 'read more' button
            panel.onAddedToDom();
        } else {
            // add checkpoint panels after the content
            if (this.panelTargetCheckpoint && !this.panelTargetCheckpoint.parent) {
                this.panel.content.append(this.panelTargetCheckpoint);
            }
            if (this.panelSourceCheckpoint && !this.panelSourceCheckpoint.parent) {
                this.panel.content.append(this.panelSourceCheckpoint);
            }
            if (this.panelSourceClose && !this.panelSourceClose.parent) {
                this.panel.content.append(this.panelSourceClose);
            }
        }
    }

    /**
     * Clears the contents of the box
     */
    clear() {
        if (this.panelTargetCheckpoint) {
            this.panel.content.remove(this.panelTargetCheckpoint);
            this.checkboxTargetCheckpoint.value = true;
        }
        if (this.panelSourceCheckpoint) {
            this.panel.content.remove(this.panelSourceCheckpoint);
            this.checkboxSourceCheckpoint.value = false;
        }
        if (this.panelSourceClose) {
            this.panel.content.remove(this.panelSourceClose);
            this.checkboxSourceClose.value = false;
        }

        this.children.forEach((child: any) => {
            child.destroy();
        });
        this.children.length = 0;
    }

    /**
     * Set the header text of the box.
     */
    set header(value: string) {
        this.panel.headerText = value;
    }

    /**
     * Get the header text of the box.
     */
    get header() {
        return this.panel.headerText;
    }
}

export { VersionControlSidePanelBox };
