editor.once('load', function () {
    'use strict';

    var nextDelay = 500;

    var saveTipOnClose = function (bubble, name) {
        bubble.on('deactivate', function () {
            config.self.tips[name] = true;
            Ajax.post('/editor/scene/{{scene.id}}/tips/' + name, {});
        });
    };

    var bubbleHierarchy = function (delay) {
        if (config.self.tips.hierarchy !== false) return false;

        setTimeout(function () {
            var bubble = editor.call(
                'guide:bubble',
                'Scene Hierarchy',
                'This is your <strong>Scene Hierarchy</strong> made up of <strong>Entities</strong>, which can be given new behaviours by adding Components.<br/><br/> <span class="font-icon">&#58468;</span> Add, <span class="font-icon">&#57908;</span> Duplicate and <span class="font-icon">&#58657;</span> Delete Entities using the controls in this panel.',
                360,
                60,
                'left'
            );

            saveTipOnClose(bubble, 'hierarchy');
        }, delay);

        return true;
    };

    var bubblePlay = function (delay) {
        console.log('launch delay', delay);
        if (config.self.tips.launch !== false) return false;

        setTimeout(function () {
            var bubble = editor.call(
                'guide:bubble',
                'Launch Preview',
                'Click <span class="font-icon">&#57922;</span> <strong>Launch</strong> to preview your scene. Any changes you make to your scene while in the Editor will automatically update the launched scene.',
                46,
                29,
                'top-right',
                editor.call('layout.toolbar.launch')
            );

            saveTipOnClose(bubble, 'launch');
        }, delay);

        return true;
    };

    var bubbleDashboard = function (delay) {
        if (config.self.tips.dashboard !== false) return false;

        setTimeout(function () {
            var bubble = editor.call(
                'guide:bubble',
                'Dashboard',
                'This is the name of your <strong>Project</strong>. Click here to go to the <strong>Project Dashboard</strong>.<br/><br/>Visit your <strong>Dashboard</strong> to create a new <strong>Project</strong>.',
                55,
                28,
                'top',
                editor.call('layout.toolbar.scene')
            );

            saveTipOnClose(bubble, 'dashboard');
        }, delay);

        return true;
    };

    var bubbleAssets = function (delay) {
        console.log('assets delay', delay);
        if (config.self.tips.assets !== false) return false;

        setTimeout(function () {
            var bubble = editor.call(
                'guide:bubble',
                'Assets',
                '<strong>Drag`n`Drop</strong> files from your computer to upload assets or use the <span class="font-icon">&#58468;</span> Add button to create new assets.<br/><br/>You can filter and <span class="font-icon">&#58163;</span> search your assets using the controls at the top.',
                54,
                -39,
                'bottom',
                editor.call('layout.assets').element
            );

            saveTipOnClose(bubble, 'assets');
        }, delay);


        return true;
    };

    var bubbleMenu = function (delay) {
        console.log('menu delay', delay);
        if (config.self.tips.mainMenu !== false) return false;

        setTimeout(function () {
            var bubble = editor.call(
                'guide:bubble',
                'Main Menu',
                'The <span style="display:inline-block;background-image:url(\'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/images/editor_logo.png\');width:18px;height:18px;background-size:36px 18px;background-position:-18px 0;vertical-align:text-bottom;"></span> main menu and toolbar has every command available in the Editor. If you can’t find a button or remember a hot key, you will always find the command in the menu.',
                18,
                40,
                'top'
            );

            saveTipOnClose(bubble, 'mainMenu');
        }, delay);


        return true;
    };

    var bubbleEntity = function (delay) {
        setTimeout(function () {
            var bubble = editor.call(
                'guide:bubble',
                'Entity Inspector',
                'This is the <strong>Entity Inspector</strong>. Here you can enable or disable an Entity, edit its name or its position / rotation and scale. <br/><br/>If you want to add behaviours to your Entity click on Add Component.',
                0,
                0,
                'right',
                editor.call('layout.viewport')
            );

            bubble.element.style.left = '';
            bubble.element.style.right = '6px';
            bubble.element.style.top = '100px';

            saveTipOnClose(bubble, 'entityInspector');
        }, delay);
    };

    if (config.self.tips.entityInspector === false) {
        var evtEntitySelect = editor.on('selector:change', function (type, items) {
            if (type !== 'entity') return;

            evtEntitySelect.unbind();

            bubbleEntity(nextDelay);
        });
    }

    var showBubbles = function (initialDelay) {
        var delay = initialDelay;
        if (bubbleHierarchy(delay))
            delay += nextDelay;

        if (bubblePlay(delay))
            delay += nextDelay;

        if (bubbleDashboard(delay))
            delay += nextDelay;

        if (bubbleAssets(delay))
            delay += nextDelay;

        if (bubbleMenu(delay))
            delay += nextDelay;
    };

    editor.method('editor:tips:reset', function () {
        Ajax.post('/editor/scene/{{scene.id}}/tips/reset', {});

        ['hierarchy',
         'assets',
         'dashboard',
         'entityInspector',
         'mainMenu',
         'launch'].forEach(function (tip) {
            config.self.tips[tip] = false;
         });

         showBubbles(100);
    });

    editor.once('scene:raw', function () {
        if (!config.self.openedEditor) {
            var openedDemo = false;

            // show controls
            editor.call('help:controls');
            editor.once('help:controls:close', function () {

                Ajax.post('/editor/scene/{{scene.id}}/opened', { });

                // if the help controls close then wait
                // a bit to check if the demo popup has opened
                // If it hassn't then show the bubbles. Otherwise
                // show the bubbles when the demo popup closes
                setTimeout(function () {
                    if (openedDemo) return;

                    showBubbles(0);
                }, 3000);
            });

            editor.once('help:demo:show', function () {
                openedDemo = true;

                editor.once('help:demo:close', function () {
                    showBubbles(3000);
                });
            });

        } else {
            showBubbles(5000);
        }
    });
});
