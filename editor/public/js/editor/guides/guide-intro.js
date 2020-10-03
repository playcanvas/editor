editor.once('load', function () {
    'use strict';

    var nextDelay = 500;

    var bubbles = [];

    var timeouts = {};

    var bubbleDemo1 = function () {
        var bubble = editor.call(
            'guide:bubble',
            'Complete this level (1 / 4)',
            "Let's duplicate one of those platforms. Click on a platform in the 3D view to select it.",
            '50%',
            '50%',
            'left',
            editor.call('layout.viewport')
        );


        return bubble;
    };

    var bubbleDemo2 = function () {
        var bubble = editor.call(
            'guide:bubble',
            'Complete this level (2 / 4)',
            'Hit Ctrl+D or click the <span class="font-icon">&#57638;</span> button to duplicate the selected platform.',
            '50%',
            '50%',
            'left',
            editor.call('layout.viewport')
        );


        return bubble;
    };

    var bubbleDemo3 = function () {
        var bubble = editor.call(
            'guide:bubble',
            'Complete this level (3 / 4)',
            "Use the arrows of the Translate tool to move the platform. Try to fill that gap so that the ball can safely reach the rightmost platform.",
            '50%',
            '50%',
            'left',
            editor.call('layout.viewport')
        );

        return bubble;
    };

    var bubbleDemo4 = function () {
        return editor.call(
            'guide:bubble',
            'Complete this level (4 / 4)',
            "Click <span class='font-icon'>&#57649;</span> <strong>Launch</strong> to play the game. Use the arrow keys to move the ball. The game will open in a new tab so just switch back to the Editor tab when you're done.<br/><br/>Any changes you make to the scene will automatically update the launched game.",
            46,
            29,
            'top-right',
            editor.call('layout.toolbar.launch')
        );
    };

    var bubbleHierarchy = function () {
        return editor.call(
            'guide:bubble',
            'Scene Hierarchy',
            'This is your <strong>Scene Hierarchy</strong> made up of <strong>Entities</strong>, which can be given new behaviors by adding Components.<br/><br/> <span class="font-icon">&#57632;</span> Add, <span class="font-icon">&#57638;</span> Duplicate and <span class="font-icon">&#57636;</span> Delete Entities using the controls in this panel.',
            295,
            60,
            'left'
        );
    };

    var bubbleLaunch = function () {
        return editor.call(
            'guide:bubble',
            'Launch Preview',
            'Click <span class="font-icon">&#57649;</span> <strong>Launch</strong> to preview your scene. Any changes you make to your scene while in the Editor will automatically update the launched scene.',
            46,
            29,
            'top-right',
            editor.call('layout.toolbar.launch')
        );
    };

    var bubbleDashboard = function () {
        return editor.call(
            'guide:bubble',
            'Dashboard',
            'This is the name of your <strong>Project</strong>. Click here to go to the <strong>Project Dashboard</strong>.<br/><br/>Visit your <strong>Dashboard</strong> to create a new <strong>Project</strong>.',
            55,
            28,
            'top',
            editor.call('layout.toolbar.scene')
        );
    };

    var bubbleAssets = function () {
        return editor.call(
            'guide:bubble',
            'Assets',
            '<strong>Drag`n`Drop</strong> files from your computer to upload assets or use the <span class="font-icon">&#57632;</span> Add button to create new assets.<br/><br/>You can filter and <span class="font-icon">&#57641;</span> search your assets using the controls at the top.',
            54,
            -39,
            'bottom',
            editor.call('layout.assets').dom
        );
    };

    var bubbleStore = function () {
        var bubble = editor.call(
            'guide:bubble',
            'Store',
            '<img width="424" height="133" src="https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/instructions/asset_library.jpg"/><br/><br/>Click the <strong>STORE</strong> button to open the Store. Add free 3D models and assets from the Store into your scene with a single click.',
            900,
            -10,
            'bottom-right',
            editor.call('layout.assets').dom
        );

        bubble.style.zIndex = 'initial';
        return bubble;
    };

    var bubbleMenu = function () {
        return editor.call(
            'guide:bubble',
            'Main Menu',
            'The <span style="display:inline-block;background-image:url(\'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/images/editor_logo.png\');width:18px;height:18px;background-size:36px 18px;background-position:-18px 0;vertical-align:text-bottom;"></span> main menu and toolbar has every command available in the Editor. If you can’t find a button or remember a hot key, you will always find the command in the menu.',
            18,
            40,
            'top'
        );
    };

    var bubbleControls = function () {
        var bubble = editor.call(
            'guide:bubble',
            'Controls',
            'Click here to see <strong>controls</strong> and <strong>shortcuts</strong> for the Editor.',
            41,
            0,
            'bottom',
            editor.call('layout.toolbar')
        );

        bubble.element.style.top = '';
        bubble.element.style.bottom = '119px';
        return bubble;
    };

    var bubbleEntity = function () {
        var bubble = editor.call(
            'guide:bubble',
            'Inspector',
            'This is the <strong>Inspector</strong>. Here you can enable or disable an Entity, edit its name or its position / rotation and scale. <br/><br/>If you want to add behaviors to your Entity click on Add Component.',
            0,
            100,
            'right',
            editor.call('layout.viewport')
        );

        bubble.element.style.left = '';
        bubble.element.style.right = '6px';

        return bubble;
    };

    var bubbleSoundComponent = function () {
        var bubble = editor.call(
            'guide:bubble',
            'Sound Component',
            'The Sound Component allows the Entity to play sounds. To play a sound you need to create a "slot", give it a name and assign an Audio Asset to it. If you set it to Auto Play the slot will begin playback when the application is loaded. Otherwise play it by script. You can create multiple slots to play different sounds. Check out this <a href="http://developer.playcanvas.com/en/tutorials/beginner/basic-audio/" target="_blank">tutorial</a> for more.',
            10,
            10,
            'right',
            document.querySelector('.ui-panel.sound') || document.querySelector('.sound-component-inspector')
        );

        return bubble;
    };

    var showBubble = function (name, bubbleFn, delay, force, callback) {
        if (!force && config.self.flags.tips[name] !== false) return false;

        // Set by Selenium tests in order to prevent bubbles from showing up in viewport screenshots
        if (/disableBubbles=true/.test(location.search)) return false;

        if (timeouts[name])
            clearTimeout(timeouts[name]);

        timeouts[name] = setTimeout(function () {
            delete timeouts[name];

            var bubble = bubbleFn();
            bubbles.push(bubble);

            bubble.on('deactivate', function () {
                config.self.flags.tips[name] = true;
                Ajax.post('/editor/scene/{{scene.id}}/tips/' + name, {});

                if (callback)
                    callback();
            });
        }, delay);

        return true;
    };

    editor.method('guide:bubble:show', function (name, bubbleFn, delay, force, callback) {
        showBubble(name, bubbleFn, delay, force, callback);
    });


    var selectEvents = null;
    var showBubbles = function (initialDelay) {
        var delay = initialDelay;

        if (showBubble('mainMenu', bubbleMenu, delay))
            delay += nextDelay;

        if (showBubble('hierarchy', bubbleHierarchy, delay))
            delay += nextDelay;

        if (showBubble('dashboard', bubbleDashboard, delay))
            delay += nextDelay;

        if (showBubble('launch', bubbleLaunch, delay))
            delay += nextDelay;

        if (showBubble('assets', bubbleAssets, delay))
            delay += nextDelay;

        // show store bubble for existing users as well
        if (!config.self.flags.tips.store && showBubble('store', bubbleStore, delay, true))
            delay += nextDelay;

        if (showBubble('controls', bubbleControls, delay))
            delay += nextDelay;

        // entity bubble on select entity
        if (config.self.flags.tips.entityInspector === false) {
            var evtEntitySelect = editor.on('selector:change', function (type, items) {
                if (type !== 'entity') return;

                evtEntitySelect.unbind();

                showBubble('entityInspector', bubbleEntity, nextDelay);
            });
        }

        // sound component bubble
        if (!config.self.flags.tips.soundComponent) {
            var evtEntityWithSoundSelect = editor.on('selector:change', function (type, items) {

                if (selectEvents) {
                    selectEvents.forEach(function (evt) {
                        evt.unbind();
                    });
                    selectEvents = null;
                }

                if (type !== 'entity') {
                    return;
                }

                var showSoundBubble = function () {
                    showBubble('soundComponent', bubbleSoundComponent, nextDelay, true);

                    evtEntityWithSoundSelect.unbind();

                    if (selectEvents) {
                        selectEvents.forEach(function (evt) {
                            evt.unbind();
                        });

                        selectEvents = null;
                    }
                };

                for (var i = 0; i < items.length; i++) {
                    if (items[i].has('components.sound')) {
                        showSoundBubble();
                        return;
                    }
                }

                // if a sound component is added show bubble
                if (! selectEvents) selectEvents = [];

                for (var i = 0; i < items.length; i++) {
                    selectEvents.push(items[i].on('components.sound:set', showSoundBubble));
                }
            });
        }

    };

    editor.method('editor:tips:reset', function () {
        // destroy existing bubbles
        bubbles.forEach(function (bubble) {
            bubble.destroy();
        });

        bubbles.length = 0;

        Ajax.post('/editor/scene/{{scene.id}}/tips/reset', {});

        ['hierarchy',
         'assets',
         'store',
         'dashboard',
         'entityInspector',
         'soundComponent',
         'mainMenu',
         'controls',
         'launch',
         'howdoi'].forEach(function (tip) {
            config.self.flags.tips[tip] = false;
         });

         showBubbles(100);
    });

    var openedDemo = false;

    editor.once('help:demo:show', function () {
        openedDemo = true;

        editor.once('help:demo:close', function () {
            // set user's openedEditor flag to true
            Ajax.post('/editor/scene/{{scene.id}}/opened', { });

            // show some demo specific bubbles first
            setTimeout(function () {
                bubbleDemo1().on('deactivate', function () {
                    setTimeout(function () {
                        bubbleDemo2().on('deactivate', function () {
                            setTimeout(function () {
                                bubbleDemo3().on('deactivate', function () {
                                    setTimeout(function () {
                                        bubbleDemo4().on('deactivate', function () {
                                            setTimeout(function () {
                                                showBubbles(0);
                                            }, 3000);
                                        });
                                    }, 2000);
                                });
                            }, 2000);
                        });
                    }, 2000);
                });
            }, 1000);
        });
    });

    editor.once('scene:raw', function () {
        // If the demo popup has opened show bubbles after it
        // otherwise show them right away
        setTimeout(function () {
            if (!openedDemo)
                showBubbles(0);
        }, 3000);
    });
});
