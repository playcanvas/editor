import { AssetInspector } from '../inspector/asset.ts';

editor.once('load', () => {
    const editableTypes = {
        'script': 1,
        'css': 1,
        'html': 1,
        'shader': 1,
        'text': 1,
        'json': 1
    };

    let assetsPanel = null;

    let assetInspectorEvents = [];

    const assetInspector = new AssetInspector({
        assets: editor.call('assets:raw'),
        entities: editor.call('entities:raw'),
        projectSettings: editor.call('settings:project'),
        history: editor.api.globals.history,
        editableTypes: editableTypes,
        inspectorPanel: editor.call('layout.attributes'),
        inspectorPanelSecondary: editor.call('layout.attributes.secondary')
    });
    assetInspector.once('destroy', () => {
        assetInspectorEvents.forEach(evt => evt.unbind());
        assetInspectorEvents = [];
    });
    assetInspector.on('fullscreenMode:on', () => {
        editor.call('layout.attributes.secondary').hidden = false;
        editor.call('layout.hierarchy').hidden = true;
        editor.call('layout.toolbar').class.add('hide-items');
        editor.call('layout.toolbar.launch').hidden = true;
        editor.call('viewport:canvas').hidden = true;
        editor.call('layout.attributes').class.add('layout-attributes-left');
        editor.call('layout.attributes').resizable = 'right';
    });

    assetInspector.on('fullscreenMode:off', () => {
        editor.call('layout.attributes.secondary').hidden = true;
        editor.call('layout.hierarchy').hidden = false;
        editor.call('layout.toolbar').class.remove('hide-items');
        editor.call('layout.toolbar.launch').hidden = false;
        editor.call('viewport:canvas').hidden = false;
        editor.call('layout.attributes').class.remove('layout-attributes-left');
        editor.call('layout.attributes').resizable = 'left';
    });

    assetInspector.on('updateSecondaryPanelHeader', (text) => {
        editor.call('layout.attributes.secondary').headerText = text;
    });

    editor.on('attributes:beforeClear', () => {
        assetInspector.unlink();
        if (assetInspector.parent) {
            assetInspector.parent.remove(assetInspector);
        }
    });

    editor.on('attributes:clear', () => {
        assetInspector.unlink();
    });

    editor.on('attributes:inspect[asset]', (assets) => {

        // Set panel title
        const multi = assets.length > 1;
        let type = ((assets[0].get('source') && assets[0].get('type') !== 'folder') ? 'source ' : '') + assets[0].get('type');

        if (multi) {
            editor.call('attributes:header', `${assets.length} assets`);

            for (let i = 0; i < assets.length; i++) {
                if (type !== ((assets[0].get('source') && assets[0].get('type') !== 'folder') ? 'source ' : '') + assets[i].get('type')) {
                    type = null;
                    break;
                }
            }
        } else {
            editor.call('attributes:header', type);
        }

        const root = editor.call('attributes.rootPanel');

        if (!assetInspector.parent) {
            root.append(assetInspector);
        }
        assetInspector.link(assets);

        let events = [];
        const panel = editor.call('attributes:addPanel');
        panel.class.add('component');
        assetsPanel = panel;
        panel.once('destroy', () => {
            assetsPanel = null;

            for (let i = 0; i < events.length; i++) {
                events[i].unbind();
            }

            events = null;
        });
        assetInspectorEvents.push(root.on('resize', assetInspector.updatePreview.bind(assetInspector)));
    });

    editor.on('attributes:assets:toggleInfo', (enabled) => {
        if (assetsPanel) {
            assetsPanel.hidden = !enabled;
        }
        assetInspector.hidden = !enabled;
    });

    editor.method('attributes:assets:panel', () => {
        return assetsPanel;
    });
});
