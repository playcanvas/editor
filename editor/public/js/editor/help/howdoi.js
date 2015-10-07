editor.once('load', function () {
    'use strict';

    var viewport = editor.call('layout.viewport');

    var designerSettings = editor.call('designerSettings');

    var focusedMenuItem = null;

    var panel = new ui.Panel();
    panel.class.add('help-howdoi');
    viewport.append(panel);
    panel.hidden = true;

    editor.once('designerSettings:load', function () {
        panel.hidden = !designerSettings.get('help');
    });


    panel.on('show', function () {
        editor.emit('help:howdoi:open');

        designerSettings.set('help', true);
    });

    panel.on('hide', function () {
        editor.emit('help:howdoi:close');

        designerSettings.set('help', false);

        if (!config.self.tips['howdoi'])
            editor.call('guide:bubble:show', 'howdoi', bubble, 200, true);
    });

    // open / close panel depending on designer settings
    designerSettings.on('help:set', function (value) {
        panel.hidden = !value;
    });

    var input = new ui.TextField();
    input.renderChanges = false;
    input.keyChange = true;
    input.elementInput.placeholder = 'How do I...?';
    panel.append(input);

    var close = new ui.Button({
        text: 'Hide <span class="font-icon">&#58422;</span>'
    });
    close.class.add('close');
    panel.append(close);

    close.on('click', function () {
        panel.hidden = true;
    });

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

    editor.method('help:howdoi', function () {
        panel.hidden = !panel.hidden;
    });

    var menu = new ui.Menu();
    menu.open = false;
    panel.append(menu);
    menu.elementOverlay.parentElement.removeChild(menu.elementOverlay);

    var suggestions = [];

    var sortTimeout;

    editor.method('help:howdoi:register', function (data) {
        suggestions.push(data);

        if (sortTimeout)
            clearTimeout(sortTimeout);

        sortTimeout = setTimeout(sort, 100);
    });

    var sort = function () {
        suggestions.sort(function (a, b) {
            if (a.title < b.title)
                return -1;

            if (a.title > b.title)
                return 1;

            return 0;
        });

        suggestions.forEach(function (data) {
            var menuItem = new ui.MenuItem({
                text: data.title
            });

            menuItem.on('select', function () {
                editor.call('help:howdoi:popup', data);
                input.value = '';
            });
            menu.append(menuItem);

            input.elementInput.addEventListener('keydown', function (e) {
                if (focusedMenuItem === menuItem.element && e.keyCode === 13) {
                    e.preventDefault();
                    e.stopPropagation();

                    menuItem.emit('select');
                    input.elementInput.blur();
                    menu.open = false;
                }
            });

            menuItem.element.addEventListener('mouseenter', function () {
                if (focusedMenuItem && focusedMenuItem !== menuItem.element)
                    focusedMenuItem.classList.remove('focused');

                focusedMenuItem = menuItem.element;
                focusedMenuItem.classList.add('focused');
            });

            menuItem.element.addEventListener('mouseleave', function () {
                if (focusedMenuItem && focusedMenuItem === menuItem.element) {
                    focusedMenuItem.classList.remove('focused');
                    focusedMenuItem = null;
                }
            });
        });
    };

    input.elementInput.addEventListener('focus', function () {
        menu.open = true;
        input.elementInput.focus();
    });

    input.on('change', function (value) {
        filterSuggestions(value);
    });

    var filterSuggestions = function (text) {

        var valid;

        if (text) {
            valid = [];

            // fuzzy search query
            var query = [];

            var i, len;
            for (i = 0, len = text.length; i < len; i++) {
                if (text[i] === ' ')
                    continue;

                query.push(text[i]);
                query.push('.*?');
            }

            var regex = new RegExp(query.join(''), 'i');
            for (i = 0, len = suggestions.length; i < len; i++) {
                var suggestion = suggestions[i];
                if (regex.test(suggestion.title)) {
                    valid.push(i);
                    continue;
                }

                for (var j = 0, len2 = suggestion.keywords.length; j < len2; j++) {
                    if (regex.test(suggestion.keywords[j])) {
                        valid.push(i);
                        continue;
                    }
                }
            }

            for (var i = 0, len = menu.innerElement.childNodes.length; i < len; i++) {
                if (valid.indexOf(i) === -1)
                    menu.innerElement.childNodes[i].classList.add('hidden');
                else
                    menu.innerElement.childNodes[i].classList.remove('hidden');
            }

        } else {
            for (var i = 0, len = menu.innerElement.childNodes.length; i < len; i++) {
                menu.innerElement.childNodes[i].classList.remove('hidden');
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

    menu.on('open', function (open) {
        if (open) {
            window.addEventListener('click', click);
            window.addEventListener('keydown', key);
            input.class.add('focus');
            menu.innerElement.scrollTop = 0;
            close.hidden = true;
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
        }

    });

});