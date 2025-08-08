import { Button } from '@playcanvas/pcui';

import { LegacyButton } from '../../common/ui/button.ts';
import { LegacyTooltip } from '../../common/ui/tooltip.ts';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const toolbar = editor.call('layout.toolbar');

    // manage if uv1 is missing
    let uv1Missing = false;
    let uv1MissingAssets = { };

    // coordinate system
    const buttonBake = new Button({
        class: ['pc-icon', 'light-mapper'],
        icon: 'E191'
    });
    toolbar.append(buttonBake);

    buttonBake.on('click', () => {
        editor.call('lightmapper:bake');
        editor.call('entities:shadows:update');
    });
    editor.on('lightmapper:uv1Missing', (state) => {
        if (state) {
            buttonBake.class.add('active');
        } else {
            buttonBake.class.remove('active');
        }
    });

    // tooltip
    const tooltipBake = LegacyTooltip.attach({
        target: buttonBake.dom,
        align: 'left',
        root: root
    });
    tooltipBake.class.add('light-mapper');
    tooltipBake.hoverable = true;
    tooltipBake.text = 'Bake Lightmaps';

    // auto toggle
    const elAuto = document.createElement('div');

    if (!editor.call('permissions:write')) {
        elAuto.style.display = 'none';
    }

    editor.on('permissions:writeState', (state) => {
        elAuto.style.display = state ? '' : 'none';
    });

    elAuto.classList.add('auto-toggle');
    tooltipBake.innerElement.appendChild(elAuto);

    // uv1 missing
    const elUV1 = document.createElement('div');
    elUV1.classList.add('uv1');
    elUV1.textContent = 'UV1 is missing on some models. Please upload models with UV1 or use ';
    tooltipBake.innerElement.appendChild(elUV1);

    const btnAutoUnwrap = new LegacyButton({
        text: 'Auto-Unwrap'
    });
    btnAutoUnwrap.parent = tooltipBake;
    elUV1.appendChild(btnAutoUnwrap.element);
    btnAutoUnwrap.on('click', () => {
        if (!uv1Missing) {
            return;
        }

        const assetIds = Object.keys(uv1MissingAssets);
        for (let i = 0; i < assetIds.length; i++) {
            if (!uv1MissingAssets.hasOwnProperty(assetIds[i])) {
                continue;
            }

            const asset = uv1MissingAssets[assetIds[i]];
            editor.call('assets:model:unwrap', asset);
        }
    });

    // hotkey ctrl+b
    editor.call('hotkey:register', 'lightmapper:bake', {
        key: 'b',
        ctrl: true,
        callback: function () {
            if (editor.call('picker:isOpen:otherThan', 'curve')) {
                return;
            }

            editor.call('lightmapper:bake');
            editor.call('entities:shadows:update');
        }
    });

    editor.on('assets:model:unwrap', (asset) => {
        if (!uv1MissingAssets[asset.get('id')]) {
            return;
        }

        delete uv1MissingAssets[asset.get('id')];
        editor.call('lightmapper:uv1missing', uv1MissingAssets);
    });

    editor.method('lightmapper:uv1missing', (assets) => {
        if (assets === undefined) {
            return uv1Missing;
        }

        uv1MissingAssets = assets;

        const state = Object.keys(assets).length !== 0;

        if (uv1Missing === state) {
            return;
        }

        uv1Missing = state;
        editor.emit('lightmapper:uv1Missing', uv1Missing);
    });

    tooltipBake.on('show', () => {
        if (uv1Missing) {
            elUV1.classList.remove('hidden');
        } else {
            elUV1.classList.add('hidden');
        }
    });
});
