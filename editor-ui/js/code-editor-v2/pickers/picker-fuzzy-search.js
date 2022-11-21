editor.once('load', function () {
    'use strict';

    const root = editor.call('layout.root');
    const overlay = new ui.Overlay();
    overlay.class.add('picker-fuzzy-search');
    overlay.clickable = true;
    overlay.hidden = true;
    root.append(overlay);

    const parent = editor.call('layout.center');
    const panel = new ui.Panel();
    panel.hidden = true;
    panel.class.add('picker-fuzzy-search');
    parent.append(panel);

    // this is where we type our search query
    const fieldSearch = new ui.TextField();
    fieldSearch.elementInput.classList.add('hotkeys');
    fieldSearch.renderChanges = false;
    panel.append(fieldSearch);

    // shows results
    const menuResults = new ui.Menu();
    menuResults.open = true;
    menuResults.class.add('results');
    panel.append(menuResults);

    let findInFilesFakeAsset = null;
    const FIND_RESULTS = 'Find in Files';

    // selected item index
    let selectedIndex = 0;

    // scores for fuzzy search
    let scoreIndex = {};

    // keeps stack of assets selected
    // over time
    const selectionStack = [];

    // Open picker
    editor.method('picker:fuzzy:open', function () {
        overlay.hidden = false;
    });

    // Close picker
    editor.method('picker:fuzzy:close', function () {
        overlay.hidden = true;
    });

    overlay.on('show', function () {
        panel.hidden = false;
        menuResults.open = true;
        filterAssets();

        fieldSearch.focus();

        window.addEventListener('keydown', onKeyDown);

        editor.emit('picker:fuzzy:open');
    });

    overlay.on('hide', function () {
        panel.hidden = true;
        fieldSearch.value = '';

        window.removeEventListener('keydown', onKeyDown);

        editor.emit('picker:fuzzy:close');
    });


    // when an asset is selected
    // put it on the front of the stack
    editor.on('select:asset', function (asset) {
        if (asset.get('type') === 'folder') return;

        const id = asset.get('id');
        const idx = selectionStack.indexOf(id);
        if (idx !== -1) {
            selectionStack.splice(idx, 1);
        }

        selectionStack.push(id);
    });

    editor.on('tabs:focus', function (tab) {
        const id = tab.id;
        if (id !== FIND_RESULTS) return;

        // if the find results tab is focused create
        // a fake asset for the find results tab to be
        // able to view it in the picker
        findInFilesFakeAsset = new Observer({
            id: FIND_RESULTS,
            name: FIND_RESULTS,
            path: [],
            type: 'script'
        });

        const idx = selectionStack.indexOf(id);
        if (idx !== -1) {
            selectionStack.splice(idx, 1);
        }

        selectionStack.push(id);
    });

    editor.on('tabs:close', function (tab) {
        if (tab.id === FIND_RESULTS) {
            // clear fake asset if the find results tab is closed
            findInFilesFakeAsset = null;
        }
    });

    // when a document is closed remove it from the stack
    editor.on('documents:close', function (id) {
        const idx = selectionStack.indexOf(id);
        if (idx !== -1) {
            selectionStack.splice(idx, 1);
        }
    });

    // when a document if focused steal focus
    // if we are open
    editor.on('documents:focus', function (id) {
        if (!panel.hidden) {
            fieldSearch.focus();
        }
    });

    const pick = function (assetId) {
        if (assetId === FIND_RESULTS) {
            editor.call('tabs:findInFiles:focus');
            return;
        }

        // open new file in new tab (if it's not open already)
        editor.call('tabs:temp:lock');
        editor.call('files:select', assetId);
        editor.call('tabs:temp:unlock');

        // if the file is the temp tab then make it stick
        if (editor.call('tabs:isTemp', assetId))
            editor.call('tabs:temp:stick');
    };

    const openSelection = function () {
        const children = menuResults.innerElement.childNodes;
        const selected = children[selectedIndex];
        if (!selected) return;

        pick(selected.ui._assetId);
    };

    const selectIndex = function (index) {
        const children = menuResults.innerElement.childNodes;
        if (!children.length) return;

        if (index < 0)
            index = 0;
        else if (index > children.length - 1)
            index = children.length - 1;

        let item;
        if (selectedIndex === index) {
            item = children[index];
            if (!item || item.classList.contains('selected'))
                return;
        }

        item = children[selectedIndex];
        if (item)
            item.classList.remove('selected');

        item = children[index];
        if (!item) return;

        item.classList.add('selected');

        // scroll if necessary
        const container = item.parentElement;
        const containerBottom = container.scrollTop + container.offsetHeight;
        const itemBottom = item.offsetTop + item.offsetHeight;
        if (itemBottom > containerBottom)
            container.scrollTop += itemBottom - containerBottom;
        else if (item.offsetTop < container.scrollTop)
            container.scrollTop -= container.scrollTop - item.offsetTop;

        selectedIndex = index;
    };

    const onKeyDown = function (e) {
        // enter
        if (e.keyCode === 13) {
            e.preventDefault();
            e.stopPropagation();
            openSelection();
            editor.call('picker:fuzzy:close');
        } else if (e.keyCode === 27 || e.keyCode === 9) { // esc or tab
            e.preventDefault();
            e.stopPropagation();
            editor.call('picker:fuzzy:close');
        } else if (e.keyCode === 38) { // up
            selectIndex(selectedIndex - 1);
        } else if (e.keyCode === 40) { // down
            selectIndex(selectedIndex + 1);
        }
    };

    const createResultItem = function (asset, index) {
        const item = menuResults.createItem(asset.get('id'), {
            select: function () {
                pick(asset.get('id'));
                editor.call('picker:fuzzy:close');
            }
        });

        let path = asset.get('path');
        if (path && path.length) {
            for (let i = 0, len = path.length; i < len; i++) {
                const a = editor.call('assets:get', path[i]);
                path[i] = a ? a.get('name') : a.get('id');
            }

            path = path.join('/');
        } else {
            path = '/';
        }

        item.elementTitle.innerHTML =
            '<div class="name">' +
            asset.get('name') +
            '<span class="path">' +
            path +
            '</span></div>';
        item._assetId = asset.get('id');
        return item;
    };

    const refreshResults = function (results) {
        const children = menuResults.innerElement.childNodes;
        let item = children ? children[0] : null;
        while (item) {
            const next = item.nextSibling;
            item.ui.destroy();
            item = next;
        }

        for (let i = 0, len = results.length; i < len; i++) {
            const asset = results[i];
            menuResults.append(createResultItem(asset));
        }
    };

    // calculate score:
    // Higher score for more matches close to the beginning
    const calculateScore = function (name, pattern, patternLength) {
        let score = 0;
        const nameLength = name.length;
        let n = 0;
        let p = 0;

        while (n < nameLength && p < patternLength) {
            if (name[n] === pattern[p]) {
                score += 1 / (n + 1);
                p++;
            } else {
                let otherCase = name[n].toUpperCase();
                if (otherCase === name[n])
                    otherCase = name[n].toLowerCase();

                if (otherCase === pattern[p]) {
                    score += 0.9 / (n + 1);
                    p++;
                }
            }

            n++;
        }

        if (p < patternLength)
            score = 0;

        return score;
    };

    // Sorts search results by score
    const sortByScore = function (a, b) {
        const aid = a.get('id');
        const bid = b.get('id');
        if (scoreIndex[aid] !== undefined && scoreIndex[bid] !== undefined)
            return scoreIndex[bid] - scoreIndex[aid];

        if (scoreIndex[aid] === undefined && scoreIndex[bid] !== undefined)
            return 1;

        if (scoreIndex[bid] === undefined && scoreIndex[aid] !== undefined)
            return -1;

        return 0;
    };

    // Sorts by case insensitive name
    const sortByName = function (a, b) {
        const aname = a.get('name').toLowerCase();
        const bname = b.get('name').toLowerCase();
        if (aname < bname)
            return -1;
        if (aname > bname)
            return 1;
        return 0;
    };

    const fuzzySearch = function () {
        const assets = editor.call('assets:raw').data;

        const pattern = fieldSearch.value;
        const plen = pattern.length;

        scoreIndex = {};
        const results = [];

        function process(asset) {
            if (asset.get('type') === 'folder') return;

            const name = asset.get('name');

            const score = calculateScore(name, pattern, plen);
            if (!score) return;

            scoreIndex[asset.get('id')] = score;

            results.push(asset);
        }

        for (let i = 0, len = assets.length; i < len; i++) {
            process(assets[i]);
        }

        if (findInFilesFakeAsset) {
            process(findInFilesFakeAsset);
        }

        // sort and add menu items
        results.sort(sortByScore);
        refreshResults(results);

        // select first node
        selectIndex(0);
    };

    const stackBasedSearch = function () {
        const skipAssets = {};
        const results = [];

        // first add whatever is in the stack except the selected one
        let i = selectionStack.length - 1;
        while (--i >= 0) {
            let asset;
            if (selectionStack[i] === FIND_RESULTS) {
                asset = findInFilesFakeAsset;
            } else {
                asset = editor.call('assets:get', selectionStack[i]);
            }

            if (asset) {
                results.push(asset);
                skipAssets[selectionStack[i]] = true;
            }
        }

        // add the selected one
        i = selectionStack.length - 1;
        if (i >= 0) {
            let asset;
            if (selectionStack[i] === FIND_RESULTS) {
                asset = findInFilesFakeAsset;
            } else {
                asset = editor.call('assets:get', selectionStack[i]);
            }

            if (asset) {
                results.push(asset);
                skipAssets[selectionStack[i]] = true;
            }
        }

        // go through the rest of the assets and add them alphabetically
        const otherAssets = [];
        const assets = editor.call('assets:raw').data;
        for (let i = 0, len = assets.length; i < len; i++) {
            const asset = assets[i];
            if (asset.get('type') === 'folder' || skipAssets[asset.get('id')]) continue;
            otherAssets.push(asset);
        }

        otherAssets.sort(sortByName);

        refreshResults(results.concat(otherAssets));

        // select first node
        selectIndex(0);
    };

    const filterAssets = function () {
        if (fieldSearch.value) {
            fuzzySearch();
        } else {
            stackBasedSearch();
        }
    };

    // Handle input
    fieldSearch.elementInput.addEventListener('input', function (e) {
        if (panel.hidden) return;

        filterAssets();
    });
});
