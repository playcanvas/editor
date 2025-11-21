import { LegacyButton } from '../../../common/ui/button';
import { LegacyLabel } from '../../../common/ui/label';
import { LegacyList } from '../../../common/ui/list';
import { LegacyListItem } from '../../../common/ui/list-item';
import { LegacyOverlay } from '../../../common/ui/overlay';
import { LegacyPanel } from '../../../common/ui/panel';

editor.once('load', () => {
    if (!editor.call('settings:project').get('useLegacyScripts')) {
        return;
    }

    const sceneSettings = editor.call('sceneSettings');
    let priorityScripts = [];

    const priorityList = new LegacyList();

    const refreshPriorityList = function () {
        priorityList.clear();

        if (priorityScripts.length === 0) {
            const item = new LegacyListItem();
            priorityList.append(item);
        } else {
            priorityScripts.forEach((script, index) => {
                const item = new LegacyListItem();
                item.text = script;

                const moveUp = new LegacyButton();
                moveUp.class.add('move-up');
                if (index) {
                    moveUp.on('click', () => {
                        const index = priorityScripts.indexOf(script);
                        priorityScripts.splice(index, 1);
                        priorityScripts.splice(index - 1, 0, script);
                        sceneSettings.set('priority_scripts', priorityScripts);
                        refreshPriorityList();
                    });
                } else {
                    moveUp.class.add('not-visible');
                }

                const moveDown = new LegacyButton();
                moveDown.class.add('move-down');
                if (index < priorityScripts.length - 1) {
                    moveDown.on('click', () => {
                        const index = priorityScripts.indexOf(script);
                        priorityScripts.splice(index, 1);
                        priorityScripts.splice(index + 1, 0, script);
                        sceneSettings.set('priority_scripts', priorityScripts);
                        refreshPriorityList();
                    });
                } else {
                    moveDown.class.add('not-visible');
                }

                const remove = new LegacyButton();
                remove.class.add('remove');
                remove.on('click', () => {
                    const index = priorityScripts.indexOf(script);
                    priorityScripts.splice(index, 1);
                    sceneSettings.set('priority_scripts', priorityScripts);
                    refreshPriorityList();
                });

                item.element.insertBefore(remove.element, item.element.lastChild);
                item.element.insertBefore(moveDown.element, item.element.lastChild);
                item.element.insertBefore(moveUp.element, item.element.lastChild);

                priorityList.append(item);
            });
        }
    };

    editor.on('sourcefiles:load', (obs) => {

    });

    const root = editor.call('layout.root');

    const overlay = new LegacyOverlay();
    overlay.class.add('script-priorities');
    overlay.hidden = true;

    const label = new LegacyLabel();
    label.text = 'Script Loading Priority';
    label.class.add('title');
    overlay.append(label);

    const description = new LegacyLabel();
    description.text = 'Scripts in the priority list are loaded first in the order that they are listed. Other scripts are loaded in an unspecified order.';
    description.class.add('description');
    overlay.append(description);

    const panel = new LegacyPanel();
    overlay.append(panel);

    // Add new script button
    const button = new LegacyButton();
    button.text = 'Add Script';
    button.class.add('add-script');
    button.on('click', (evt) => {
        // use asset-picker to select script
        overlay.hidden = true;
        editor.once('picker:asset', (asset) => {
            overlay.hidden = false;
            const value = asset.get('filename');
            if (priorityScripts.indexOf(value) < 0) {
                priorityScripts.push(value);
                if (sceneSettings.has('priority_scripts')) {
                    sceneSettings.insert('priority_scripts', value);
                } else {
                    sceneSettings.set('priority_scripts', priorityScripts);
                }
                refreshPriorityList();
            }
        });
        editor.once('picker:asset:close', (asset) => {
            overlay.hidden = false;
        });

        // show asset picker
        editor.call('picker:asset', { type: 'script' });
    });
    overlay.append(button);

    sceneSettings.on('priority_scripts:set', (scripts) => {
        priorityScripts = scripts.slice();
        refreshPriorityList();
    });
    sceneSettings.on('priority_scripts:unset', () => {
        priorityScripts = [];
        refreshPriorityList();
    });
    panel.append(priorityList);

    root.append(overlay);

    // esc > no
    editor.call('hotkey:register', 'sceneSettings:priorityScripts:close', {
        key: 'Escape',
        callback: function () {
            if (overlay.hidden) {
                return;
            }

            overlay.hidden = true;
        }
    });

    editor.method('sceneSettings:priorityScripts', () => {
        overlay.hidden = false;
        refreshPriorityList();
    });
});
