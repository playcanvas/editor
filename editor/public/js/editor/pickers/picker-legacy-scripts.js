editor.once('load', function () {
    'use strict';

    if (!editor.call('settings:project').get('useLegacyScripts'))
        return;

    if (!editor.call('permissions:read'))
        return;

    const panel = new pcui.Panel({
        headerText: 'DEPRECATED SCRIPTING SYSTEM',
        flex: true
    });
    panel.style.maxWidth = '550px';

    const text = new pcui.Label({
        text: 'This project uses a deprecated scripting system and will become read-only on 1st of March. See <a target="_blank" href="https://forum.playcanvas.com/t/important-deprecation-of-legacy-script-projects/15795">this</a> forum post for more information. Contact <a target="_blank" href="mailto:support@playcanvas.com">support@playcanvas.com</a> if you have any questions.',
        unsafe: true
    });
    text.style.whiteSpace = 'normal';
    text.style.padding = '15px';

    const button = new pcui.Button({
        text: 'OK'
    });
    button.style.width = '200px';
    button.style.margin = '15px auto';

    panel.append(text);
    panel.append(button);

    const overlay = new pcui.Overlay();
    overlay.style.zIndex = '1000';
    overlay.append(panel);

    editor.call('layout.root').append(overlay);

    button.on('click', () => {
        overlay.hidden = true;
    });
});
