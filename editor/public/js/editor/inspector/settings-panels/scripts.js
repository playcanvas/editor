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

            const dragEndEvt = this._scriptListContainer.on('child:dragend', (_, newIndex, oldIndex) => {
                this._projectSettings.move('scripts', oldIndex, newIndex);
            });
            editor.once('assets:load', () => {
                this._loadedInitialScripts = true;
                this._updateScriptList();
                const events = ['*:set', '*:unset', 'scripts:remove', 'scripts:move', 'scripts:insert'];
                events.forEach(evt => {
                    this._scriptEvents.push(this._projectSettings.on(evt, () => {
                        this._clearScriptList();
                        this._updateScriptList();
                    }));
                });
            });

            this.on('show', () => {
                this._clearScriptList();
                this._updateScriptList();
            });

            this.once('destroy', () => {
                dragEndEvt.unbind();
            });
        }

        _updateScriptList() {
            const scripts = this._projectSettings.get('scripts');
            const assets = this._args.assets;

            scripts.forEach((script, i) => {
                const asset = assets.get(script);

                const scriptPanel = new pcui.Panel({
                    headerText: asset ? asset.get('name') : script,
                    sortable: true,
                    class: CLASS_SCRIPTS_LIST_ITEM
                });

                // there is a chance that the asset hasn't been added yet
                // due to network delays. In that case when the asset is added
                // update the name
                if (!asset) {
                    this._assetEvents.push(editor.once(`assets:add[${script}]`, asset => {
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

                scriptPanel.header.append(new pcui.Label({ text: `#${i + 1}` }));
                this._scriptEvents.push(scriptPanel.on('click', () => {
                    const asset = assets.get(script);
                    if (asset) {
                        editor.call('selector:set', 'asset', [asset]);
                    }
                }));
                this._scriptList.push(scriptPanel);
                this._scriptListContainer.append(scriptPanel);
            });
        }


        _clearScriptList() {
            this._assetEvents.forEach(evt => evt.unbind());
            this._assetEvents.length = 0;

            this._scriptList.forEach(scriptPanel => {
                this._scriptListContainer.remove(scriptPanel);
                scriptPanel.destroy();
            });
            this._scriptList = [];
        }
    }

    return {
        ScriptsSettingsPanel: ScriptsSettingsPanel
    };
})());
