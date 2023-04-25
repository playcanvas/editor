import { Container, Menu, MenuItem, Overlay, TextInput } from '@playcanvas/pcui';

editor.once('load', function () {
    /** @type {Container} */
    const root = editor.call('layout.root');
    /** @type {Container} */
    const parent = editor.call('layout.center');

    const overlay = new Overlay({
        class: 'picker-fuzzy-search',
        clickable: true,
        hidden: true
    });
    root.append(overlay);

    const panel = new Container({
        class: 'picker-fuzzy-search',
        hidden: true
    });
    parent.append(panel);

    // this is where we type our search query
    const fieldSearch = new TextInput();
    fieldSearch.input.classList.add('hotkeys');
    panel.append(fieldSearch);

    // shows results
    const menuResults = new Menu({
        class: 'results',
        hidden: false
    });
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
    editor.method('picker:fuzzy:open', () => {
        overlay.hidden = false;
    });

    // Close picker
    editor.method('picker:fuzzy:close', () => {
        overlay.hidden = true;
    });

    overlay.on('show', () => {
        panel.hidden = false;
        menuResults.hidden = false;
        filterAssets();

        fieldSearch.focus();

        window.addEventListener('keydown', onKeyDown);

        editor.emit('picker:fuzzy:open');
    });

    overlay.on('hide', () => {
        panel.hidden = true;
        fieldSearch.value = '';

        window.removeEventListener('keydown', onKeyDown);

        editor.emit('picker:fuzzy:close');
    });


    // when an asset is selected
    // put it on the front of the stack
    editor.on('select:asset', (asset) => {
        if (asset.get('type') === 'folder') return;

        const id = asset.get('id');
        const idx = selectionStack.indexOf(id);
        if (idx !== -1) {
            selectionStack.splice(idx, 1);
        }

        selectionStack.push(id);
    });

    editor.on('tabs:focus', (tab) => {
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

    editor.on('tabs:close', (tab) => {
        if (tab.id === FIND_RESULTS) {
            // clear fake asset if the find results tab is closed
            findInFilesFakeAsset = null;
        }
    });

    // when a document is closed remove it from the stack
    editor.on('documents:close', (id) => {
        const idx = selectionStack.indexOf(id);
        if (idx !== -1) {
            selectionStack.splice(idx, 1);
        }
    });

    // when a document if focused steal focus
    // if we are open
    editor.on('documents:focus', (id) => {
        if (!panel.hidden) {
            fieldSearch.focus();
        }
    });

    const pick = (assetId) => {
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

    const openSelection = () => {
        const children = menuResults.innerElement.childNodes;
        const selected = children[selectedIndex];
        if (!selected) return;

        pick(selected.ui._assetId);
    };

    const selectIndex = (index) => {
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

    /** @param {KeyboardEvent} e - The keyboard event */
    const onKeyDown = (e) => {
        switch (e.key) {
            case 'Enter':
            case 'Escape':
            case 'Tab':
                e.preventDefault();
                e.stopPropagation();
                if (e.key === 'Enter')
                    openSelection();
                editor.call('picker:fuzzy:close');
                break;
            case 'ArrowUp':
                selectIndex(selectedIndex - 1);
                break;
            case 'ArrowDown':
                selectIndex(selectedIndex + 1);
                break;
        }
    };

    const createResultItem = (asset) => {
        const item = new MenuItem({
            onSelect: () => {
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

        // HACK: when we set the menu item's text, we want to set innerHTML
        item._labelText._unsafe = true;
        item.text = `<div class="name">${asset.get('name')}<span class="path">${path}</span></div>`;
        item._assetId = asset.get('id');
        return item;
    };

    const refreshResults = (results) => {
        menuResults.clear();

        for (const asset of results) {
            const menuItem = createResultItem(asset);
            menuResults.append(menuItem);
        }
    };

    // calculate score:
    // Higher score for more matches close to the beginning
    const calculateScore = (name, pattern, patternLength) => {
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
    const sortByScore = (a, b) => {
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
    const sortByName = (a, b) => {
        const aname = a.get('name').toLowerCase();
        const bname = b.get('name').toLowerCase();
        if (aname < bname)
            return -1;
        if (aname > bname)
            return 1;
        return 0;
    };

    const fuzzySearch = () => {
        const assets = editor.call('assets:raw').data;

        const pattern = fieldSearch.value;
        const plen = pattern.length;

        scoreIndex = {};
        const results = [];

        const process = (asset) => {
            if (asset.get('type') === 'folder') return;

            const name = asset.get('name');

            const score = calculateScore(name, pattern, plen);
            if (!score) return;

            scoreIndex[asset.get('id')] = score;

            results.push(asset);
        };

        for (const asset of assets) {
            process(asset);
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

    const stackBasedSearch = () => {
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
        for (const asset of assets) {
            if (asset.get('type') === 'folder' || skipAssets[asset.get('id')]) continue;
            otherAssets.push(asset);
        }

        otherAssets.sort(sortByName);

        refreshResults(results.concat(otherAssets));

        // select first node
        selectIndex(0);
    };

    const filterAssets = () => {
        if (fieldSearch.value) {
            fuzzySearch();
        } else {
            stackBasedSearch();
        }
    };

    // Handle input
    fieldSearch.input.addEventListener('input', (e) => {
        if (panel.hidden) return;

        filterAssets();
    });
});
