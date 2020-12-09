Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'scripts-settings-panel';
    const CLASS_SCRIPTS_LIST = CLASS_ROOT + '-scripts-list';
    const CLASS_SCRIPTS_LIST_CONTAINER = CLASS_SCRIPTS_LIST + '-container';
    const CLASS_SCRIPTS_LIST_ITEM = CLASS_SCRIPTS_LIST + '-item';

    class ScriptsSettingsPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'SCRIPTS LOADING ORDER';

            super(args);
            this._args = args;

            this._scriptList = [];
            this._scriptEvents = [];
            this._scriptListContainer = new pcui.Container({
                class: CLASS_SCRIPTS_LIST_CONTAINER
            });
            this.append(this._scriptListContainer);

            this._assetEvents = [];

            this._scriptListContainer.on('child:dragend', (_, newIndex, oldIndex) => {
                this._projectSettings.move('scripts', oldIndex, newIndex);
            });

            this._scriptEvents.push(this._projectSettings.on('scripts:insert', this._onScriptInsert.bind(this)));
            this._scriptEvents.push(this._projectSettings.on('scripts:remove', this._onScriptRemove.bind(this)));
            this._scriptEvents.push(this._projectSettings.on('scripts:move', this._onScriptMove.bind(this)));
            this._scriptEvents.push(this._projectSettings.on('scripts:set', this._onScriptsSet.bind(this)));

            const scripts = this._projectSettings.get('scripts');

            scripts.forEach((script, i) => {
                this._onScriptInsert(script, i);
            });

        }

        _onScriptInsert(value, index) {
            const panel = this._createScriptPanel(value, index);
            this._scriptList.splice(index, 0, panel);
            const before = this._scriptListContainer.dom.childNodes[index];
            this._scriptListContainer.appendBefore(panel, before && before.ui);
        }

        _onScriptRemove(value, index) {
            const panel = this._scriptList[index];
            if (panel) {
                this._scriptList.splice(index, 1);
                panel.destroy();

                for (let i = index + 1; i < this._scriptList.length; i++) {
                    this._scriptList[i]._fieldOrder.text = `#${i + 1}`;
                }
            }
        }

        _onScriptMove(value, newIndex, oldIndex) {
            const panel = this._scriptList[oldIndex];
            if (panel) {
                this._scriptList.splice(oldIndex, 1);
                this._scriptList.splice(newIndex, 0, panel);
                this._scriptListContainer.remove(panel);
                const before = this._scriptListContainer.dom.childNodes[newIndex];
                this._scriptListContainer.appendBefore(panel, before && before.ui);

                for (let i = Math.min(newIndex, oldIndex); i < this._scriptList.length; i++) {
                    this._scriptList[i]._fieldOrder.text = `#${i + 1}`;
                }
            }
        }

        _onScriptsSet(value) {
            this._scriptList.length = 0;
            this._scriptListContainer.clear();

            this._assetEvents.forEach(evt => evt.unbind());
            this._assetEvents.length = 0;

            value.forEach((script, i) => {
                this._onScriptInsert(script, i);
            });
        }

        _createScriptPanel(assetId, order) {
            const asset = this._args.assets.get(assetId);

            const scriptPanel = new pcui.Panel({
                headerText: asset ? asset.get('name') : assetId,
                sortable: true,
                class: CLASS_SCRIPTS_LIST_ITEM
            });

            // there is a chance that the asset hasn't been added yet
            // due to network delays. In that case when the asset is added
            // update the name
            if (!asset) {
                this._assetEvents.push(editor.once(`assets:add[${assetId}]`, asset => {
                    this._assetEvents.push(asset.on('name:set', (name) => {
                        scriptPanel.headerText = name;
                    }));
                    scriptPanel.headerText = asset.get('name');
                }));
            } else {
                this._assetEvents.push(asset.on('name:set', (name) => {
                    scriptPanel.headerText = name;
                }));
            }

            scriptPanel._fieldOrder = new pcui.Label({ text: `#${order + 1}` });
            scriptPanel.header.append(scriptPanel._fieldOrder);
            scriptPanel.on('click', () => {
                const asset = this._args.assets.get(assetId);
                if (asset) {
                    editor.call('selector:set', 'asset', [asset]);
                }
            });

            return scriptPanel;
        }

        destroy() {
            if (this._destroyed) return;

            this._scriptEvents.forEach(evt => evt.unbind());
            this._scriptEvents.length = 0;
            this._scriptList.length = 0;

            this._assetEvents.forEach(evt => evt.unbind());
            this._assetEvents.length = 0;

            super.destroy();
        }
    }

    return {
        ScriptsSettingsPanel: ScriptsSettingsPanel
    };
})());
