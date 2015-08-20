editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');

    // overlay blocker
    var blocker = new ui.Overlay();
    blocker.hidden = true;
    blocker.clickable = false;
    blocker.class.add('introduction-blocker');
    root.append(blocker);

    // overlay
    var overlay = new ui.Overlay();
    overlay.hidden = true;
    overlay.clickable = false;
    overlay.class.add('introduction');
    root.append(overlay);

    // panel
    var panel = new ui.Panel();
    overlay.append(panel);

    var panelBullets = new ui.Panel();
    panelBullets.class.add('bullets');
    overlay.append(panelBullets);

    // next
    var btnNext = new ui.Button({
        text: 'Next'
    });
    btnNext.class.add('next');
    btnNext.on('click', function() {
        stepNext();
    });
    overlay.append(btnNext);

    // skip
    var btnSkip = new ui.Button({
        text: 'skip'
    });
    btnSkip.class.add('skip');
    btnSkip.on('click', function() {
        stepEnd();
    });
    overlay.append(btnSkip);

    var panelInner;

    var stepCurrent = -1;
    var steps = [
        // welcome
        {
            start: function() {
                overlay.center = true;
                panelInner = new ui.Panel();
                panelInner.header = 'Welcome';
                panel.append(panelInner);

                var label = new ui.Label({
                    text: 'New Beta <span style="color:#fff">Editor</span>. Please give us <span style="color:#fff">feedback</span> using the <span class="font-icon" style="color:#fff">&#58488;</span> comment button in the toolbar.'
                });
                panelInner.append(label);

                overlay.innerElement.style.top = 'calc(50% - ' + Math.floor(overlay.innerElement.clientHeight / 2) + 'px)';
            },
            end: function() {
                overlay.center = false;
                if (panelInner) {
                    panelInner.destroy();
                    panelInner = null;
                }
            }
        },

        // toolbar
        {
            start: function() {
                editor.call('layout.toolbar').style.zIndex = 202;
                overlay.position(45, 67);
                overlay.class.add('arrow-left');
                panelInner = new ui.Panel();
                panelInner.header = 'Menu & Toolbar';
                panel.append(panelInner);

                var label = new ui.Label({
                    text: 'The <span style="display:inline-block;background-image:url(\'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/images/editor_logo.png\');width:18px;height:18px;background-size:36px 18px;background-position:-18px 0;vertical-align:text-bottom;"></span> main menu and toolbar has every command available in the Editor. If you can’t find a button or remember a hot key, you will always find the command in the menu.'
                });
                panelInner.append(label);
            },
            end: function() {
                editor.call('layout.toolbar').style.zIndex = '';
                overlay.class.remove('arrow-left');
                if (panelInner) {
                    panelInner.destroy();
                    panelInner = null;
                }
            }
        },

        // scene
        {
            start: function() {
                editor.call('layout.left').style.zIndex = 202;
                overlay.position(366, 128);
                overlay.class.add('arrow-left');
                panelInner = new ui.Panel();
                panelInner.header = 'Scene';
                panel.append(panelInner);

                var label = new ui.Label({
                    text: 'This is your <span style="color:#fff">scene hierarchy</span> made up of <span style="color:#fff">Entities</span>, which can be given new behaviours by adding <span style="color:#fff">Components</span>.<br/><br/><span class="font-icon" style="color:#fff">&#58468;</span> Add, <span class="font-icon" style="color:#fff">&#57908;</span> Duplicate and <span class="font-icon" style="color:#fff">&#58657;</span> Delete Entities using the controls in this panel.'
                });
                panelInner.append(label);
            },
            end: function() {
                editor.call('layout.left').style.zIndex = '';
                overlay.class.remove('arrow-left');
                if (panelInner) {
                    panelInner.destroy();
                    panelInner = null;
                }
            }
        },

        // assets
        {
            start: function() {
                editor.call('layout.assets').style.zIndex = 202;
                overlay.class.add('arrow-bottom');
                panelInner = new ui.Panel();
                panelInner.header = 'Assets';
                panel.append(panelInner);

                var label = new ui.Label({
                    text: '<span style="color:#fff">Drag`n`Drop</span> files from your computer to upload or use the <span class="font-icon" style="color:#fff">&#58468;</span> Add button to create new assets.<br/><br/>You can filter and <span class="font-icon" style="color:#fff">&#58163;</span> search your assets using the controls at the top.'
                });
                panelInner.append(label);

                overlay.position(430, root.element.clientHeight - 269 - overlay.innerElement.clientHeight);
            },
            end: function() {
                editor.call('layout.assets').style.zIndex = '';
                overlay.class.remove('arrow-bottom');
                if (panelInner) {
                    panelInner.destroy();
                    panelInner = null;
                }
            }
        },

        // inspector
        {
            start: function() {
                editor.call('layout.right').style.zIndex = 202;
                overlay.position(root.element.clientWidth - 320, 128);
                overlay.class.add('arrow-right');
                panelInner = new ui.Panel();
                panelInner.header = 'Inspector';
                panel.append(panelInner);

                var label = new ui.Label({
                    text: 'Select an Entity or Asset to <span style="color:#fff">inspect and edit</span> its properties.'
                });
                panelInner.append(label);
            },
            end: function() {
                editor.call('layout.right').style.zIndex = '';
                overlay.class.remove('arrow-right');
                if (panelInner) {
                    panelInner.destroy();
                    panelInner = null;
                }
            }
        },

        // team
        {
            start: function() {
                editor.call('whoisonline:panel').style.zIndex = 202;
                overlay.class.add('arrow-bottom-right');
                panelInner = new ui.Panel();
                panelInner.header = 'Team';
                panel.append(panelInner);

                var label = new ui.Label({
                    text: 'PlayCanvas lets you <span style="color:#fff">collaborate in real-time</span> with your team. Their avatars will be shown here if they are in scene.'
                });
                panelInner.append(label);

                overlay.position(root.element.clientWidth - 320, root.element.clientHeight - 273 - overlay.innerElement.clientHeight);
            },
            end: function() {
                editor.call('whoisonline:panel').style.zIndex = '';
                overlay.class.remove('arrow-bottom-right');
                if (panelInner) {
                    panelInner.destroy();
                    panelInner = null;
                }
            }
        },

        // launch
        {
            start: function() {
                var launch = document.querySelector('.top-controls > .content > .launch > .content > .ui-button.icon');
                launch.style.zIndex = 202;
                launch.style.position = 'relative';
                launch.style.backgroundColor = '#f60';
                launch.style.color = '#fff';

                btnNext.text = 'Close';
                overlay.position(root.element.clientWidth - 340, 37);
                overlay.class.add('arrow-top-right');
                panelInner = new ui.Panel();
                panelInner.header = 'Launch';
                panel.append(panelInner);

                var label = new ui.Label({
                    text: 'Click the <span class="font-icon" style="color:#fff">&#57922;</span> <span style="color:#fff">PLAY</span> button to launch your game.<br/><br/>You can continue to edit your scene here, changes will be automatically applied to the launched game in real-time.'
                });
                panelInner.append(label);

                btnSkip.hidden = true;
            },
            end: function() {
                var launch = document.querySelector('.top-controls > .content > .launch > .content > .ui-button.icon');
                launch.style.zIndex = '';
                launch.style.position = '';
                launch.style.backgroundColor = '';
                launch.style.color = '';

                btnNext.text = 'Next';
                overlay.class.remove('arrow-top-right');

                btnSkip.hidden = false;

                if (panelInner) {
                    panelInner.destroy();
                    panelInner = null;
                }
            }
        }
    ];

    // bullets
    var bullets = [ ];
    for(var i = 0; i < steps.length; i++) {
        var bullet = document.createElement('div');
        bullets.push(bullet);

        bullet.classList.add('bullet');
        if (i === 0)
            bullet.classList.add('first');

        panelBullets.append(bullet);
    }

    var stepEnd = function() {
        blocker.hidden = true;
        overlay.hidden = true;
        config.self.openedEditor = true;
        Ajax.post('/editor/scene/{{scene.id}}/opened', { });
        editor.call('help:controls');
    };

    // next step
    var stepNext = function() {
        stepCurrent++;

        // close last step
        if (stepCurrent > 0)
            steps[stepCurrent - 1].end();

        // end of introduction
        if (steps.length <= stepCurrent) {
            stepEnd();
            return;
        } else if (stepCurrent === 0) {
            blocker.hidden = false;
            overlay.hidden = false;
        }

        // set active bullet
        bullets[stepCurrent].classList.add('active');

        // start new step
        steps[stepCurrent].start();
    };

    // if never seen introduction
    editor.on('realtime:connected', function() {
        if (config.self.openedEditor)
            return;

        if (editor.call('permissions:write')) {
            stepNext();
        } else {
            editor.on('permissions:set:' + config.self.id, function () {
                if (stepCurrent !== -1 || ! editor.call('permissions:write') || config.self.openedEditor)
                    return;

                stepNext();
            });
        }
    });
});
