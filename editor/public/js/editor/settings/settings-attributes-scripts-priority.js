editor.once('load', function () {
    'use strict';

    if (! editor.call('settings:project').get('useLegacyScripts'))
        return;

    var sceneSettings = editor.call('sceneSettings');
    var priorityScripts = [];

    var priorityList = new ui.List();

    var refreshPriorityList = function () {
        priorityList.clear();

        if (priorityScripts.length === 0) {
            var item = new ui.ListItem();
            priorityList.append(item);
        } else {
            priorityScripts.forEach(function (script, index) {
                var item = new ui.ListItem();
                item.text = script;

                var moveUp = new ui.Button();
                moveUp.class.add('move-up');
                if (index) {
                    moveUp.on("click", function () {
                        var index = priorityScripts.indexOf(script);
                        priorityScripts.splice(index, 1);
                        priorityScripts.splice(index - 1, 0, script);
                        sceneSettings.set("priority_scripts", priorityScripts);
                        refreshPriorityList();
                    });
                } else {
                    moveUp.class.add('not-visible');
                }

                var moveDown = new ui.Button();
                moveDown.class.add('move-down');
                if (index < priorityScripts.length - 1) {
                    moveDown.on("click", function () {
                        var index = priorityScripts.indexOf(script);
                        priorityScripts.splice(index, 1);
                        priorityScripts.splice(index + 1, 0, script);
                        sceneSettings.set("priority_scripts", priorityScripts);
                        refreshPriorityList();
                    });
                } else {
                    moveDown.class.add('not-visible');
                }

                var remove = new ui.Button();
                remove.class.add('remove');
                remove.on("click", function () {
                    var index = priorityScripts.indexOf(script);
                    priorityScripts.splice(index, 1);
                    sceneSettings.set("priority_scripts", priorityScripts);
                    refreshPriorityList();
                });

                item.element.insertBefore(remove.element, item.element.lastChild);
                item.element.insertBefore(moveDown.element, item.element.lastChild);
                item.element.insertBefore(moveUp.element, item.element.lastChild);

                priorityList.append(item);
            });
        }
    };

    editor.on('sourcefiles:load', function (obs) {

    });

    var root = editor.call('layout.root');

    var overlay = new ui.Overlay();
    overlay.class.add("script-priorities");
    overlay.hidden = true;

    var label = new ui.Label();
    label.text = "Script Loading Priority";
    label.class.add('title');
    overlay.append(label);

    var description = new ui.Label();
    description.text = "Scripts in the priority list are loaded first in the order that they are listed. Other scripts are loaded in an unspecified order.";
    description.class.add('description');
    overlay.append(description);

    var panel = new ui.Panel();
    overlay.append(panel);

    // Add new script button
    var button = new ui.Button();
    button.text = "Add Script";
    button.class.add('add-script');
    button.on("click", function (evt) {
        // use asset-picker to select script
        overlay.hidden = true;
        editor.once("picker:asset", function (asset) {
            overlay.hidden = false;
            var value = asset.get("filename");
            if (priorityScripts.indexOf(value) < 0) {
                priorityScripts.push(value);
                if (sceneSettings.has('priority_scripts')) {
                    sceneSettings.insert("priority_scripts", value);
                } else {
                    sceneSettings.set('priority_scripts', priorityScripts);
                }
                refreshPriorityList();
            }
        });
        editor.once("picker:asset:close", function (asset) {
            overlay.hidden = false;
        });

        // show asset picker
        editor.call("picker:asset", { type: "script" });
    });
    overlay.append(button);

    sceneSettings.on("priority_scripts:set", function (scripts) {
        priorityScripts = scripts.slice();
        refreshPriorityList();
    });
    sceneSettings.on("priority_scripts:unset", function () {
        priorityScripts = [];
        refreshPriorityList();
    });
    panel.append(priorityList);

    root.append(overlay);

    // esc > no
    editor.call('hotkey:register', 'sceneSettings:priorityScripts:close', {
        key: 'esc',
        callback: function () {
            if (overlay.hidden)
                return;

            overlay.hidden = true;
        }
    });

    editor.method('sceneSettings:priorityScripts', function () {
        overlay.hidden = false;
        refreshPriorityList();
    });
});
