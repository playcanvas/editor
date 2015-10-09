editor.once('load', function () {
    'use strict';

    var viewport = editor.call('layout.viewport');
    var designerSettings = editor.call('designerSettings');
    var focusedMenuItem = null;

    // create main panel
    var panel = new ui.Panel();
    panel.class.add('help-howdoi');
    viewport.append(panel);
    panel.hidden = true;

    var tipsLoaded = false;
    editor.once('help:howdoi:load', function () {
        tipsLoaded = true;
        checkShow();
    });

    var settingsLoaded = false;

    var checkShow = function () {
        if (tipsLoaded && settingsLoaded) {
            panel.hidden = !designerSettings.get('help');
        }
    };

    // hide / show panel based on designer settings
    editor.once('designerSettings:load', function () {
        settingsLoaded = true;
        checkShow();
    });

    // events when panel is shown
    panel.on('show', function () {
        editor.emit('help:howdoi:open');

        var history = designerSettings.history;
        designerSettings.history = false;
        designerSettings.set('help', true);
        designerSettings.history = history;

        editor.on('scene:name', positionWidget);
        editor.on('viewport:resize', positionWidget);
        positionWidget();
    });

    // events when panel is hidden
    panel.on('hide', function () {
        editor.emit('help:howdoi:close');

        var history = designerSettings.history;
        designerSettings.history = false;
        designerSettings.set('help', false);
        designerSettings.history = history;

        editor.unbind('scene:name', positionWidget);
        editor.unbind('viewport:resize', positionWidget);

        if (!config.self.tips['howdoi'])
            editor.call('guide:bubble:show', 'howdoi', bubble, 200, true);
    });

    // bubble that appears after closing the widget for the first time
    var bubble = function () {
        var bubble = editor.call(
            'guide:bubble',
            'Get more help when you need it',
            "Click here to bring back the help widget whenever you want.",
            40,
            '',
            'bottom',
            editor.call('layout.toolbar')
        );

        bubble.element.style.top = '';
        bubble.element.style.bottom = '118px';
        return bubble;
    };

    // open / close panel depending on designer settings
    designerSettings.on('help:set', function (value) {
        panel.hidden = !value;
    });

    // input field
    var input = new ui.TextField();
    input.renderChanges = false;
    input.keyChange = true;
    input.elementInput.placeholder = 'How do I...?';
    panel.append(input);

    // close button
    var close = new ui.Button({
        text: 'Hide <span class="font-icon">&#58422;</span>'
    });
    close.class.add('close');
    panel.append(close);

    close.on('click', function () {
        panel.hidden = true;
    });

    // menu with all the suggestions
    var menu = new ui.Menu();
    menu.open = false;
    panel.append(menu);
    menu.elementOverlay.parentElement.removeChild(menu.elementOverlay);

    var suggestions = [];

    // method to register new suggestions
    editor.method('help:howdoi:register', function (data) {

        // create new menu item
        var menuItem = new ui.MenuItem({
            text: data.title
        });

        menu.append(menuItem);

        // add suggestion
        suggestions.push({
            data: data,
            menuItem: menuItem
        });

        // method that opens the popup for this menu item
        var openPopup = function () {
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
        menuItem.element.addEventListener('mousedown', function (e) {
            e.stopPropagation() ;
            openPopup();
        });

        // focus element on mouse enter
        var mouseEnter = function () {
            if (focusedMenuItem && focusedMenuItem !== menuItem.element)
                focusedMenuItem.classList.remove('focused');

            focusedMenuItem = menuItem.element;
            focusedMenuItem.classList.add('focused');

            // remove mouseenter listener until mouseleave fires to prevent
            // an issue with Firefox
            menuItem.element.removeEventListener('mouseenter', mouseEnter);
        };

        menuItem.element.addEventListener('mouseenter', mouseEnter);

        // unfocus element on mouse leave
        var mouseLeave = function () {
            if (focusedMenuItem && focusedMenuItem === menuItem.element) {
                focusedMenuItem.classList.remove('focused');
                focusedMenuItem = null;
            }

            menuItem.element.addEventListener('mouseenter', mouseEnter);
        };

        menuItem.element.addEventListener('mouseleave', mouseLeave);


        // on enter open the popup
        input.elementInput.addEventListener('keydown', function (e) {
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
    input.elementInput.addEventListener('keydown', function (e) {
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

    var blurTimeout;

    // on focus open the menu and then refocus the input field
    input.elementInput.addEventListener('focus', function () {
        menu.open = true;
        input.elementInput.focus();

        if (blurTimeout) {
            clearTimeout(blurTimeout);
            blurTimeout = null;
        }

    });

    // on blur hide the menu
    input.elementInput.addEventListener('blur', function () {
        if (menu.open) {
            if (blurTimeout)
                clearTimeout(blurTimeout);

            // timeout necessary because when we focus the field and open the
            // menu the input field gets blurred
            blurTimeout = setTimeout(function () {
                menu.open = false;
                blurTimeout = null;
            });
        }
    });

    // Store event for when viewing (or not viewing) a topic
    var storeEvent = function (search, topic) {
        Ajax.post('/editor/scene/{{scene.id}}/events', {
            name: 'editor:help',
            title: topic,
            text: search
        });
    };

    // filter suggestions as the user types
    input.on('change', function (value) {
        filterSuggestions(value);
    });

    var filterSuggestions = function (text) {
        var valid;

        // sort suggestions by title first
        suggestions.sort(function (a, b) {
            if (a.data.title < b.data.title)
                return -1;

            if (a.data.title > b.data.title)
                return 1;

            if (a.data.title === b.data.title)
                return 0;
        });

        if (text) {
            var query = [];

            // turn each word in a regex
            var words = text.split(' ');
            words.forEach(function (word) {
                word = word.replace(/[^\w]/g, ''); // remove invalid chars
                if (! word.length) return;

                query.push(new RegExp('(^|\\s)' + word.replace(/[^\w]/, ''), 'i'));
            });


            suggestions.forEach(function (suggestion) {
                suggestion.score = 0;
            });

            var matched = suggestions.slice();
            var foundSomeMatches = false;

            // Score suggestions for each word in the text
            // Each word filters the results more and more
            query.forEach(function (q, index) {
                var stageMatches = [];

                matched.forEach(function (suggestion) {
                    // reset score and make menu item hidden
                    if (index === 0) {
                        suggestion.score = 0;
                        suggestion.menuItem.class.add('hidden');
                    }

                    var title = suggestion.data.title;
                    var keywords = suggestion.data.keywords;

                    var score = 0;

                    // match the title and increase score
                    // if match is closer to the start the score is bigger
                    var match = q.exec(title);
                    if (match) {
                        score += 1 / (match.index || 0.1);
                    }

                    // add to the score for each matched keyword
                    for (var i = 0, len = keywords.length; i < len; i++) {
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
                    if (foundSomeMatches)
                        matched = stageMatches;
                } else {
                    foundSomeMatches = true;
                    matched = stageMatches;
                }
            });

            // sort matches by score
            matched.sort(function (a, b) {
                return b.score - a.score;
            });

            // show matches
            for (i = matched.length - 1; i >= 0; i--) {
                matched[i].menuItem.class.remove('hidden');
                menu.innerElement.insertBefore(matched[i].menuItem.element, menu.innerElement.firstChild);
            }
        } else {
            // show all suggestions
            for (i = suggestions.length - 1; i >= 0; i--) {
                suggestions[i].menuItem.class.remove('hidden');
                menu.innerElement.insertBefore(suggestions[i].menuItem.element, menu.innerElement.firstChild);
            }

        }

    };


    // handle clicking outside menu in order to close it
    var click = function (e) {
        var parent = e.target;
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
    var key = function (e) {
        var result;

        // up arrow
        if (e.keyCode === 38) {
            result = focusNextSuggestion(false);
        }
        // down arrow
        else if (e.keyCode === 40) {
            result = focusNextSuggestion(true);
        }

        if (result) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    // Focus next or previous suggestion
    var focusNextSuggestion = function (forward) {
        var next = forward ? menu.innerElement.firstChild : menu.innerElement.lastChild;
        if (focusedMenuItem) {
            focusedMenuItem.classList.remove('focused');

            if (forward) {
                if (focusedMenuItem.nextSibling)
                    next = focusedMenuItem.nextSibling;
            } else {
                if (focusedMenuItem.previousSibling)
                    next = focusedMenuItem.previousSibling;
            }
        }

        var valueBeforeLoop = next;

        while (next.classList.contains('hidden')) {
            if (forward) {
                next = next.nextSibling || menu.innerElement.firstChild;
            } else {
                next =  next.previousSibling || menu.innerElement.lastChild;
            }

            if (next === valueBeforeLoop) // avoid infinite loop
                return;
        }

        focusedMenuItem = next;
        focusedMenuItem.classList.add('focused');

        // scroll into view if needed
        var focusedRect = focusedMenuItem.getBoundingClientRect();
        var menuRect = menu.innerElement.getBoundingClientRect();

        if (focusedRect.bottom > menuRect.bottom)
            menu.innerElement.scrollTop += focusedRect.bottom - menuRect.bottom;
        else if (focusedRect.top < menuRect.top) {
            menu.innerElement.scrollTop -= menuRect.top - focusedRect.top;
        }

        return true;
    };

    // handle open event
    menu.on('open', function (open) {
        if (open) {
            window.addEventListener('click', click);
            window.addEventListener('keydown', key);
            input.class.add('focus');
            menu.innerElement.scrollTop = 0;
            close.hidden = true;

            filterSuggestions();
        }
        else {
            window.removeEventListener('click', click);
            window.removeEventListener('keydown', key);
            input.class.remove('focus');
            if (focusedMenuItem) {
                focusedMenuItem.classList.remove('focused');
                focusedMenuItem = null;
            }
            close.hidden = false;

            if (input.value)
                storeEvent(input.value);

            input.value = '';
        }

    });

    var toggleWidget = function (toggle) {
        panel.hidden = !toggle;
        if (toggle) {
            setTimeout(function () {
                input.elementInput.focus();
            });
        }
    };

    // method to show the widget
    editor.method('help:howdoi', function () {
        toggleWidget(true);
    });

    // method to toggle the widget
    editor.method('help:howdoi:toggle', function () {
        toggleWidget(panel.hidden);
    });

    // hotkey
    editor.call('hotkey:register', 'help:howdoi', {
        key: 'space',
        ctrl: true,
        callback: function() {
            editor.call('help:howdoi');
        }
    });

    // position widget between top elements in viewport
    var positionWidget = function () {
        var canvasRect = editor.call('viewport:canvas').element.getBoundingClientRect();

        var titleWidget = document.querySelector('.widget-title');
        var titleWidgetRect = titleWidget ? titleWidget.getBoundingClientRect() : null;

        var topLeftWidth = titleWidgetRect ? titleWidgetRect.right - canvasRect.left : 0;

        var topControls = document.querySelector('.viewport-camera');
        var topControlsRect = topControls ? topControls.getBoundingClientRect() : null;

        var topRightWidth = topControlsRect ? canvasRect.left + canvasRect.width - topControlsRect.left : 0;

        var width = canvasRect.width - topLeftWidth - topRightWidth - 20;
        if (width < 150) {
            panel.class.add('hidden');
        } else {
            panel.class.remove('hidden');

            if (width > 400)
                width = 400;
        }


        panel.style.width = width + 'px';
        panel.style.left = (topLeftWidth + (((topControlsRect.left - titleWidgetRect.right) - width) / 2)) + 'px';
    };

});