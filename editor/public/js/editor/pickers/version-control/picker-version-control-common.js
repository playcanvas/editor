"use strict";

/**
 * Represents a box widget that is commonly used in version control side panels
 *
 * @param {object} args - Various options for the widget
 * @param {string} [args.header] - The box title
 * @param {string} [args.headerNote] - The text of the note next to the header
 * @param {boolean} [args.discardChanges] - If true then this box will also contain a panel to discard un-checkpointed changes
 * @param {string} [args.discardChangesHelp] The text of the help tooltip in the discard changes panel
 * @param {Boolean} [args.noIcon] If true the box header will not have a top left icon
 */
var VersionControlSidePanelBox = function (args) {
    Events.call(this);

    // main box panel
    this.panel = new ui.Panel(args && args.header || ' ');
    this.panel.headerElementTitle.classList.add('selectable');

    if (args && args.noIcon) {
        this.panel.class.add('no-icon');
    }

    var panel = this.panel;
    panel.flexGrow = 1;
    panel.class.add('version-control-side-panel-box');

    // holds child panels appended to the box with the `append` method
    this.children = [];

    // add little note on the right of the header
    if (args && args.headerNote) {
        var labelHeader = new ui.Label({
            text: args.headerNote
        });
        labelHeader.class.add('header-note');
        panel.headerElement.appendChild(labelHeader.element);
    }

    // add discard your changes panel
    if (args && args.discardChanges) {
        var panelDiscard = new ui.Panel();
        this.panelDiscard = panelDiscard;
        panelDiscard.class.add('discard');
        panelDiscard.flexGrow = 1;
        var label = new ui.Label({
            text: 'Discard un-checkpointed changes?'
        });
        panelDiscard.append(label);

        var checkboxDiscardChanges = new ui.Checkbox();
        this.checkboxDiscardChanges = checkboxDiscardChanges;
        checkboxDiscardChanges.class.add('tick');
        panelDiscard.append(checkboxDiscardChanges);

        checkboxDiscardChanges.on('change', function (value) {
            this.emit('discardChanges', value);
        }.bind(this));

        // add little help icon
        var labelDiscardHelp = new ui.Label({
            text: '&#57656;',
            unsafe: true
        });
        labelDiscardHelp.class.add('help');
        panelDiscard.append(labelDiscardHelp);

        if (args.discardChangesHelp) {
            var tooltip = Tooltip.attach({
                target: labelDiscardHelp.element,
                text: args.discardChangesHelp,
                align: 'top',
                root: editor.call('layout.root')
            });
            tooltip.class.add('discard-changes-tooltip');
        }
    }
};

VersionControlSidePanelBox.prototype = Object.create(Events.prototype);

/**
 * Adds specified panel to the box
 *
 * @param {ui.Panel} panel - The panel
 */
VersionControlSidePanelBox.prototype.append = function (panel) {
    // make sure we remove the discard panel first
    // because it's meant to be added to the end
    if (this.panelDiscard) {
        this.panel.remove(this.panelDiscard);
    }

    this.panel.append(panel);
    this.children.push(panel);

    // add discard panel after the content
    if (this.panelDiscard) {
        this.panel.append(this.panelDiscard);
    }
};

/**
 * Creates a panel to show info for the specified checkpoint and adds this panel to the box
 *
 * @param {object} checkpoint - The checkpoint
 */
VersionControlSidePanelBox.prototype.setCheckpoint = function (checkpoint) {
    // create panel to show checkpoint info
    if (checkpoint) {
        var panel = editor.call('picker:versioncontrol:widget:checkpoint', checkpoint);
        this.append(panel);

        // this needs to be called to update the 'read more' button
        panel.onAddedToDom();
    } else {
        // add discard panel after the content
        if (this.panelDiscard && !this.panelDiscard.parent) {
            this.panel.append(this.panelDiscard);
        }
    }

};

/**
 * Clears the contents of the box
 */
VersionControlSidePanelBox.prototype.clear = function () {
    var panel = this.panel;

    if (this.panelDiscard) {
        panel.remove(this.panelDiscard);
        this.checkboxDiscardChanges.value = false;
    }

    this.children.forEach(function (child) {
        child.destroy();
    });
};

/**
 * Gets / sets the header text of the box
 */
Object.defineProperty(VersionControlSidePanelBox.prototype, 'header', {
    get: function () {
        return this.panel.header;
    },
    set: function (value) {
        this.panel.header = value;
    }
});

window.ui.VersionControlSidePanelBox = VersionControlSidePanelBox;
