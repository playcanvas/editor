import { Container, Label, Panel, Button } from '@playcanvas/pcui';

import { CLASS_ERROR } from '@/common/pcui/constants';
import { tooltip } from '@/common/tooltips';

const CLASS_ROOT = 'script-asset-inspector';
const CLASS_ERROR_CONTAINER = `${CLASS_ROOT}-error-container`;
const CLASS_CONTAINER = `${CLASS_ROOT}-container`;
const CLASS_SCRIPT = `${CLASS_ROOT}-script`;
const CLASS_WARNING = `${CLASS_ROOT}-warning`;
const CLASS_ATTRIBUTE = `${CLASS_ROOT}-attribute`;
const CLASS_ATTRIBUTE_ERROR_CONTAINER = `${CLASS_ROOT}-attribute-error-container`;

const DOM = parent => [
    {
        errorContainer: new Container({
            class: CLASS_ERROR_CONTAINER
        })
    },
    {
        root: {
            noScriptsMessageContainer: new Container({ flex: true, alignItems: 'center' })
        },
        children: [{
            noScriptsMessageLabel: new Label({ text: 'No Script Objects found' })
        }]
    }
];

class ScriptAssetInspector extends Panel {
    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);
        args.headerText = 'SCRIPTS';

        super(args);
        this._asset = null;
        this._assetEvents = [];
        this._tooltips = [];

        this.buildDom(DOM(this));

        this._parseButton = new Button({ icon: 'E128', text: 'PARSE' });
        this._parseButton.on('click', this._onClickParse.bind(this));
        this.header.append(this._parseButton);
    }

    _displayScriptAttributes(scripts: Record<string, { attributes: Record<string, unknown>; attributesInvalid?: Array<{ name: string; severity?: number }> }>) {
        this._scriptAttributeContainer = new Container({ class: CLASS_CONTAINER });
        let hasScripts = false;

        // Iterate over the scripts
        Object.keys(scripts).forEach((scriptName) => {
            hasScripts = true;
            this._scriptAttributeContainer[`_${scriptName}Container`] = new Container({ flex: true });

            const scriptData = scripts[scriptName];

            // Get error and warning attributes for this script
            const scriptErrors = scriptData.attributesInvalid ?
                scriptData.attributesInvalid.filter(error => (error.severity ? error.severity === 8 : true)) :
                [];
            const scriptWarnings = scriptData.attributesInvalid ?
                scriptData.attributesInvalid.filter(error => error.severity === 4) :
                [];

            this._scriptAttributeContainer[`_${scriptName}Container`]._scriptLabel = new Label({
                text: scriptName,
                class: [CLASS_SCRIPT]
            });

            this._scriptAttributeContainer[`_${scriptName}Container`].append(this._scriptAttributeContainer[`_${scriptName}Container`]._scriptLabel);
            const hasCollision = editor.call('assets:scripts:collide', scriptName);
            if (hasCollision) {
                this._scriptAttributeContainer[`_${scriptName}Container`].append(new Label({ text: `script ${scriptName} is already defined in other asset`, class: [CLASS_SCRIPT, CLASS_ERROR] }));
            }

            const attributes = scriptData.attributes;

            this._tooltips.forEach(tooltip => tooltip.destroy());
            this._tooltips = [];


            const errorAttributeNames = scriptErrors.map(error => error.name);
            const warningAttributeNames = scriptWarnings.map(warning => warning.name);

            // If there are invalid errors, show them in red below the script header
            if (scriptErrors.length > 0) {
                const errorContainer = new Container({ class: CLASS_ATTRIBUTE_ERROR_CONTAINER, flex: true });

                // Always show the error header with icon
                const errorHeader = new Label({
                    class: [CLASS_ERROR, CLASS_SCRIPT, 'script-asset-inspector-attribute-error'],
                    text: 'This script contains invalid attributes:'
                });
                errorContainer.append(errorHeader);

                // List all errors in the container
                scriptErrors.forEach((error) => {
                    if (error.severity) {
                        // Rich error - show first sentence with line/column
                        const fileName = error.fileName || this._asset.get('name') || 'unknown';
                        const location = `${fileName}:${error.startLineNumber}:${error.startColumn}`;
                        const firstSentence = error.message.split('.')[0];

                        const errorText = new Label({
                            class: [CLASS_ERROR, 'clickable-error'],
                            text: `${location} - ${firstSentence}`
                        });

                        // Add click handler for rich errors
                        errorText.dom.addEventListener('click', () => {
                            editor.call('picker:codeeditor', this._asset, {
                                line: error.startLineNumber,
                                col: error.startColumn,
                                error: true
                            });
                        });

                        errorContainer.append(errorText);

                        // Log to console for rich errors
                        editor.call('console:error', `${location} - (${error.name}) ${error.message}`, () => {
                            editor.call('picker:codeeditor', this._asset, {
                                line: error.startLineNumber,
                                col: error.startColumn,
                                error: true
                            });
                        });
                    } else {
                        // Simple error - show as is
                        const errorText = new Label({
                            class: [CLASS_ERROR],
                            text: error
                        });
                        errorContainer.append(errorText);
                    }
                });

                editor.call('status:error', `There was an error while parsing script asset '${this._asset.get('name')}'`);
                this._scriptAttributeContainer[`_${scriptName}Container`].append(errorContainer);
            }

            scriptData.attributesOrder.forEach((attributeName) => {
                // Skip error attributes - they should not appear in the list
                if (errorAttributeNames.includes(attributeName)) {
                    return;
                }

                // Check if this attribute has a warning
                const hasWarning = warningAttributeNames.includes(attributeName);
                const attributeClasses = hasWarning ? [CLASS_ATTRIBUTE, CLASS_WARNING] : [CLASS_ATTRIBUTE];

                const attributeLabel = new Label({
                    text: attributeName,
                    class: attributeClasses
                });

                // Add click handler for warning attributes
                if (hasWarning) {
                    const warning = scriptWarnings.find(w => w.name === attributeName);
                    if (warning) {
                        attributeLabel.class.add('clickable-warning');
                        attributeLabel.dom.addEventListener('click', () => {
                            editor.call('picker:codeeditor', this._asset, {
                                line: warning.startLineNumber,
                                col: warning.startColumn
                            });
                        });
                    }
                }

                const attributeData = attributes[attributeName];

                const warningsForThisAttribute = scriptWarnings
                .filter(w => w.name === attributeName)
                .map(w => w.message);

                // Create tooltip content with reference info and warnings
                const tooltipContainer = new Container({
                    class: ['tooltip-reference'],
                    flex: true
                });

                // Add reference information
                tooltipContainer.append(new Label({
                    class: 'title',
                    text: attributeName
                }));
                tooltipContainer.append(new Label({
                    class: 'subtitle',
                    text: editor.call('assets:scripts:typeToSubTitle', attributeData)
                }));
                tooltipContainer.append(new Label({
                    class: 'desc',
                    text: (attributeData.description || attributeData.title || '')
                }));
                tooltipContainer.append(new Label({
                    class: 'code',
                    text: JSON.stringify(attributeData, null, 4),
                    hidden: !attributeData
                }));

                // Add warnings section if there are any
                if (warningsForThisAttribute.length > 0) {
                    const warningsTitle = new Label({
                        class: ['warnings-title', 'script-asset-inspector-warning'],
                        text: 'Warnings'
                    });
                    tooltipContainer.append(warningsTitle);

                    warningsForThisAttribute.forEach((warningText: string) => {
                        tooltipContainer.append(new Label({
                            class: ['warning-item', 'script-asset-inspector-warning'],
                            text: warningText
                        }));
                    });
                }

                tooltip().attach({
                    container: tooltipContainer,
                    target: attributeLabel,
                    horzAlignEl: this
                });
                this._tooltips.push(tooltipContainer);

                this._scriptAttributeContainer[`_${scriptName}Container`].append(attributeLabel);
            });
            this._scriptAttributeContainer.append(this._scriptAttributeContainer[`_${scriptName}Container`]);
        });
        this.append(this._scriptAttributeContainer);
        this._noScriptsMessageContainer.hidden = hasScripts;
        this._scriptAttributeContainer.hidden = !hasScripts;
    }

    _onClickParse() {
        this._parseButton.disabled = true;
        this._errorContainer.hidden = true;
        this._errorContainer.clear();
        editor.call('scripts:parse', this._asset, (error, result) => {
            if (this._scriptAttributeContainer) {
                this._scriptAttributeContainer.destroy();
            }

            this._parseButton.disabled = false;
            if (error) {
                this._errorContainer.hidden = false;
                this._errorContainer.append(new Label({ text: error.message, class: [CLASS_SCRIPT, CLASS_ERROR] }));
                return;
            }
            if (result.scriptsInvalid.length > 0) {
                this._errorContainer.append(new Label({ text: 'This Script contains errors', class: [CLASS_SCRIPT, CLASS_ERROR] }));
                result.scriptsInvalid.forEach((invalidScript) => {
                    if (typeof invalidScript === 'string') {
                        // Simple string error
                        this._errorContainer.append(new Label({ text: invalidScript, class: [CLASS_SCRIPT, CLASS_ERROR] }));
                    } else {
                        // Rich error object with file, line, column, message
                        const fileName = invalidScript.file || this._asset.get('name') || 'unknown';
                        const location = `${fileName}:${invalidScript.line}:${invalidScript.column}`;
                        const errorText = `${location} - ${invalidScript.message}`;

                        const errorLabel = new Label({
                            text: errorText,
                            class: [CLASS_SCRIPT, CLASS_ERROR, 'clickable-error']
                        });

                        // Add click handler to open code editor
                        errorLabel.dom.addEventListener('click', () => {
                            editor.call('picker:codeeditor', this._asset, {
                                line: invalidScript.line,
                                col: invalidScript.column
                            });
                        });

                        this._errorContainer.append(errorLabel);
                    }
                });
                this._errorContainer.hidden = false;
                return;
            }

            // Process attribute validation issues before displaying attributes
            for (const scriptName in result.scripts) {
                const attrInvalid = result.scripts[scriptName].attributesInvalid;

                const warnings = attrInvalid.filter(error => error.severity === 4);

                // Log warnings to console with click-through to code editor at the warning location
                warnings.forEach((warning) => {
                    const fileName = warning.fileName || this._asset.get('name') || 'unknown';
                    const location = `${fileName}:${warning.startLineNumber}:${warning.startColumn}`;
                    editor.call('console:warn', `${location} - (${warning.name}) ${warning.message}`, () => {
                        editor.call('picker:codeeditor', this._asset, {
                            line: warning.startLineNumber,
                            col: warning.startColumn
                        });
                    });
                });

                // Do not add global error entries; errors are shown inline under each script title
            }

            // Now display the script attributes (warnings will be shown in yellow)
            this._displayScriptAttributes(result.scripts);
        });
    }

    link(assets: import('@playcanvas/observer').Observer[]) {
        this.unlink();
        this._asset = assets[0];
        this._displayScriptAttributes(this._asset.get('data.scripts'));
        this._errorContainer.hidden = true;
    }

    unlink() {
        if (!this._asset) {
            return;
        }
        this._assetEvents.forEach(evt => evt.unbind());
        this._assetEvents = [];
        this._tooltips.forEach(tooltip => tooltip.destroy());
        this._tooltips = [];
        if (this._scriptAttributeContainer) {
            this._scriptAttributeContainer.destroy();
            this._scriptAttributeContainer = null;
        }
    }

    destroy() {
        super.destroy();
        this.unlink();
    }
}

export { ScriptAssetInspector };
