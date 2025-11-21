import { LegacyButton } from '@/common/ui/button';
import { LegacyMenu } from '@/common/ui/menu';
import { LegacyMenuItem } from '@/common/ui/menu-item';
import { LegacyPanel } from '@/common/ui/panel';
import { LegacyTextField } from '@/common/ui/text-field';

editor.once('load', () => {
    const viewport = editor.call('layout.viewport');
    let focusedMenuItem = null;
    const settings = editor.call('settings:user');

    // create main panel
    const panel = new LegacyPanel();
    panel.class.add('help-howdoi');
    viewport.append(panel);
    panel.hidden = true;

    let settingsLoaded = false;
    let tipsLoaded = false;

    const checkShow = function () {
        if (tipsLoaded && settingsLoaded) {
            panel.hidden = !settings.get('editor.howdoi');
        }
    };

    editor.once('help:howdoi:load', () => {
        tipsLoaded = true;
        checkShow();
    });

    editor.once('settings:user:load', () => {
        settingsLoaded = true;
        checkShow();
    });

    // position widget between top elements in viewport
    const positionWidget = function () {
        const canvas = editor.call('viewport:canvas');
        if (!canvas) {
            return;
        }

        const canvasRect = canvas.element.getBoundingClientRect();

        const titleWidget = document.querySelector('.widget-title');
        const titleWidgetRect = titleWidget ? titleWidget.getBoundingClientRect() : null;

        const topLeftWidth = titleWidgetRect ? titleWidgetRect.right - canvasRect.left : 0;

        const topControls = document.querySelector('.viewport-camera');
        const topControlsRect = topControls ? topControls.getBoundingClientRect() : null;

        const topRightWidth = topControlsRect ? canvasRect.left + canvasRect.width - topControlsRect.left : 0;

        let width = canvasRect.width - topLeftWidth - topRightWidth - 220;
        if (width < 150) {
            panel.class.add('hidden');
        } else {
            panel.class.remove('hidden');

            if (width > 400) {
                width = 400;
            }
        }

        panel.style.width = `${width}px`;
        panel.style.left = `${topLeftWidth + (((topControlsRect.left - titleWidgetRect.right) - width) / 2)}px`;
    };

    // events when panel is shown
    panel.on('show', () => {
        editor.emit('help:howdoi:open');
        const history = settings.history.enabled;
        settings.history.enabled = false;
        settings.set('editor.howdoi', true);
        settings.history.enabled = history;

        editor.on('scene:name', positionWidget);
        editor.on('viewport:resize', positionWidget);
        positionWidget();
    });

    // bubble that appears after closing the widget for the first time
    const bubble = function () {
        const bubble = editor.call(
            'guide:bubble',
            'Get more help when you need it',
            'Click here to bring back the help widget whenever you want.',
            40,
            '',
            'bottom',
            editor.call('layout.toolbar')
        );

        bubble.element.style.top = '';
        bubble.element.style.bottom = '130px';
        return bubble;
    };

    // events when panel is hidden
    panel.on('hide', () => {
        editor.emit('help:howdoi:close');

        const history = settings.history.enabled;
        settings.history.enabled = false;
        settings.set('editor.howdoi', false);
        settings.history.enabled = history;

        editor.unbind('scene:name', positionWidget);
        editor.unbind('viewport:resize', positionWidget);

        if (!config.self.flags.tips.howdoi) {
            editor.call('guide:bubble:show', 'howdoi', bubble, 200, true);
        }
    });

    // open / close panel depending on settings
    settings.on('editor.howdoi:set', (value) => {
        panel.hidden = !value;
    });

    // input field
    const input = new LegacyTextField();
    input.blurOnEnter = false;
    input.renderChanges = false;
    input.keyChange = true;
    input.elementInput.placeholder = 'How do I...?';
    panel.append(input);

    // close button
    const close = new LegacyButton({
        text: 'Hide <span class="font-icon" style="position: absolute; top: 0">&#57650;</span>'
    });
    close.class.add('close');
    panel.append(close);

    close.on('click', () => {
        panel.hidden = true;
    });

    // menu with all the suggestions
    const menu = new LegacyMenu();
    menu.open = false;
    panel.append(menu);
    menu.elementOverlay.parentElement.removeChild(menu.elementOverlay);

    const suggestions = [];

    // Store event for when viewing (or not viewing) a topic
    const storeEvent = function (search, topic) {
        editor.api.globals.rest.home.homeSceneEvent(config.scene.id, {
            name: 'editor:help',
            title: topic,
            text: search
        });
    };

    // method to register new suggestions
    editor.method('help:howdoi:register', (data) => {

        // create new menu item
        const menuItem = new LegacyMenuItem({
            text: data.title
        });

        menu.append(menuItem);

        // add suggestion
        suggestions.push({
            data: data,
            menuItem: menuItem
        });

        // method that opens the popup for this menu item
        const openPopup = function () {
            // store popup event
            storeEvent(input.value, data.title);

            // open popup
            editor.call('help:howdoi:popup', data);
            // reset input value and blur field
            input.value = '';
            input.elementInput.blur();
            // hide menu
            menu.open = false;
        };

        // open popup on mousedown instead of 'click' because
        // for some reason the 'click' event doesn't always work here
        menuItem.element.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            openPopup();
        });

        // focus element on mouse enter
        const mouseEnter = function () {
            if (focusedMenuItem && focusedMenuItem !== menuItem.element) {
                focusedMenuItem.classList.remove('focused');
            }

            focusedMenuItem = menuItem.element;
            focusedMenuItem.classList.add('focused');

            // remove mouseenter listener until mouseleave fires to prevent
            // an issue with Firefox
            menuItem.element.removeEventListener('mouseenter', mouseEnter);
        };

        menuItem.element.addEventListener('mouseenter', mouseEnter);

        // unfocus element on mouse leave
        const mouseLeave = function () {
            if (focusedMenuItem && focusedMenuItem === menuItem.element) {
                focusedMenuItem.classList.remove('focused');
                focusedMenuItem = null;
            }

            menuItem.element.addEventListener('mouseenter', mouseEnter);
        };

        menuItem.element.addEventListener('mouseleave', mouseLeave);


        // on enter open the popup
        input.elementInput.addEventListener('keydown', (e) => {
            if (e.keyCode === 13) {
                if (focusedMenuItem === menuItem.element) {
                    e.preventDefault();
                    e.stopPropagation();

                    openPopup();
                }
            }
        });

    });

    // on esc delete the input text or hide the widget if no text is there
    input.elementInput.addEventListener('keydown', (e) => {
        if (e.keyCode === 27) {
            if (input.value) {
                storeEvent(input.value);
                input.value = '';
                input.elementInput.focus();
            } else {
                menu.open = false;
            }
        }
    });

    let blurTimeout;
    let focusing = false;

    // on focus open the menu and then refocus the input field
    input.elementInput.addEventListener('focus', () => {
        if (focusing) {
            return;
        }

        focusing = true;
        menu.open = true;

        if (blurTimeout) {
            clearTimeout(blurTimeout);
            blurTimeout = null;
        }

        setTimeout(() => {
            input.elementInput.focus();
            focusing = false;
        });

    });

    // on blur hide the menu
    input.elementInput.addEventListener('blur', () => {
        if (focusing) {
            return;
        }

        menu.open = false;
    });

    const filterSuggestions = function (text) {
        // sort suggestions by title first
        suggestions.sort((a, b) => {
            if (a.data.title < b.data.title) {
                return -1;
            }

            if (a.data.title > b.data.title) {
                return 1;
            }

            return 0;
        });

        if (text) {
            const query = [];

            // turn each word in a regex
            const words = text.split(' ');
            words.forEach((word) => {
                word = word.replace(/\W/g, ''); // remove invalid chars
                if (!word.length) {
                    return;
                }

                query.push(new RegExp(`(^|\\s)${word.replace(/\W/, '')}`, 'i'));
            });


            suggestions.forEach((suggestion) => {
                suggestion.score = 0;
            });

            let matched = suggestions.slice();
            let foundSomeMatches = false;

            // Score suggestions for each word in the text
            // Each word filters the results more and more
            query.forEach((q, index) => {
                const stageMatches = [];

                matched.forEach((suggestion) => {
                    // reset score and make menu item hidden
                    if (index === 0) {
                        suggestion.score = 0;
                        suggestion.menuItem.class.add('hidden');
                    }

                    const title = suggestion.data.title;
                    const keywords = suggestion.data.keywords;

                    let score = 0;

                    // match the title and increase score
                    // if match is closer to the start the score is bigger
                    let match = q.exec(title);
                    if (match) {
                        score += 1 / (match.index || 0.1);
                    }

                    // add to the score for each matched keyword
                    for (let i = 0, len = keywords.length; i < len; i++) {
                        match = q.exec(keywords[i]);
                        if (match) {
                            score++;
                        }
                    }

                    // add suggestion to this stage's matches
                    // each subsequent stage has less and less matches
                    if (score) {
                        suggestion.score += score;
                        stageMatches.push(suggestion);
                    }
                });

                if (stageMatches.length === 0) {
                    // if the first few words have no matches then
                    // skip them until we find some matches first
                    if (foundSomeMatches) {
                        matched = stageMatches;
                    }
                } else {
                    foundSomeMatches = true;
                    matched = stageMatches;
                }
            });

            // sort matches by score
            matched.sort((a, b) => {
                return b.score - a.score;
            });

            // show matches
            for (let i = matched.length - 1; i >= 0; i--) {
                matched[i].menuItem.class.remove('hidden');
                menu.innerElement.insertBefore(matched[i].menuItem.element, menu.innerElement.firstChild);
            }
        } else {
            // show all suggestions
            for (let i = suggestions.length - 1; i >= 0; i--) {
                suggestions[i].menuItem.class.remove('hidden');
                menu.innerElement.insertBefore(suggestions[i].menuItem.element, menu.innerElement.firstChild);
            }

        }

    };

    // filter suggestions as the user types
    input.on('change', (value) => {
        filterSuggestions(value);
    });

    // Focus next or previous suggestion
    const focusNextSuggestion = function (forward) {
        let next = forward ? menu.innerElement.firstChild : menu.innerElement.lastChild;
        if (focusedMenuItem) {
            focusedMenuItem.classList.remove('focused');

            if (forward) {
                if (focusedMenuItem.nextSibling) {
                    next = focusedMenuItem.nextSibling;
                }
            } else {
                if (focusedMenuItem.previousSibling) {
                    next = focusedMenuItem.previousSibling;
                }
            }
        }

        const valueBeforeLoop = next;

        while (next.classList.contains('hidden')) {
            if (forward) {
                next = next.nextSibling || menu.innerElement.firstChild;
            } else {
                next =  next.previousSibling || menu.innerElement.lastChild;
            }

            // avoid infinite loop
            if (next === valueBeforeLoop) {
                return;
            }
        }

        focusedMenuItem = next;
        focusedMenuItem.classList.add('focused');

        // scroll into view if needed
        const focusedRect = focusedMenuItem.getBoundingClientRect();
        const menuRect = menu.innerElement.getBoundingClientRect();

        if (focusedRect.bottom > menuRect.bottom) {
            menu.innerElement.scrollTop += focusedRect.bottom - menuRect.bottom;
        } else if (focusedRect.top < menuRect.top) {
            menu.innerElement.scrollTop -= menuRect.top - focusedRect.top;
        }

        return true;
    };

    // handle clicking outside menu in order to close it
    const click = function (e) {
        let parent = e.target;
        while (parent) {
            if (parent === panel.innerElement) {
                input.elementInput.focus();
                return;
            }

            parent = parent.parentElement;
        }

        menu.open = false;
    };

    // handle arrow keys to focus next / previous suggestion
    const key = function (e) {
        let result;

        if (e.keyCode === 38) { // up arrow
            result = focusNextSuggestion(false);
        } else if (e.keyCode === 40) { // down arrow
            result = focusNextSuggestion(true);
        }

        if (result) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    // handle open event
    menu.on('open', (open) => {
        if (open) {
            window.addEventListener('click', click);
            window.addEventListener('keydown', key);
            input.class.add('focus');
            menu.innerElement.scrollTop = 0;
            close.hidden = true;

            filterSuggestions();
        } else {
            window.removeEventListener('click', click);
            window.removeEventListener('keydown', key);
            input.class.remove('focus');
            if (focusedMenuItem) {
                focusedMenuItem.classList.remove('focused');
                focusedMenuItem = null;
            }
            close.hidden = false;

            if (input.value) {
                storeEvent(input.value);
            }

            input.value = '';
        }

    });

    const toggleWidget = function (toggle) {
        panel.hidden = !toggle;
        if (toggle) {
            setTimeout(() => {
                input.elementInput.focus();
            });
        }
    };

    // method to show the widget
    editor.method('help:howdoi', () => {
        toggleWidget(true);
    });

    // method to toggle the widget
    editor.method('help:howdoi:toggle', () => {
        toggleWidget(panel.hidden);
    });

    // hotkey
    editor.call('hotkey:register', 'help:howdoi', {
        key: ' ',
        ctrl: true,
        callback: function () {
            if (editor.call('picker:isOpen:otherThan', 'curve')) {
                return;
            }
            editor.call('help:howdoi');
        }
    });
});
