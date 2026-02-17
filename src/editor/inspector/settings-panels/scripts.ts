import { Container, Panel, Label } from '@playcanvas/pcui';

import { BaseSettingsPanel } from './base';

const CLASS_ROOT = 'scripts-settings-panel';
const CLASS_SCRIPTS_LIST = `${CLASS_ROOT}-scripts-list`;
const CLASS_SCRIPTS_LIST_CONTAINER = `${CLASS_SCRIPTS_LIST}-container`;
const CLASS_SCRIPTS_LIST_ITEM = `${CLASS_SCRIPTS_LIST}-item`;

class ScriptsSettingsPanel extends BaseSettingsPanel {
    _insertPromise = null;

    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);
        args.headerText = 'SCRIPTS LOADING ORDER';
        args._tooltipReference = 'settings:scripts';

        super(args);
        this._args = args;

        this._scriptList = [];
        this._scriptEvents = [];

        this._scriptListContainer = new Container({
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

        this._onScriptsSet(this._projectSettings.get('scripts'));
    }

    _getAsset(id) {
        const assets = this._args.assets;
        const asset = assets.get(id);
        return new Promise((resolve) => {
            if (!asset) {
                this._assetEvents.push(editor.once(`assets:add[${id}]`, (asset) => {
                    resolve(asset);
                }));
            } else {
                resolve(asset);
            }
        });
    }

    async _insertScript(assetId, index) {
        const asset = await this._getAsset(assetId);
        if (!asset) {
            return;
        }

        const panel = new Panel({
            headerText: asset.get('name'),
            sortable: true,
            class: CLASS_SCRIPTS_LIST_ITEM
        });
        panel.on('click', () => {
            editor.call('selector:set', 'asset', [asset]);
        });

        this._assetEvents.push(asset.on('name:set', (name) => {
            panel.headerText = name;
        }));

        panel._fieldOrder = new Label();
        panel._fieldOrder.text = `#${index + 1}`;
        panel.header.append(panel._fieldOrder);

        this._scriptList.splice(index, 0, panel);
        const before = this._scriptListContainer.dom.childNodes[index];
        this._scriptListContainer.appendBefore(panel, before && before.ui);

    }

    _onScriptInsert(assetId, index) {
        if (!this._insertPromise) {
            this._insertPromise = this._insertScript(assetId, index);
            return;
        }

        this._insertPromise = this._insertPromise.then(() => this._insertScript(assetId, index));
    }

    _onScriptRemove(assetId, index) {
        const panel = this._scriptList[index];
        if (panel) {
            this._scriptList.splice(index, 1);
            panel.destroy();

            for (let i = index; i < this._scriptList.length; i++) {
                this._scriptList[i]._fieldOrder.text = `#${i + 1}`;
            }
        }
    }

    _onScriptMove(assetId, newIndex, oldIndex) {
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

    _onScriptsSet(list) {
        this._scriptList.length = 0;
        this._scriptListContainer.clear();

        this._assetEvents.forEach(evt => evt.unbind());
        this._assetEvents.length = 0;

        list.forEach((script, i) => {
            this._onScriptInsert(script, i);
        });
    }

    destroy() {
        if (this._destroyed) {
            return;
        }

        this._scriptEvents.forEach(evt => evt.unbind());
        this._scriptEvents.length = 0;
        this._scriptList.length = 0;

        this._assetEvents.forEach(evt => evt.unbind());
        this._assetEvents.length = 0;

        super.destroy();
    }
}

export { ScriptsSettingsPanel };
