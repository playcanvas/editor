Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'script-asset-inspector';
    const CLASS_ERROR_CONTAINER = CLASS_ROOT + '-error-container';
    const CLASS_CONTAINER = CLASS_ROOT + '-container';
    const CLASS_SCRIPT = CLASS_ROOT + '-script';
    const CLASS_ATTRIBUTE = CLASS_ROOT + '-attribute';

    const DOM = parent => [
        {
            errorContainer: new pcui.Container({
                class: CLASS_ERROR_CONTAINER
            })
        },
        {
            root: {
                noScriptsMessageContainer: new pcui.Container({ flex: true, alignItems: 'center' })
            },
            children: [{
                noScriptsMessageLabel: new pcui.Label({ text: 'No Script Objects found' })
            }]
        }
    ];

    class ScriptAssetInspector extends pcui.Panel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'SCRIPTS';

            super(args);
            this._asset = null;
            this._assetEvents = [];
            this._tooltips = [];

            this.buildDom(DOM(this));

            this._parseButton = new pcui.Button({ icon: 'E128', text: 'PARSE' });
            this._parseButton.on('click', this._onClickParse.bind(this));
            this.header.append(this._parseButton);
        }

        _displayScriptAttributes() {
            this._scriptAttributeContainer = new pcui.Container({ class: CLASS_CONTAINER });
            const scripts = this._asset.get('data.scripts');
            let hasScripts = false;
            Object.keys(scripts).forEach((scriptName) => {
                hasScripts = true;
                this._scriptAttributeContainer[`_${scriptName}Container`] = new pcui.Container({ flex: true });
                this._scriptAttributeContainer[`_${scriptName}Container`]._scriptLabel = new pcui.Label({ text: scriptName, class: CLASS_SCRIPT });
                this._scriptAttributeContainer[`_${scriptName}Container`].append(this._scriptAttributeContainer[`_${scriptName}Container`]._scriptLabel);
                const hasCollision = editor.call('assets:scripts:collide', scriptName);
                if (hasCollision)
                    this._scriptAttributeContainer[`_${scriptName}Container`].append(new pcui.Label({ text: `script ${scriptName} is already defined in other asset`, class: [CLASS_SCRIPT, pcui.CLASS_ERROR] }));
                const attributes = this._asset.get('data.scripts')[scriptName];
                attributes.attributesOrder.forEach((attributeName) => {
                    const attributeLabel = new pcui.Label({ text: attributeName, class: CLASS_ATTRIBUTE });
                    const attributeData = attributes.attributes[attributeName];

                    const tooltip = new pcui.TooltipReference({
                        reference: {
                            title: attributeName,
                            subTitle: editor.call('assets:scripts:typeToSubTitle', attributeData),
                            description: (attributeData.description || attributeData.title || ''),
                            code: JSON.stringify(attributeData, null, 4)
                        }
                    });

                    tooltip.attach({
                        target: attributeLabel,
                        elementForHorizontalAlign: this
                    });

                    this._tooltips.push(tooltip);

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

                this._displayScriptAttributes();
                this._parseButton.disabled = false;
                if (error) {
                    this._errorContainer.hidden = false;
                    this._errorContainer.append(new pcui.Label({ text: error.message, class: [CLASS_SCRIPT, pcui.CLASS_ERROR] }));
                    return;
                }
                if (result.scriptsInvalid.length > 0) {
                    this._errorContainer.append(new pcui.Label({ text: 'Validation Errors: ', class: [CLASS_SCRIPT, pcui.CLASS_ERROR] }));
                    result.scriptsInvalid.forEach((invalidScript) => {
                        this._errorContainer.append(new pcui.Label({ text: invalidScript, class: [CLASS_SCRIPT, pcui.CLASS_ERROR] }));
                    });
                    this._errorContainer.hidden = false;
                    return;
                }
                for (const scriptName in result.scripts) {
                    var attrInvalid = result.scripts[scriptName].attributesInvalid;
                    if (attrInvalid.length > 0) {
                        const label = new pcui.Label({ text: attrInvalid, class: [pcui.CLASS_ERROR, CLASS_SCRIPT] });
                        const container = this._scriptAttributeContainer[`_${scriptName}Container`];
                        if (container) {
                            container.appendAfter(label, container._scriptLabel);
                        }
                    }
                }
            });
        }

        link(assets) {
            this.unlink();
            this._asset = assets[0];
            this._displayScriptAttributes();
            this._errorContainer.hidden = true;
        }

        unlink() {
            if (!this._asset)
                return;
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

    return {
        ScriptAssetInspector: ScriptAssetInspector
    };
})());
