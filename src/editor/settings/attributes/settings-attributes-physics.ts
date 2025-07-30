import { Button, LabelGroup } from '@playcanvas/pcui';

editor.once('load', () => {
    const projectSettings = editor.call('settings:project');

    // check legacy physics include flag
    editor.method('project:settings:hasLegacyPhysics', () => {
        return projectSettings.get('useLegacyAmmoPhysics') &&
               projectSettings.get('use3dPhysics');
    });

    // method for checking whether the current project has physics (either legacy or module)
    editor.method('project:settings:hasPhysics', () => {
        return editor.call('project:settings:hasLegacyPhysics') ||
                editor.call('project:module:hasModule', 'ammo');
    });

    // append the physics module controls to the provided panel
    editor.method('attributes:appendImportAmmo', (panel) => {
        // button
        const button = new Button({
            text: 'IMPORT AMMO',
            icon: 'E228'
        });
        button.on('click', () => {
            // ensure legacy physics is disabled
            projectSettings.set('use3dPhysics', false);
            // add the module
            editor.call('project:module:addModule', 'ammo.js', 'ammo');
        });

        // group
        const group = new LabelGroup({
            field: button,
            text: 'Physics Library'
        });
        group.style.margin = '3px';
        group.label.style.width = '27%';
        group.label.style.fontSize = '12px';
        panel.append(group);

        // enable state is based on write permissions and state of legacy physics
        function updateEnableState() {
            group.enabled = !editor.call('project:settings:hasLegacyPhysics') &&
                             editor.call('permissions:write');
        }

        const events = [];

        events.push(editor.on('permissions:writeState', (write) => {
            updateEnableState();
        }));
        events.push(editor.on('onUse3dPhysicsChanged', () => {
            updateEnableState();
        }));
        events.push(editor.on('onModuleImported', (name) => {
            if (name === 'ammo.js') {
                group.enabled = false;
            }
        }));

        updateEnableState();

        group.on('destroy', () => {
            events.forEach(evt => evt.unbind());
            events.length = 0;
        });

        return group;
    });
});
