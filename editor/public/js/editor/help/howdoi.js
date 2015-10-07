editor.once('load', function () {
    'use strict';

    var viewport = editor.call('layout.viewport');

    var panel = new ui.Panel();
    panel.class.add('help-howdoi');
    viewport.append(panel);

    var input = new ui.TextField();
    input.renderChanges = false;
    input.keyChange = true;
    input.elementInput.placeholder = 'How do I...';
    panel.append(input);

    var close = new ui.Button({
        text: '&#58422;'
    });
    close.class.add('close');
    panel.append(close);

    close.on('click', function () {
        panel.hidden = true;
        editor.emit('help:howdoi:close');

        if (!config.self.tips['howdoi'])
            editor.call('guide:bubble:show', 'howdoi', bubble, 200, true);
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
        panel.hidden = false;
        editor.emit('help:howdoi:open');
    });

    var menu = new ui.Menu();
    menu.open = false;
    panel.append(menu);
    menu.elementOverlay.parentElement.removeChild(menu.elementOverlay);

    var suggestions = [];
    editor.method('help:howdoi:register', function (data) {
        suggestions.push(data);

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

    });

    // var timeout;

    input.elementInput.addEventListener('focus', function () {
        menu.open = true;
        input.elementInput.focus();

        // if (timeout) {
        //     clearTimeout(timeout);
        //     timeout = null;
        // }
    });

    // input.elementInput.addEventListener('blur', function () {
    //     timeout = setTimeout(function () {
    //         menu.open = false;
    //         timeout = null;
    //     }, 100);
    // });

    input.on('change', function (value) {
        var indices = filterSuggestions(value);
        for (var i = 0, len = menu.innerElement.childNodes.length; i < len; i++) {
            var child = menu.innerElement.childNodes[i];
            if (indices.indexOf(i) !== -1) {
                child.classList.remove('hidden');
            } else {
                child.classList.add('hidden');
            }
        };
    });

    var filterSuggestions = function (text) {
        if (! text)
            return suggestions.map(function (s, i) {
                return i;
            });

        var valid = [];

        // fuzzy search query
        var query = [];
        for (var i = 0, len = text.length; i < len; i++) {
            if (text[i] === ' ')
                continue;

            query.push(text[i]);
            query.push('.*?');
        }

        var regex = new RegExp(query.join(''), 'i');
        for (var i = 0, len = suggestions.length; i < len; i++) {
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

        return valid;
    };


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

    var focusedMenuItem;

    var key = function (e) {
        // up arrow
        if (e.keyCode === 38) {
            focusNextSuggestion(false);
        }
        // down arrow
        else if (e.keyCode === 40) {
            focusNextSuggestion(true);
        }
    };

    var focusNextSuggestion = function (forward) {
        var next = forward ? menu.innerElement.firstChild : menu.innerElement.lastChild;
        if (focusedMenuItem) {
            focusedMenuItem.classList.remove('focused');

            if (forward) {
                if (focusedMenuItem.nextSibling)
                    next = focusedMenuItem.nextSibling;
            } else {
                if (focusedMenuItem.previousSibling)
                    next = focusedMenuItem.nextSibling;
            }
        }

        var valueBeforeLoop = next;

        while (next.classList.contains('hidden')) {
            next = next.nextSibling || menu.innerElement.firstChild;

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
        focusedMenuItem.scrollIntoView();
    };

    menu.on('open', function (open) {
        if (open) {
            window.addEventListener('click', click);
            window.addEventListener('keydown', key);
            input.class.add('focus');
            menu.innerElement.scrollTop = 0;
        }
        else {
            window.removeEventListener('click', click);
            window.removeEventListener('keydown', key);
            input.class.remove('focus');
        }

    });

});