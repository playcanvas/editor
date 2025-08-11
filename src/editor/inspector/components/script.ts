import { Panel, Container, Button, BooleanInput, LabelGroup, Label, SelectInput, BindingTwoWay, ArrayInput } from '@playcanvas/pcui';

import { ComponentInspector } from './component.ts';
import { CLASS_ERROR, DEFAULTS } from '../../../common/pcui/constants.ts';
import { AssetInput } from '../../../common/pcui/element/element-asset-input.ts';
import { tooltip, tooltipSimpleItem } from '../../../common/tooltips.ts';
import { LegacyTooltip } from '../../../common/ui/tooltip.ts';
import { deepCopy } from '../../../common/utils.ts';
import { evaluate } from '../../scripting/expr-eval/evaluate.ts';
import { parse } from '../../scripting/expr-eval/parser.ts';
import { AttributesInspector } from '../attributes-inspector.ts';

/** @import { Attribute } from '../attribute.type.d.ts' */
/** @import { ASTNode } from '../../scripting/expr-eval/parser.js' */

const CLASS_SCRIPT_CONTAINER = 'script-component-inspector-scripts';
const CLASS_SCRIPT = 'script-component-inspector-script';
const CLASS_SCRIPT_ENABLED = `${CLASS_SCRIPT}-enabled`;
const CLASS_SCRIPT_VALID = `${CLASS_SCRIPT}-valid`;
const CLASS_SCRIPT_INVALID = `${CLASS_SCRIPT}-invalid`;

const ATTRIBUTE_SUBTITLES = {
    boolean: '{Boolean}',
    number: '{Number}',
    string: '{String}',
    json: '{Object}',
    asset: '{pc.Asset}',
    entity: '{pc.Entity}',
    rgb: '{pc.Color}',
    rgba: '{pc.Color}',
    vec2: '{pc.Vec2}',
    vec3: '{pc.Vec3}',
    vec4: '{pc.Vec4}',
    curve: '{pc.Curve}'
};

class ScriptInspector extends Panel {
    /**
     * AST cache for script parsing. This means expressions are parsed only once,
     * and then the AST is cached for future evaluation.
     *
     * @type {Map<string, ASTNode>}
     */
    _astCache = new Map();

    constructor(args) {
        super(args);

        this._componentInspector = args.componentInspector;
        this._scriptName = args.scriptName;

        this.containerErrors = new Container({
            hidden: true,
            class: CLASS_ERROR
        });
        this.append(this.containerErrors);

        this._attributesInspector = null;

        this._history = args.history;
        this._argsAssets = args.assets;
        this._argsEntities = args.entities;
        this._templateOverridesInspector = args.templateOverridesInspector;

        this._asset = editor.call('assets:scripts:assetByScript', this._scriptName);

        // Map of attribute name -> string[] warnings (first sentence only)
        this._attributeWarnings = new Map();

        if (this._asset) {
            this._initializeScriptAttributes();
        }

        this._labelTitle.on('click', this._onClickTitle.bind(this));

        const doesScriptNameCollide = editor.call('assets:scripts:collide', this._scriptName);

        if (!this._asset || doesScriptNameCollide) {
            this.class.add(CLASS_SCRIPT_INVALID);
        }

        this._btnEdit = new Button({
            icon: 'E130',
            class: CLASS_SCRIPT_VALID,
            enabled: true,
            ignoreParent: true,
            tabIndex: -1
        });
        this._btnEdit.style.fontSize = '15px';
        this.header.append(this._btnEdit);
        this._btnEdit.on('click', this._onClickEdit.bind(this));

        const tooltipEdit = LegacyTooltip.attach({
            target: this._btnEdit.dom,
            text: editor.call('permissions:write') ? 'Edit' : 'View',
            align: 'bottom',
            root: editor.call('layout.root')
        });
        this._btnEdit.once('destroy', () => {
            tooltipEdit.destroy();
        });

        this._btnParse = new Button({
            icon: 'E128',
            class: CLASS_SCRIPT_VALID,
            tabIndex: -1
        });
        this._btnParse.style.marginRight = '6px';
        this._btnParse.style.fontSize = '15px';
        this.header.append(this._btnParse);
        this._btnParse.on('click', this._onClickParse.bind(this));

        const tooltipParse = LegacyTooltip.attach({
            target: this._btnParse.dom,
            text: 'Parse',
            align: 'bottom',
            root: editor.call('layout.root')
        });
        this._btnParse.on('destroy', () => {
            tooltipParse.destroy();
        });

        this._fieldEnable = new BooleanInput({
            type: 'toggle',
            binding: new BindingTwoWay({
                history: args.history
            })
        });

        const enableGroup = new LabelGroup({
            text: 'On',
            class: CLASS_SCRIPT_ENABLED,
            field: this._fieldEnable
        });
        this.header.append(enableGroup);

        this._fieldEnable.on('change', (value) => {
            enableGroup.text = value ? 'On' : 'Off';
        });

        if (this._templateOverridesInspector) {
            this._templateOverridesInspector.registerElementForPath(`components.script.scripts.${this._scriptName}.enabled`, enableGroup);

            enableGroup.once('destroy', () => {
                this._templateOverridesInspector.unregisterElementForPath(`components.script.scripts.${this._scriptName}.enabled`);
            });
        }

        this._labelInvalid = new Label({
            text: '!',
            class: CLASS_SCRIPT_INVALID
        });
        this.header.appendBefore(this._labelInvalid, this._labelTitle);

        this._tooltipInvalid = tooltipSimpleItem({
            text: this._getInvalidTooltipText()
        });
        tooltip().attach({
            container: this._tooltipInvalid,
            target: this._labelInvalid,
            horzAlignEl: this
        });

        this._entities = null;
        this._entityEvents = [];
        this._editorEvents = [];

        this._timeoutChangeAttributes = null;
        this._changedAttributes = {};

        this._editorEvents.push(editor.on(`assets:scripts[${this._scriptName}]:attribute:set`, this._onAddAttribute.bind(this)));
        this._editorEvents.push(editor.on(`assets:scripts[${this._scriptName}]:attribute:unset`, this._onRemoveAttribute.bind(this)));
        this._editorEvents.push(editor.on(`assets:scripts[${this._scriptName}]:attribute:change`, this._onChangeAttribute.bind(this)));
        this._editorEvents.push(editor.on(`assets:scripts[${this._scriptName}]:attribute:move`, this._onMoveAttribute.bind(this)));
        this._editorEvents.push(editor.on(`assets:scripts[${this._scriptName}]:primary:set`, this._onPrimaryScriptSet.bind(this)));
        this._editorEvents.push(editor.on(`assets:scripts[${this._scriptName}]:primary:unset`, this._onPrimaryScriptUnset.bind(this)));
    }

    _initializeScriptAttributes() {
        const attributes = this._asset.get(`data.scripts.${this._scriptName}.attributes`);
        if (!attributes) {
            return;
        }

        this._attributes = attributes;

        const order = this._asset.get(`data.scripts.${this._scriptName}.attributesOrder`) || [];

        // script attributes inspector
        /**
         * @type {Attribute[]}
         */
        const ATTRIBUTES = order.map((attribute) => {
            return this._convertAttributeDataToInspectorData(attribute, attribute, attributes[attribute]);
        });

        if (this._attributesInspector) {
            this._attributesInspector.destroy();
        }

        this._attributesInspector = new AttributesInspector({
            attributes: ATTRIBUTES,
            history: this._history,
            assets: this._argsAssets,
            entities: this._argsEntities,
            templateOverridesInspector: this._templateOverridesInspector
        });

        this._attributesInspector.on('change', (attributeData) => {
            this._updateAttributeStatus(this._attributes, attributeData);
        });

        if (this._entities) {
            this._attributesInspector.link(this._entities);
        }



        this.append(this._attributesInspector);
    }

    _getInvalidTooltipText() {
        if (editor.call('assets:scripts:collide', this._scriptName)) {
            return `'${this._scriptName}' Script Object is defined in multiple preloaded assets. Please uncheck preloading for undesirable script assets.`;
        }
        if (!this._asset) {
            return `'${this._scriptName}' Script Object is not defined in any preloaded script assets.`;
        }

        return '';
    }

    _onClickTitle(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        if (this._asset) {
            editor.call('selector:set', 'asset', [this._asset]);
        }
    }

    _onClickEdit(evt) {
        if (this._asset) {
            editor.call('assets:edit', this._asset);
        }
    }

    _onClickParse(evt) {
        if (!this._asset) {
            return;
        }

        this._componentInspector.clearParseErrors();
        this.containerErrors.hidden = true;
        this.containerErrors.clear();

        this._btnParse.enabled = false;
        this._btnParse.class.remove(CLASS_ERROR);

        editor.call('scripts:parse', this._asset, (error, result) => {
            if (this.destroyed) {
                return;
            } // inspector might have been destroyed while waiting for parse results
            this._btnParse.enabled = true;

            if (error) {
                this._btnParse.class.add(CLASS_ERROR);

                this._componentInspector.onParseError(error.message, this._scriptName);
            } else {
                result.scriptsInvalid.forEach((invalidScript) => {
                    this._componentInspector.onParseError(invalidScript, this._scriptName);
                });

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

                const script = result.scripts[this._scriptName];
                if (script?.attributes) {
                    // Build per-attribute warnings map for this script
                    const attrInvalid = script.attributesInvalid || [];
                    const warningItems = attrInvalid.filter(w => w && w.severity === 4);
                    const warningsByAttr = new Map();
                    warningItems.forEach(w => {
                        const name = w.name || 'unknown';
                        const firstSentence = (w.message || '').split('.')[0] || w.message;
                        if (!warningsByAttr.has(name)) warningsByAttr.set(name, []);
                        warningsByAttr.get(name).push(firstSentence);
                    });
                    this._attributeWarnings = warningsByAttr;

                    // Rebuild attributes so warnings reflect in labels/tooltips
                    if (this._attributesInspector) {
                        this._attributesInspector.destroy();
                        this._attributesInspector = null;
                    }
                    this._initializeScriptAttributes();

                    // Add inline error container if there are errors for this script
                    const errors = attrInvalid.filter(error => (error.severity ? error.severity === 8 : true));

                    if (errors.length > 0) {
                        const errorContainer = new Container({ 
                            class: 'script-asset-inspector-attribute-error-container', 
                            flex: true 
                        });

                        // Always show the error header with icon
                        const errorHeader = new Label({
                            class: [CLASS_ERROR, CLASS_SCRIPT, 'script-asset-inspector-attribute-error'],
                            text: 'This script contains invalid attributes:'
                        });
                        errorContainer.append(errorHeader);

                        // List all errors in the container
                        errors.forEach((error) => {
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

                                // Log to console for simple errors
                                const fileName = this._asset.get('name') || 'unknown';
                                editor.call('console:error', `${fileName} - ${error}`);
                            }
                        });

                        // Insert error container before the attributes inspector so it appears below the header
                        this.appendBefore(errorContainer, this._attributesInspector);
                    }
                }
            }
        });
    }

    /**
     * Updates the status of attribute fields based on the current state of the script. This allows
     * for fields to be hidden or disabled based on the current state of the script.
     *
     * @param {Attribute} attr - The attribute data
     * @param {*} state - The current state of the script
     * @param {string} [path] - The path to the attribute in the state
     * @param {AttributesInspector} [inspector] - The Attribute Inspector associated with the attribute
     * @param {Set<string, ASTNode>} [unusedKeys] - Captures all AST nodes that are not used in the current state
     */
    _updateAttributeStatus(attr, state, path = `components.script.scripts.${this._scriptName}.attributes`, inspector = this._attributesInspector, unusedKeys = null) {

        const firstRecursion = !unusedKeys;

        // Create a set of all current AST nodes, and remove them as we go, so we can remove the unused ones at the end
        if (firstRecursion) {
            unusedKeys = new Set(this._astCache.keys());
        }

        Object.values(attr).forEach(({ visibleif: visibleIf, enabledif: enabledIf, name, type, array, schema }) => {
            const subPath = `${path}.${name}`;
            let field = inspector.getField(subPath);

            // Return early if the field is not found
            if (!field) {
                return;
            }

            // Specific fields are actually within a LabelGroups, and we want to target this, so we need the parent
            if (!(field instanceof AssetInput) &&
                !(field instanceof AttributesInspector) &&
                !(field instanceof ArrayInput) &&
                field.parent
            ) {
                field = field.parent;
            }

            // If the attribute contains an expression, remove it from the unused keys
            unusedKeys.delete(visibleIf);
            unusedKeys.delete(enabledIf);

            // Evaluates the condtions
            const isVisible = this._evaluateCondition(name, 'visibleif', visibleIf, state) ?? true;
            const isEnabled = this._evaluateCondition(name, 'enabledif', enabledIf, state) ?? true;

            // and update the field with them
            field.hidden = !isVisible;
            field.enabled = isEnabled;

            // Only continue if the field is a json or array attribute, ie it has sub attributes
            if (type !== 'json') {
                return;
            }

            if (array) {
                // If the field is an array, we need to loop over each element
                field.value.forEach((nestedState, i) => {
                    this._updateAttributeStatus(schema, nestedState, `${subPath}.${i}`, field._arrayElements[i].element, unusedKeys);
                });
            } else {
                // otherwise recurse into the sub attributes
                this._updateAttributeStatus(attr[name].schema, state[name], subPath, field, unusedKeys);
            }
        });

        // If we are at the first recursion, we need to clear the AST cache for the remaining keys
        if (firstRecursion) {
            unusedKeys.forEach(key => this._astCache.delete(key));
        }

    }

    _evaluateCondition(name, tag, expression, state) {

        if (!expression) {
            return true;
        }

        if (!this._astCache.has(expression)) {
            this._astCache.set(expression, parse(expression));
        }
        const expressionAst = this._astCache.get(expression);

        try {
            return !!evaluate(expressionAst, state);
        } catch (e) {
            console.error(`Attribute "${name}" has an invalid tag - '@${tag} {${expression}}'`);
            return undefined;
        }
    }

    _onClickRemove(evt) {
        super._onClickRemove(evt);

        if (!this._entities) {
            return;
        }

        editor.api.globals.entities.removeScript(this._entities.map(e => e.apiEntity), this._scriptName);
    }

    _convertAttributeDataToInspectorData(attributeName, attributePath, attributeData) {
        let type = attributeData.type;

        let fieldArgs = {};

        // figure out attribute type
        if (attributeData.enum) {
            type = 'select';
            const selectInputArgs = {
                type: attributeData.type,
                options: []
            };

            for (let i = 0; i < attributeData.enum.order.length; i++) {
                const key = attributeData.enum.order[i];
                selectInputArgs.options.push({
                    v: attributeData.enum.options[key],
                    t: key
                });
            }

            if (attributeData.array) {
                fieldArgs.elementArgs = selectInputArgs;
            } else {
                fieldArgs = selectInputArgs;
            }

        } else if (attributeData.color) {
            type = 'gradient';
            if (attributeData.color.length) {
                fieldArgs.channels = attributeData.color.length;
            }
        } else if (type === 'curve') {
            type = 'curveset';
            fieldArgs.curves = attributeData.curves || ['Value'];
            fieldArgs.hideRandomize = true;
        } else if (type === 'asset') {
            if (attributeData.assetType) {
                fieldArgs.assetType = attributeData.assetType;
            }
        } else if (type === 'number') {
            if (typeof attributeData.min === 'number' && typeof attributeData.max === 'number') {
                type = 'slider';
            }
        } else if (type === 'json') {
            if (attributeData.array) {
                // array attributes
                fieldArgs.usePanels = true;

                // create default value from schema
                fieldArgs.getDefaultFn = () => {
                    const result = {};

                    if (attributeData.schema) {
                        attributeData.schema.forEach((field) => {
                            if (field.hasOwnProperty('default')) {
                                result[field.name] = deepCopy(field.default);
                            } else {
                                if (field.array) {
                                    result[field.name] = [];
                                } else {
                                    const value = deepCopy(DEFAULTS[field.type]);
                                    if (field.type === 'curve') {
                                        if (field.color || field.curves) {
                                            const len = field.color ? field.color.length : field.curves.length;
                                            const v = field.color ? 1 : 0;
                                            value.keys = [];
                                            for (let c = 0; c < len; c++) {
                                                value.keys.push([0, v]);
                                            }
                                        }
                                    }
                                    result[field.name] = value;
                                }
                            }
                        });
                    }
                    return result;
                };

                // attribute inspector attributes for each array element
                if (!fieldArgs.elementArgs) {
                    fieldArgs.elementArgs = {};
                }
                fieldArgs.elementArgs.attributes = attributeData.schema.map((field) => {
                    return this._convertAttributeDataToInspectorData(field.name, `${attributePath}.${field.name}`, field);
                });
                fieldArgs.elementArgs.history = this._history;
                fieldArgs.elementArgs.assets = this._argsAssets;
                fieldArgs.elementArgs.entities = this._argsEntities;
                fieldArgs.elementArgs.templateOverridesInspector = this._templateOverridesInspector;

            } else {
                fieldArgs.attributes = attributeData.schema.map((field) => {
                    return this._convertAttributeDataToInspectorData(field.name, `${attributePath}.${field.name}`, field);
                });
                fieldArgs.history = this._history;
                fieldArgs.assets = this._argsAssets;
                fieldArgs.entities = this._argsEntities;
                fieldArgs.templateOverridesInspector = this._templateOverridesInspector;
            }
        }

        if (attributeData.array) {
            type = `array:${type}`;
        }

        /**
         * @type {Attribute}
         */
        const data = {
            label: attributeData.title || attributeName,
            type: type,
            path: `components.script.scripts.${this._scriptName}.attributes.${attributePath}`,
            tooltip: {
                title: attributeName,
                subTitle: this._getAttributeSubtitle(attributeData),
                description: attributeData.description || ''
            },
            args: fieldArgs
        };

        // Attach warnings to tooltip and mark as warning if present
        const warnings = this._attributeWarnings && this._attributeWarnings.get(attributeName);
        if (warnings && warnings.length) {
            data.tooltip.warnings = warnings;
            data.warning = true;
        }

        if (attributeData.default !== undefined) {
            data.value = attributeData.default;
        }

        // add additional properties
        ['precision', 'step', 'min', 'max', 'placeholder'].forEach((field) => {
            if (attributeData.hasOwnProperty(field)) {
                data.args[field] = attributeData[field];
            }
        });

        return data;
    }

    _getAttributeSubtitle(attributeData) {
        let subTitle = ATTRIBUTE_SUBTITLES[attributeData.type];

        if (attributeData.type === 'curve') {
            if (attributeData.color) {
                if (attributeData.color.length > 1) {
                    subTitle = '{pc.CurveSet}';
                }
            } else if (attributeData.curves && attributeData.curves.length > 1) {
                subTitle = '{pc.CurveSet}';
            }
        }

        if (attributeData.array) {
            subTitle = `[ ${subTitle} ]`;
        }

        return subTitle;
    }

    _onAddAttribute(asset, name, index) {
        if (this._asset !== asset || !this._asset) {
            return;
        }

        const data = this._asset.get(`data.scripts.${this._scriptName}.attributes.${name}`);
        if (!data) {
            return;
        }

        const inspectorData = this._convertAttributeDataToInspectorData(name, name, data);
        this._attributesInspector.addAttribute(inspectorData, index);
    }

    _onRemoveAttribute(asset, name) {
        if (this._asset !== asset || !this._asset) {
            return;
        }

        this._attributesInspector.removeAttribute(`components.script.scripts.${this._scriptName}.attributes.${name}`);
    }

    _onChangeAttribute(asset, name) {
        if (this._asset !== asset || !this._asset) {
            return;
        }

        this._changedAttributes[name] = true;

        if (this._timeoutChangeAttributes) {
            clearTimeout(this._timeoutChangeAttributes);
            this._timeoutChangeAttributes = null;
        }

        this._timeoutChangeAttributes = setTimeout(() => {
            this._timeoutChangeAttributes = null;
            if (this._asset !== asset || !this._asset) {
                return;
            }

            const order = this._asset.get(`data.scripts.${this._scriptName}.attributesOrder`);

            for (const attr in this._changedAttributes) {
                const index = order.indexOf(attr);
                if (index >= 0) {
                    this._onRemoveAttribute(asset, attr);
                    this._onAddAttribute(asset, attr, index);
                }
            }

            this._changedAttributes = {};
        });
    }

    _onMoveAttribute(asset, name, index) {
        if (this._asset !== asset || !this._asset) {
            return;
        }

        this._attributesInspector.moveAttribute(`components.script.scripts.${this._scriptName}.attributes.${name}`, index);
    }

    _onPrimaryScriptSet(asset) {
        this._asset = asset;
        this.class.remove(CLASS_SCRIPT_INVALID);
        this._initializeScriptAttributes();
    }

    _onPrimaryScriptUnset() {
        this.class.add(CLASS_SCRIPT_INVALID);
        this._asset = null;
        if (this._attributesInspector) {
            this._attributesInspector.destroy();
            this._attributesInspector = null;
        }

        this._tooltipInvalid.description = this._getInvalidTooltipText();
    }

    link(entities) {
        this.unlink();

        this._entities = entities;

        if (this._attributesInspector) {
            this._attributesInspector.link(entities);
        }
        this._fieldEnable.link(entities, `components.script.scripts.${this._scriptName}.enabled`);
    }

    unlink() {
        if (!this._entities) {
            return;
        }

        this._entities = null;

        if (this._attributesInspector) {
            this._attributesInspector.unlink();
        }
        this._fieldEnable.unlink();

        if (this._timeoutChangeAttributes) {
            clearTimeout(this._timeoutChangeAttributes);
            this._timeoutChangeAttributes = null;
        }

        this._changedAttributes = {};
    }

    destroy() {
        if (this._destroyed) {
            return;
        }

        this._editorEvents.forEach(e => e.unbind());
        this._editorEvents.length = 0;

        super.destroy();
    }
}

class ScriptComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'script';

        super(args);

        this._scriptPanels = {};

        this._argsAssets = args.assets;
        this._argsEntities = args.entities;

        this._editorEvents = [];

        this._selectScript = new SelectInput({
            placeholder: '+ ADD SCRIPT',
            allowInput: true,
            allowCreate: true,
            createLabelText: 'Create Script',
            createFn: this._onCreateScript.bind(this),
            optionsFn: this._updateDropDown.bind(this)
        });
        this.append(this._selectScript);

        this._selectScript.on('change', this._onSelectScript.bind(this));

        this._containerScripts = new Container({
            flex: true,
            class: CLASS_SCRIPT_CONTAINER
        });
        this._containerScripts.style.margin = '6px';
        this.append(this._containerScripts);

        this._containerScripts.on('child:dragend', this._onDragEnd.bind(this));

        this._dirtyScripts = new Set();
        this._dirtyScriptsTimeout = null;

        if (this._templateOverridesInspector) {
            this._templateOverridesInspector.registerElementForPath('components.script.order', this, this._tooltipGroup);
        }

        this._updateScriptsTimeout = null;
    }

    _createScriptPanel(scriptName) {
        const panel = new ScriptInspector({
            componentInspector: this,
            scriptName: scriptName,
            flex: true,
            collapsible: true,
            removable: true,
            assets: this._argsAssets,
            entities: this._argsEntities,
            templateOverridesInspector: this._templateOverridesInspector,
            history: this._history,
            class: CLASS_SCRIPT
        });

        this._scriptPanels[scriptName] = panel;

        if (this._templateOverridesInspector) {
            this._templateOverridesInspector.registerElementForPath(`components.script.scripts.${scriptName}`, panel);
            panel.once('destroy', () => {
                this._templateOverridesInspector.unregisterElementForPath(`components.script.scripts.${scriptName}`);
            });
        }

        this._containerScripts.append(panel);

        return panel;
    }

    _deferUpdateDirtyScripts() {
        if (this._dirtyScriptsTimeout) {
            cancelAnimationFrame(this._dirtyScriptsTimeout);
        }

        this._dirtyScriptsTimeout = requestAnimationFrame(this._updateDirtyScripts.bind(this));
    }

    _updateDirtyScripts() {
        if (this._dirtyScriptsTimeout) {
            cancelAnimationFrame(this._dirtyScriptsTimeout);
        }

        this._dirtyScriptsTimeout = null;

        if (this._dirtyScripts.size) {
            this._updateScripts(this._dirtyScripts);
        }

        this._dirtyScripts = new Set();
    }

    _updateScripts(filterScriptsSet) {
        if (!this._entities) {
            return;
        }

        const entitiesPerScript = {};

        this._entities.forEach((e, i) => {
            const order = e.get('components.script.order');
            if (!order) {
                return;
            }

            order.forEach((script, j) => {
                if (filterScriptsSet && !filterScriptsSet.has(script)) {
                    return;
                }

                if (!entitiesPerScript[script]) {
                    entitiesPerScript[script] = [e];
                } else {
                    entitiesPerScript[script].push(e);
                }

                if (!this._scriptPanels[script]) {
                    this._createScriptPanel(script);
                }

                if (i === 0) {
                    this._containerScripts.move(this._scriptPanels[script], j);
                }
            });
        });

        for (const script in entitiesPerScript) {
            const panel = this._scriptPanels[script];
            panel.sortable = this._entities.length === 1;
            panel.headerText = entitiesPerScript[script].length === this._entities.length ? script : `${script} *`;
            panel.link(entitiesPerScript[script]);
        }

        if (filterScriptsSet) {
            filterScriptsSet.forEach((script) => {
                if (!entitiesPerScript[script]) {
                    this._scriptPanels[script].destroy();
                    delete this._scriptPanels[script];
                }
            });
        }
    }

    _updateDropDown() {
        if (!this._entities) {
            return [];
        }

        const unparsed = this._findUnparsedScripts();

        this._parseUnparsedScripts(unparsed);

        return this._findDropdownScripts();
    }

    _findUnparsedScripts() {
        let assets = this._argsAssets.array();

        assets = assets.filter(a => a.get('type') === 'script');

        return assets.filter((a) => {
            return a.get('data.lastParsedHash') === '0' &&
                a.get('file.hash');
        });
    }

    _parseUnparsedScripts(assets) {
        assets.forEach(a => editor.call('scripts:parse', a, (err) => {
            a.set('data.lastParsedHash', a.get('file.hash'));
        }));
    }

    _findDropdownScripts() {
        const scripts = editor.call('assets:scripts:list');

        // do not allow scripts that already exist to be created
        this._selectScript.invalidOptions = scripts;

        // remove scripts that are added in all entities
        const counts = {};
        this._entities.forEach((e) => {
            const order = e.get('components.script.order');
            if (!order) {
                return;
            }

            order.forEach((script) => {
                if (!counts[script]) {
                    counts[script] = 1;
                } else {
                    counts[script]++;
                }
            });
        });

        // sort list
        scripts.sort((a, b) => {
            if (a.toLowerCase() > b.toLowerCase()) {
                return 1;
            }
            if (a.toLowerCase() < b.toLowerCase()) {
                return -1;
            }

            return 0;
        });

        const result = scripts.filter((s) => {
            return counts[s] !== this._entities.length;
        }).map((s) => {
            return {
                v: s,
                t: s
            };
        });

        return result;
    }

    _onSelectScript(script) {
        if (!script) {
            return;
        }

        this._selectScript.value = null;

        this._selectScript.blur();

        editor.api.globals.entities.addScript(this._entities.map(e => e.apiEntity), script);
    }

    _onCreateScript(script) {
        this._selectScript.blur();

        const filename = editor.call('picker:script-create:validate', script);
        const folder = editor.call('assets:panel:currentFolder');

        // Copy entities reference in case focus changed during script creation
        const entities = [...this._entities.map(e => e.apiEntity)];

        const onFilename = (filename) => {
            editor.call('assets:create:script', {
                filename: filename,
                parent: folder && folder.apiAsset
            }, (asset) => {
                const scripts = asset.get('data.scripts');
                if (scripts) {
                    const keys = Object.keys(scripts);
                    if (keys.length === 1) {
                        editor.api.globals.entities.addScript(entities, keys[0]);
                    }
                }
            });
        };

        if (filename) {
            onFilename(filename);
        } else {
            editor.call('picker:script-create', onFilename, script);
        }
    }

    _onDragEnd(scriptInspector, newIndex, oldIndex) {
        if (!this._entities || this._entities.length !== 1 || newIndex === oldIndex) {
            return;
        }

        this._entities[0].move('components.script.order', oldIndex, newIndex);
    }

    _onScriptAddOrRemove() {
        if (this._updateScriptsTimeout) {
            return;
        }

        this._updateScriptsTimeout = setTimeout(() => {
            this._updateScriptsTimeout = null;
            this._selectScript.options = this._findDropdownScripts();
        });
    }

    clearParseErrors() {
        for (const key in this._scriptPanels) {
            this._scriptPanels[key].containerErrors.clear();
            this._scriptPanels[key].containerErrors.hidden = true;
        }
    }

    onParseError(error, scriptName) {
        if (!this._scriptPanels[scriptName]) {
            return;
        }

        const label = new Label({
            class: CLASS_ERROR,
            text: error
        });

        this._scriptPanels[scriptName].containerErrors.append(label);
        this._scriptPanels[scriptName].containerErrors.hidden = false;
    }

    link(entities) {
        super.link(entities);

        this._updateScripts();

        entities.forEach((e) => {
            this._entityEvents.push(e.on('components.script.order:remove', (value) => {
                this._dirtyScripts.add(value);
                this._deferUpdateDirtyScripts();
            }));

            this._entityEvents.push(e.on('components.script.order:insert', (value) => {
                this._dirtyScripts.add(value);
                this._deferUpdateDirtyScripts();
            }));

            this._entityEvents.push(e.on('components.script.order:move', (value) => {
                this._dirtyScripts.add(value);
                this._deferUpdateDirtyScripts();
            }));

            this._entityEvents.push(e.on('components.script.order:set', (value) => {
                if (!value) {
                    return;
                }

                value.forEach((script) => {
                    this._dirtyScripts.add(script);
                });
                this._deferUpdateDirtyScripts();
            }));
        });

        this._editorEvents.push(editor.on('assets:scripts:add', this._onScriptAddOrRemove.bind(this)));
        this._editorEvents.push(editor.on('assets:scripts:remove', this._onScriptAddOrRemove.bind(this)));
    }

    unlink() {
        super.unlink();

        this._editorEvents.forEach(evt => evt.unbind());
        this._editorEvents.length = 0;

        this._selectScript.close();
        this._selectScript.value = '';
        this._containerScripts.clear();
        this._scriptPanels = {};
        this._dirtyScripts = new Set();

        if (this._dirtyScriptsTimeout) {
            cancelAnimationFrame(this._dirtyScriptsTimeout);
        }

        if (this._updateScriptsTimeout) {
            clearTimeout(this._updateScriptsTimeout);
            this._updateScriptsTimeout = null;
        }
    }

    destroy() {
        if (this._destroyed) {
            return;
        }

        if (this._templateOverridesInspector) {
            this._templateOverridesInspector.unregisterElementForPath('components.script.order');
        }

        super.destroy();
    }
}

export { ScriptComponentInspector };
