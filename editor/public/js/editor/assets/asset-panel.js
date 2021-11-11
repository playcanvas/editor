Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-asset-panel';
    const CLASS_FOLDERS = CLASS_ROOT + '-folders';
    const CLASS_CURRENT_FOLDER = CLASS_ROOT + '-current-folder';
    const CLASS_ASSET_HIGHLIGHTED = CLASS_ROOT + '-highlighted-asset';
    const CLASS_DETAILS_NAME = CLASS_ROOT + '-details-name';
    const CLASS_ASSET_GRID_ITEM = 'pcui-asset-grid-view-item';
    const CLASS_ASSET_SOURCE = CLASS_ASSET_GRID_ITEM + '-source';
    const CLASS_ASSET_NOT_REFERENCED = CLASS_ROOT + '-unreferenced-asset';

    const CLASS_USERS_CONTAINER = CLASS_ROOT + '-users';
    const CLASS_USER_INDICATOR = CLASS_USERS_CONTAINER + '-indicator';

    const CLASS_CONTROLS = CLASS_ROOT + '-controls';
    const CLASS_PROGRESS = CLASS_ROOT + '-progress';
    const CLASS_GRID_SMALL = CLASS_ROOT + '-grid-view-small';

    const CLASS_TASK_FAILED = CLASS_ROOT + '-task-failed';
    const CLASS_TASK_RUNNING = CLASS_ROOT + '-task-running';

    const CLASS_HIDE_ON_COLLAPSE = CLASS_ROOT + '-hide-on-collapse';
    const CLASS_BTN_SMALL = CLASS_ROOT + '-btn-small';
    const CLASS_BTN_STORE = CLASS_ROOT + '-btn-store';
    const CLASS_BTN_CONTAINER = CLASS_ROOT + '-btn-container';
    const CLASS_BTN_ACTIVE = CLASS_ROOT + '-btn-active';
    const CLASS_BTN_CLEAR_SEARCH = CLASS_ROOT + '-btn-clear-search';

    const CLASS_LEGACY_SCRIPTS_FOLDER = CLASS_ROOT + '-legacy-scripts';

    // asset types (used for filtering)
    const TYPES = {
        all: 'All',
        animation: 'Animation',
        audio: 'Audio',
        bundle: 'Asset Bundle',
        binary: 'Binary',
        container: 'Container',
        cubemap: 'Cubemap',
        css: 'Css',
        font: 'Font',
        fontSource: 'Font (source)',
        folderSource: 'Folder',
        json: 'Json',
        html: 'Html',
        material: 'Material',
        model: 'Model',
        sceneSource: 'Model (source)',
        render: 'Render',
        script: 'Script',
        shader: 'Shader',
        sprite: 'Sprite',
        template: 'Template',
        text: 'Text',
        texture: 'Texture',
        textureSource: 'Texture (source)',
        textureatlas: 'Texture Atlas',
        textureatlasSource: 'Texture Atlas (source)',
        wasm: 'Wasm'
    };

    // types of assets that can be double clicked
    const DBL_CLICKABLES = {
        folder: true,
        css: true,
        json: true,
        html: true,
        script: true,
        shader: true,
        sprite: true,
        text: true,
        textureatlas: true,
        animstategraph: true
    };

    // types of assets that we can drop stuff over
    const HOVERABLES = {
        folder: true,
        bundle: true
    };

    // regex to parse asset tags in search input
    const REGEX_TAGS = /^\[(.*)\]$/;
    // regex to parse asset sub-tags in search input
    const REGEX_SUB_TAGS = /\[(.*?)\]/g;

    // id of fake asset for legacy scripts folder
    const LEGACY_SCRIPTS_ID = 'legacyScripts';

    // used as a fake asset to represent the legacy scripts folder
    const LEGACY_SCRIPTS_FOLDER_ASSET = new Observer({
        id: LEGACY_SCRIPTS_ID,
        type: 'folder',
        source: true,
        name: 'scripts',
        path: []
    });

    // returns a random hex color
    function randomColor() {
        return Math.floor(Math.random() * 16777215).toString(16);
    }

    // Helper class for asset grid view item
    class AssetGridViewItem extends pcui.GridViewItem {
        constructor(args) {
            super(args);

            this.class.add(CLASS_ASSET_GRID_ITEM);

            this.thumbnail = new pcui.AssetThumbnail({
                assets: args.assets,
                canvasWidth: 64,
                canvasHeight: 64
            });

            this.prepend(this.thumbnail);

            this.containerUsers = new pcui.Container({
                flex: true,
                class: CLASS_USERS_CONTAINER,
                hidden: true
            });
            this.append(this.containerUsers);
            this.containerUsers.on('append', () => {
                this.containerUsers.hidden = false;
            });
            this.containerUsers.on('remove', () => {
                if (this.containerUsers.dom.childNodes.length === 0) {
                    this.containerUsers.hidden = true;
                }
            });

            this._asset = null;

            this._evtName = null;
        }

        showProgress() {
            if (!this.progress) {
                this.progress = new pcui.Progress({
                    value: 100,
                    hidden: true
                });

                this.appendAfter(this.progress, this.thumbnail);
            }

            return this.progress;
        }

        hideProgress() {
            if (this.progress) {
                this.progress.destroy();
                this.progress = null;
            }
        }

        link(asset) {
            super.link(asset, 'name');

            this._asset = asset;

            this._labelText.dom.title = asset.get('name');
            this._evtName = asset.on('name:set', (value) => {
                this._labelText.dom.title = value;
            });

            this.class.add('type-' + this._asset.get('type'));

            // pass the whole asset observer as the value
            // because we do not want the thumbnail to search the
            // asset list for the asset (e.g. this might be a dummy
            // asset like the script folder for legacy scripts). Also
            // if the asset is missing from the asset list for some reason
            // we still want to show a valid icon for it and not a 'missing' icon.
            this.thumbnail.value = asset;
            if (asset.get('source')) {
                this.class.add(CLASS_ASSET_SOURCE);
            } else {
                if (!editor.call('assets:used:get', asset.get('id'))) {
                    this.class.add(CLASS_ASSET_NOT_REFERENCED);
                }
            }
        }

        unlink() {
            if (!this._asset) return;

            super.unlink();

            if (this._evtName) {
                this._evtName.unbind();
                this._evtName = null;
            }

            this.classRemove(CLASS_ASSET_SOURCE);
            this.classRemove(CLASS_ASSET_NOT_REFERENCED);
            this.class.remove('type-' + this._asset.get('type'));

            this._asset = null;
            this.thumbnail.value = null;
        }
    }

    /**
     * @name pcui.AssetPanel
     * @classdesc Shows assets in various ways. Supports a grid view with large or
     * small thumbnails and a details view. Also shows the project's folders in a treeview
     * on the left. Allows filtering of assets by type and by searching in various ways. Allows
     * creating new assets and moving assets to different folders.
     * @augments pcui.Panel
     * @property {pcui.DropManager} The drop manager to support drag and drop.
     * @property {ObserverList} assets The asset list to display.
     * @property {Observer} currentFolder The current folder.
     * @property {pcui.Table} detailsView The details view.
     * @property {pcui.TreeView} foldersView The folders view.
     * @property {pcui.GridView} gridView The grid view.
     * @property {string} viewMode The current view mode. Can be one of:
     * pcui.AssetPanel.VIEW_LARGE_GRID,
     * pcui.AssetPanel.VIEW_SMALL_GRID,
     * pcui.AssetPanel.VIEW_DETAILS
     * @property {pcui.Element} activeView The current active view (details or gridview)
     * @property {pcui.Progress} progressBar The progress bar
     * @property {pcui.SelectInput} dropdownType The type dropdown
     * @property {pcui.TextInput} searchInput The search filter text input
     * @property {Observer[]} selectedAssets The selected assets
     * @property {Observer[]} visibleAssets The assets that are currently visible in the asset panel.
     * @property {boolean} showSourceAssets If false source assets will not be displayed
     * @property {boolean} suspendSelectionEvents If true selection events will not the editor's selector to be affected
     * @property {boolean} suspendFiltering If true changes to filters will not re-filter the asset panel.
     * @property {boolean} writePermissions If false then only a read-only view will be shown
     */
    class AssetPanel extends pcui.Panel {
        /**
         * Creates new AssetPanel.
         *
         * @param {object} args - The arguments
         */
        constructor(args) {
            args = Object.assign({
                headerText: 'ASSETS'
            }, args);

            args.flex = true;
            args.flexDirection = 'row';

            super(args);

            this.class.add(CLASS_ROOT);

            // append container for all controls
            this._containerControls = new pcui.Container({
                class: [CLASS_CONTROLS, CLASS_HIDE_ON_COLLAPSE],
                flex: true
            });
            this.header.append(this._containerControls);
            // stop click events so that the asset panel is only collapsed when you
            // click on the title
            this._containerControls.on('click', evt => evt.stopPropagation());

            this._tooltips = [];

            // header controls

            // button to create new asset
            this._btnNew = new pcui.Button({
                icon: 'E120',
                enabled: false,
                class: [CLASS_BTN_SMALL, CLASS_HIDE_ON_COLLAPSE]
            });
            this._btnNew.on('click', this._onClickNew.bind(this));
            this._containerControls.append(this._btnNew);

            this._createTooltip('Create or upload new Asset', this._btnNew);

            // button to delete asset
            this._btnDelete = new pcui.Button({
                icon: 'E124',
                enabled: false,
                class: [CLASS_BTN_SMALL, CLASS_HIDE_ON_COLLAPSE]
            });
            this._btnDelete.on('click', this._onClickDelete.bind(this));
            this._containerControls.append(this._btnDelete);

            this._createTooltip('Delete Asset', this._btnDelete);

            // button to go up on folder
            this._btnBack = new pcui.Button({
                icon: 'E114',
                enabled: false,
                class: [CLASS_BTN_SMALL, CLASS_HIDE_ON_COLLAPSE]
            });
            this._btnBack.on('click', this._onClickBack.bind(this));
            this._containerControls.append(this._btnBack);

            this._createTooltip('Go one folder up', this._btnBack);

            // contains view mode buttons
            const containerBtn = new pcui.Container({
                flex: true,
                flexDirection: 'row',
                class: [CLASS_BTN_CONTAINER, CLASS_HIDE_ON_COLLAPSE]
            });
            this._containerControls.append(containerBtn);

            // show large grid view mode
            this._btnLargeGrid = new pcui.Button({
                icon: 'E143',
                class: [CLASS_BTN_SMALL, CLASS_HIDE_ON_COLLAPSE]
            });
            this._btnLargeGrid.on('click', this._onClickLargeGrid.bind(this));
            containerBtn.append(this._btnLargeGrid);

            this._createTooltip('Grid view', this._btnLargeGrid);

            // show small grid view mode
            this._btnSmallGrid = new pcui.Button({
                icon: 'E145',
                class: [CLASS_BTN_SMALL, CLASS_HIDE_ON_COLLAPSE]
            });
            this._btnSmallGrid.on('click', this._onClickSmallGrid.bind(this));
            containerBtn.append(this._btnSmallGrid);

            this._createTooltip('Grid view (small)', this._btnSmallGrid);

            // show details view mode
            this._btnDetailsView = new pcui.Button({
                icon: 'E146',
                class: [CLASS_BTN_SMALL, CLASS_HIDE_ON_COLLAPSE]
            });
            this._btnDetailsView.on('click', this._onClickDetailsView.bind(this));
            containerBtn.append(this._btnDetailsView);

            this._createTooltip('Details view', this._btnDetailsView);

            // asset type dropdown filter
            const dropdownTypeOptions = Object.keys(TYPES)
            .filter(type => type !== 'bundle' || editor.call('users:hasFlag', 'hasBundles'))
            .map(type => {
                return {
                    v: type,
                    t: TYPES[type]
                };
            });
            this._dropdownType = new pcui.SelectInput({
                options: dropdownTypeOptions,
                value: 'all',
                class: CLASS_HIDE_ON_COLLAPSE
            });
            this._dropdownType.on('blur', () => {
                this._dropdownType.close();
            });

            this._containerControls.append(this._dropdownType);
            this._dropdownType.on('change', this._onDropDownTypeChange.bind(this));

            // search input filter
            this._searchInput = new pcui.TextInput({
                class: CLASS_HIDE_ON_COLLAPSE,
                keyChange: true,
                placeholder: 'Search'
            });
            this._containerControls.append(this._searchInput);
            this._searchInput.on('change', this._onSearchInputChange.bind(this));
            this._searchTags = null;
            this._searchPreviousValue = '';

            // clear search input
            this._btnClearSearch = new pcui.Button({
                icon: 'E132',
                hidden: true,
                class: CLASS_BTN_CLEAR_SEARCH
            });
            this._searchInput.dom.appendChild(this._btnClearSearch.dom);
            this._btnClearSearch.parent = this._searchInput;
            this._btnClearSearch.on('click', this._onClickClearSearch.bind(this));

            // Show asset store
            const btnStore = new pcui.Button({
                text: 'STORE',
                icon: 'E238',
                class: [CLASS_BTN_STORE, CLASS_HIDE_ON_COLLAPSE]
            });
            btnStore.on('click', this._onClickStore.bind(this));
            this._containerControls.append(btnStore);

            this._createTooltip('Open PlayCanvas Store', btnStore);

            // folders tree view
            this._containerFolders = new pcui.Container({
                class: CLASS_FOLDERS,
                resizable: 'right',
                resizeMin: 100,
                resizeMax: 300,
                width: 200,
                scrollable: true
            });
            this.append(this._containerFolders);

            this._foldersView = new pcui.TreeView({
                allowReordering: false,
                dragScrollElement: this._containerFolders,
                onReparent: this._onFolderTreeReparent.bind(this)
            });
            this._containerFolders.append(this._foldersView);

            this._foldersView.on('select', this._onFolderTreeSelect.bind(this));
            this._foldersView.on('deselect', this._onFolderTreeDeselect.bind(this));
            this._foldersView.on('dragstart', this._onFolderTreeDragStart.bind(this));

            // root folder element
            this._foldersViewRoot = new pcui.TreeViewItem({
                text: '/'
            });
            this._foldersViewRoot.on('hover', this._onRootFolderHover.bind(this));
            this._foldersViewRoot.on('hoverend', this._onRootFolderHoverEnd.bind(this));
            this._foldersViewRoot.open = true;
            this._foldersView.append(this._foldersViewRoot);

            // index of id->folder treeview item
            this._foldersIndex = {};
            // index of id->folder treeview item whose parent hasn't been added yet
            this._foldersWaitingParent = {};
            // index of filename->fake asset for legacy script
            this._legacyScriptsIndex = {};

            // the asset we are currently hovering over
            // undefined means nothing
            // null means root folder
            // otherwise this will be an asset
            this._hoveredAsset = undefined;

            // drag drop related
            this._eventsDropManager = [];
            this._foldersDropTarget = null;
            this._tableDropTarget = null;
            this._gridViewDropTarget = null;

            if (args.dropManager) {
                this.dropManager = args.dropManager;
            }

            // initial progress container
            this._containerProgress = new pcui.Container({
                class: CLASS_PROGRESS,
                flex: true,
                flexDirection: 'row'
            });
            this._progressBar = new pcui.Progress();
            this._progressBar.on('change', value => {
                if (value >= 100) {
                    // update view mode to show
                    // the appropriate panels and hide the
                    // progress container
                    const viewMode = this.viewMode;
                    this._viewMode = null;
                    this.viewMode = viewMode;
                } else {
                    this._containerProgress.hidden = false;
                    this._detailsView.hidden = true;
                    this._gridView.hidden = true;
                }
            });
            this._containerProgress.append(this._progressBar);
            this.append(this._containerProgress);

            // details view
            this._detailsView = new pcui.Table({
                scrollable: true,
                hidden: true,
                columns: [{
                    title: 'Name',
                    width: '40%',
                    minWidth: 100,
                    sortKey: 'name',
                    sortFn: this._sortByName.bind(this)
                }, {
                    title: 'Type',
                    width: '25%',
                    minWidth: 70,
                    sortKey: 'type',
                    sortFn: this._sortByType.bind(this)
                }, {
                    title: 'Size',
                    width: '10%',
                    minWidth: 60,
                    sortKey: 'file.size',
                    sortFn: this._sortByFileSize.bind(this)
                }],
                defaultSortColumn: 0,
                createRowFn: this._createDetailsViewRow.bind(this),
                getRowFn: this._getDetailsViewRow.bind(this),
                filterFn: this._filterAssetElement.bind(this)
            });
            this.append(this._detailsView);

            // grid view
            this._gridView = new pcui.GridView({
                scrollable: true,
                hidden: true,
                filterFn: this._filterAssetElement.bind(this)
            });
            this.append(this._gridView);

            // set initial view mode
            this.viewMode = args.viewMode || AssetPanel.VIEW_LARGE_GRID;

            // index of asset id-> row element
            this._rowsIndex = {};
            // index of asset id-> grid item
            this._gridIndex = {};
            // idnex of user id-> user indicator element
            this._usersIndex = {};

            // do not filter asset panel if true
            this._suspendFiltering = false;
            // do not emit selector events if true
            this._suspendSelectEvents = false;

            this._detailsView.on('select', this._onSelectAssetElement.bind(this));
            this._detailsView.on('deselect', this._onDeselectAssetElement.bind(this));

            this._gridView.on('select', this._onSelectAssetElement.bind(this));
            this._gridView.on('deselect', this._onDeselectAssetElement.bind(this));

            this._eventsEditor = [];
            this._eventsEditor.push(editor.on('selector:change', this._onSelectorChange.bind(this)));
            this._eventsEditor.push(editor.on('sourcefiles:add', this._onAddLegacyScript.bind(this)));
            this._eventsEditor.push(editor.on('sourcefiles:remove', this._onRemoveLegacyScript.bind(this)));
            this._eventsEditor.push(editor.on('selector:sync', this._onSelectorSync.bind(this)));
            this._eventsEditor.push(editor.on('whoisonline:remove', this._onWhoIsOnlineRemove.bind(this)));

            this._assetListEvents = [];

            this._assetEvents = {};

            this.currentFolder = null;

            this._showSourceAssets = true;

            this._prevSelectorItems = [];
            this._prevSelectorType = null;
            this._selectorItems = [];
            this._selectorType = null;
            this._selectedAssets = [];

            this.writePermissions = !!args.writePermissions;

            if (args.assets) {
                this.assets = args.assets;
            }

            this.on('showToRoot', () => {
                // register hotkeys

                // copy
                editor.call('hotkey:register', 'asset:copy', {
                    key: 'c',
                    ctrl: true,
                    skipPreventDefault: true,
                    callback: this._onCopyAssets.bind(this)
                });

                // paste
                editor.call('hotkey:register', 'asset:paste', {
                    key: 'v',
                    ctrl: true,
                    callback: () => this._onPasteAssets()
                });

                // paste (keep folder structure)
                editor.call('hotkey:register', 'asset:paste:keepFolderStructure', {
                    key: 'v',
                    ctrl: true,
                    shift: true,
                    callback: () => this._onPasteAssets(true)
                });

            });

            this.on('hideToRoot', () => {
                // unregister hotkeys
                editor.call('hotkey:unregister', 'asset:copy');
                editor.call('hotkey:unregister', 'asset:paste');
                editor.call('hotkey:unregister', 'asset:paste:keepFolderStructure');
            });
        }

        _createTooltip(text, target) {
            const tooltip = new pcui.Tooltip({
                description: text,
                align: 'bottom'
            });
            tooltip.style.padding = '8px';
            tooltip.attach({
                target: target
            });
            this._tooltips.push(tooltip);
        }

        _onCopyAssets() {
            if (this._currentFolder === LEGACY_SCRIPTS_FOLDER_ASSET) return;

            const selectedAssets = this.selectedAssets;
            if (!selectedAssets.length) return;

            editor.call('assets:copy', selectedAssets);
        }

        _onPasteAssets(keepFolderStructure) {
            if (!this._writePermissions) return;
            if (this._currentFolder === LEGACY_SCRIPTS_FOLDER_ASSET) return;

            const clipboard = editor.call('clipboard:get');
            if (!clipboard || clipboard.type !== 'asset') return;

            editor.call('assets:paste', this.currentFolder, keepFolderStructure);
        }

        // Sorts assets by name (case insensitive). Keeps legacy scripts folder on top always.
        _sortByName(a, b, ascending) {
            // keep legacy script folder on top
            if (a === LEGACY_SCRIPTS_FOLDER_ASSET) return -1;
            if (b === LEGACY_SCRIPTS_FOLDER_ASSET) return 1;

            const nameA = (a.get('name') || '').toLowerCase();
            const nameB = (b.get('name') || '').toLowerCase();
            if (nameA < nameB) return ascending ? -1 : 1;
            if (nameA > nameB) return ascending ? 1 : -1;
            return 0;
        }


        // Sorts assets by type. Keeps legacy scripts folder on top always.
        _sortByType(a, b, ascending) {
            // keep legacy script folder on top
            if (a === LEGACY_SCRIPTS_FOLDER_ASSET) return -1;
            if (b === LEGACY_SCRIPTS_FOLDER_ASSET) return 1;

            const typeA = a.get('type');
            const typeB = b.get('type');
            if (typeA < typeB) return ascending ? -1 : 1;
            if (typeA > typeB) return ascending ? 1 : -1;
            return 0;
        }

        // Sorts assets by file size. Keeps legacy scripts folder on top always.
        _sortByFileSize(a, b, ascending) {
            // keep legacy script folder on top
            if (a === LEGACY_SCRIPTS_FOLDER_ASSET) return -1;
            if (b === LEGACY_SCRIPTS_FOLDER_ASSET) return 1;

            const sizeA = parseInt(a.get('file.size'), 10);
            const sizeB = parseInt(b.get('file.size'), 10);

            if (isNaN(sizeA) && !isNaN(sizeB)) {
                return 1;
            } else if (!isNaN(sizeA) && isNaN(sizeB)) {
                return -1;
            }

            return ascending ? sizeA - sizeB : sizeB - sizeA;
        }

        _onClickStore() {
            window.open(config.url.store, '_blank');
        }

        // Shows new asset context menu
        _onClickNew() {
            // TODO: This needs to be refactored so that the menu
            // is created by the panel or passed in.
            const menu = editor.call('assets:contextmenu:create');
            const rect = this._btnNew.dom.getBoundingClientRect();
            menu.position(rect.right, rect.top);
            menu.hidden = false;
        }

        // Shows asset delete picker
        _onClickDelete() {
            if (!this._writePermissions)
                return;

            const type = editor.call('selector:type');
            if (type === 'asset') {
                editor.call('assets:delete:picker', editor.call('selector:items'));
            }
        }

        // Goes up on folder
        _onClickBack() {
            this.navigateBack();
        }

        // Sets view mode to large grid
        _onClickLargeGrid() {
            this.viewMode = AssetPanel.VIEW_LARGE_GRID;
        }

        // Sets view mode to small grid
        _onClickSmallGrid() {
            this.viewMode = AssetPanel.VIEW_SMALL_GRID;
        }

        // Sets view mode to details view
        _onClickDetailsView() {
            this.viewMode = AssetPanel.VIEW_DETAILS;
        }

        // Filter by type
        _onDropDownTypeChange() {
            if (this._suspendFiltering) return;
            this.filter();
        }

        // Convert string in form "tag1, tag2" to an array
        // of strings like so: "tag1", "tag2"
        _processTagsString(str) {
            return str.trim().split(',').map(s => s.trim());
        }

        // switch folder to selected asset
        // if we do not have selected assets in different folders
        _setCurrentFolderFromSelectedAssets() {
            if (!this._selectedAssets.length) return;

            const path = this._selectedAssets[0].get('path');
            for (let i = 1; i < this._selectedAssets.length; i++) {
                if (!path.equals(this._selectedAssets[i].get('path'))) {
                    return;
                }
            }

            const suspendFiltering = this._suspendFiltering;
            this._suspendFiltering = true;
            this.currentFolder = (path.length ? this._assets.get(path[path.length - 1]) : null);
            this._suspendFiltering = suspendFiltering;
        }

        _parseSearchTags(searchQuery) {
            let tags = searchQuery.match(REGEX_TAGS);
            if (!tags) return;
            tags = tags[1].trim();
            if (!tags.length) return;

            let subTags;
            while ((subTags = REGEX_SUB_TAGS.exec(tags)) !== null) {
                if (!this._searchTags) this._searchTags = [];
                this._searchTags.push(this._processTagsString(subTags[1]));
            }

            if (!this._searchTags) {
                this._searchTags = this._processTagsString(tags);
            }
        }

        // Analyzes tags first and then re-filters assets
        _onSearchInputChange(value) {
            this._searchTags = null;
            value = value.trim();

            if (this._searchPreviousValue === value) return;

            this._searchPreviousValue = value;

            if (!value) {
                this._setCurrentFolderFromSelectedAssets();
                this._btnClearSearch.hidden = true;
                this._searchInput.placeholder = 'Search';
            } else {
                this._parseSearchTags(value);
                this._btnClearSearch.hidden = false;
                this._searchInput.placeholder = '';
            }

            if (!this._suspendFiltering) {
                this.filter();
            }
        }

        _onClickClearSearch() {
            this._searchInput.value = '';
        }

        _refreshViewModeButtons() {
            this._btnLargeGrid.classRemove(CLASS_BTN_ACTIVE);
            this._btnSmallGrid.classRemove(CLASS_BTN_ACTIVE);
            this._btnDetailsView.classRemove(CLASS_BTN_ACTIVE);

            if (this._viewMode === AssetPanel.VIEW_DETAILS) {
                this._btnDetailsView.class.add(CLASS_BTN_ACTIVE);
            } else if (this._viewMode === AssetPanel.VIEW_SMALL_GRID) {
                this._btnSmallGrid.class.add(CLASS_BTN_ACTIVE);
            } else {
                this._btnLargeGrid.class.add(CLASS_BTN_ACTIVE);
            }
        }

        // Handle double click of asset element
        _onAssetDblClick(evt, asset) {
            evt.stopPropagation();
            evt.preventDefault();

            const type = asset.get('type');
            if (type === 'folder') {
                this.currentFolder = asset;

                // restore previous selection after
                // double clicking into a folder
                if (this._prevSelectorItems) {
                    editor.call('selector:set', this._prevSelectorType, this._prevSelectorItems);
                }
            } else if (type === 'sprite' || type === 'textureatlas') {
                // show sprite editor
                editor.call('picker:sprites', asset);
            } else if (type === 'css' ||
                       type === 'html' ||
                       type === 'json' ||
                       type === 'script' ||
                       type === 'shader' ||
                       type === 'text') {

                // show code editor
                if (type === 'script' && config.project.settings.useLegacyScripts) {
                    window.open('/editor/code/' + config.project.id + '/' + asset.legacyScript.get('filename'));
                } else if (!config.project.settings.useLegacyScripts) {
                    editor.call('picker:codeeditor', asset);
                } else {
                    window.open('/editor/asset/' + asset.get('id'), asset.get('id')).focus();
                }
            } else if (type === 'animstategraph') {
                editor.call('picker:animstategraph', asset);
            }

        }

        // Reset hovered asset
        _onDeactivateDropManager() {
            this._setHoveredAsset(undefined);
        }

        // Creates drop target for one asset dropped upon another
        _createAssetDropTarget(target) {
            const dropTarget = new pcui.DropTarget(target, {
                hole: true,
                passThrough: true,
                onFilter: this._onAssetDropFilter.bind(this),
                onDrop: this._onAssetDrop.bind(this)
            });
            dropTarget.style.outline = 'none';

            this._dropManager.append(dropTarget);

            return dropTarget;
        }

        // Returns true if the dragged type and data are valid assets
        _onAssetDropFilter(type, data) {
            // check if type is asset and if it's a valid int id (legacy scripts have string ids)
            if (type.startsWith('asset') && this._writePermissions) {
                if (data.id) {
                    return !!parseInt(data.id, 10);
                } else if (data.ids) {
                    return data.ids.filter(id => parseInt(id, 10)).length === data.ids.length;
                }
            }

            return false;
        }

        // Called when we drop an asset on a drop target.
        _onAssetDrop(type, data) {
            if (this._hoveredAsset === undefined || ! type || ! type.startsWith('asset') || !this._writePermissions) {
                return;
            }

            const items = editor.call('selector:items');
            var assets = [];

            const addAsset = (id) => {
                if (!parseInt(id, 10)) return; // this can happen for legacy scripts

                const asset = this._assets.get(id);

                // deselect moved asset
                if (items.indexOf(asset) !== -1)
                    editor.call('selector:remove', asset);

                assets.push(asset);
            };

            if (data.ids) {
                data.ids.forEach(addAsset);
            } else {
                addAsset(data.id);
            }

            const hoveredType = this._hoveredAsset ? this._hoveredAsset.get('type') : 'folder';
            if (hoveredType === 'folder') {
                // if we are dropping on a folder then move assets to that folder
                editor.call('assets:fs:move', assets, this._hoveredAsset);
            } else if (hoveredType === 'bundle') {
                // if we are dropping on a bundle then update asset bundle
                editor.call('assets:bundles:addAssets', assets, this._hoveredAsset);
            }
        }

        // Called when we start dragging an asset element
        _onAssetDragStart(evt, asset) {
            if (evt) {
                evt.preventDefault();
                evt.stopPropagation();
            }

            if (!this._writePermissions || !this._dropManager) return;

            let type = 'asset.' + asset.get('type');
            let data = {};

            if (asset.legacyScript) {
                data.filename = asset.legacyScript.get('filename');
            } else {
                data.id = asset.get('id');
            }

            const selectorType = editor.call('selector:type');
            const selectorItems = editor.call('selector:items');

            if (selectorType === 'asset' && selectorItems.length > 1) {
                const path = selectorItems[0].get('path');

                if (selectorItems.indexOf(asset) !== -1) {
                    const ids = [];
                    for (let i = 0; i < selectorItems.length; i++) {
                        // don't allow multi-path dragging
                        const curPath = selectorItems[i].get('path');
                        if (path.length !== curPath.length || path[path.length - 1] !== curPath[path.length - 1]) {
                            return;
                        }

                        ids.push(parseInt(selectorItems[i].get('id'), 10));
                    }

                    type = 'assets';
                    data = {
                        ids: ids
                    };
                }
            }

            // Activate drop manager
            this._dropManager.dropType = type;
            this._dropManager.dropData = data;
            this._dropManager.active = true;
        }

        _onRootFolderHover() {
            if (this._hoveredAsset === null) return;
            if (!this._dropManager || !this._dropManager.active || !this._dropManager.dropData) return;

            const dropData = this._dropManager.dropData;

            // check if dragged assets are already in root folder
            const draggedAsset = this._assets.get(dropData.id || dropData.ids[0]);
            if (draggedAsset) {
                if (draggedAsset.get('path').length === 0) {
                    return;
                }
            }

            this._setHoveredAsset(null);
        }

        _onRootFolderHoverEnd() {
            if (this._hoveredAsset === null) {
                this._setHoveredAsset(undefined);
            }
        }

        _onAssetHover(asset) {
            if (this._hoveredAsset === asset) return;
            if (!this._dropManager || !this._dropManager.active || !this._dropManager.dropData) return;

            // check if asset type is hoverable
            const hoveredType = asset.get('type');
            if (!HOVERABLES[hoveredType]) return;

            const hoveredAssetId = parseInt(asset.get('id'), 10);
            const dropData = this._dropManager.dropData;

            if (dropData.ids) {
                // do not allow dragging on itself
                if (dropData.ids.indexOf(hoveredAssetId) !== -1) {
                    return;
                }

                // do not allow source assets in bundle
                if (hoveredType === 'bundle') {
                    const sourceAssets = dropData.ids
                    .map(id => this._assets.get(id))
                    .filter(asset => asset && asset.get('source'));

                    if (sourceAssets.length) {
                        return;
                    }
                }
            } else if (dropData.id) {
                // do not allow dragging on itself
                if (parseInt(dropData.id, 10) === hoveredAssetId) {
                    return;
                }

                // do not allow source assets in bundle
                if (hoveredType === 'bundle') {
                    const sourceAsset = this._assets.get(dropData.id);
                    if (sourceAsset && sourceAsset.get('source')) {
                        return;
                    }
                }
            } else {
                return;
            }

            // check if dragged assets are already in this folder
            const draggedAsset = this._assets.get(dropData.id || dropData.ids[0]);
            if (draggedAsset) {
                const path = draggedAsset.get('path');
                if (path.length && path[path.length - 1] === hoveredAssetId) {
                    return;
                }
            }

            // do not allow dragging a folder into one of its child folders
            const hoveredPath = asset.get('path');
            if (dropData.ids) {
                for (let i = 0; i < dropData.ids.length; i++) {
                    if (hoveredPath.indexOf(dropData.ids[i]) !== -1) {
                        return;
                    }
                }
            } else {
                if (hoveredPath.indexOf(parseInt(dropData.id, 10)) !== -1) {
                    return;
                }
            }

            this._setHoveredAsset(asset);
        }

        // Update the hovered asset
        _setHoveredAsset(asset) {
            if (this._hoveredAsset === asset) return;

            if (this._hoveredAsset !== undefined) {
                // clear previous hovered asset
                if (this._hoveredAsset) {
                    const row = this._rowsIndex[this._hoveredAsset.get('id')];
                    if (row) {
                        row.classRemove(CLASS_ASSET_HIGHLIGHTED);
                    }

                    const gridItem = this._gridIndex[this._hoveredAsset.get('id')];
                    if (gridItem) {
                        gridItem.classRemove(CLASS_ASSET_HIGHLIGHTED);
                    }
                }

                const folder = this._hoveredAsset ? this._foldersIndex[this._hoveredAsset.get('id')] : this._foldersViewRoot;
                if (folder) {
                    folder.classRemove(CLASS_ASSET_HIGHLIGHTED);
                    this._foldersView.showDragHandle(null);
                }
            }

            this._hoveredAsset = asset;

            if (this._hoveredAsset !== undefined) {
                // highlight all asset elements
                if (this._hoveredAsset) {
                    const row = this._rowsIndex[this._hoveredAsset.get('id')];
                    if (row) {
                        row.class.add(CLASS_ASSET_HIGHLIGHTED);
                    }

                    const gridItem = this._gridIndex[this._hoveredAsset.get('id')];
                    if (gridItem) {
                        gridItem.class.add(CLASS_ASSET_HIGHLIGHTED);
                    }
                }

                const folder = this._hoveredAsset ? this._foldersIndex[this._hoveredAsset.get('id')] : this._foldersViewRoot;
                if (folder) {
                    folder.class.add(CLASS_ASSET_HIGHLIGHTED);
                    this._foldersView.showDragHandle(folder);
                }
            }
        }

        _onAssetHoverEnd(asset) {
            if (this._hoveredAsset === asset) {
                this._setHoveredAsset(undefined);
            }
        }

        // Creates a table row for the details view for the specified asset.
        _createDetailsViewRow(asset) {
            const row = new pcui.TableRow();

            // store asset in row for reference
            row.asset = asset;

            // store row in index
            this._rowsIndex[asset.get('id')] = row;

            const isLegacyScriptFolder = (asset === LEGACY_SCRIPTS_FOLDER_ASSET);
            if (isLegacyScriptFolder) {
                row.class.add(CLASS_LEGACY_SCRIPTS_FOLDER);
            }

            if (!asset.get('source') && !editor.call('assets:used:get', asset.get('id'))) {
                row.class.add(CLASS_ASSET_NOT_REFERENCED);
            }

            let domDblClick;

            // folder dbl click
            if (DBL_CLICKABLES[asset.get('type')]) {
                domDblClick = (evt) => this._onAssetDblClick(evt, asset);
                row.dom.addEventListener('dblclick', domDblClick);
            }

            let onMouseDown;
            let onDragStart;

            // if this is not the legacy script folder
            // make it draggable
            if (!isLegacyScriptFolder) {
                row.on('hover', () => {
                    this._onAssetHover(asset);
                });
                row.on('hoverend', () => {
                    this._onAssetHoverEnd(asset);
                });

                row.dom.draggable = true;

                // this allows dragging that gets disabled by layout.js
                onMouseDown = (evt) => evt.stopPropagation();
                row.dom.addEventListener('mousedown', onMouseDown);

                onDragStart = (evt) => this._onAssetDragStart(evt, asset);
                row.dom.addEventListener('dragstart', onDragStart);
            }


            // context menu (TODO: change this when the context menu becomes a PCUI element)
            editor.call('assets:contextmenu:attach', row, asset.legacyScript || asset);

            // clean up
            row.on('destroy', dom => {
                delete this._rowsIndex[asset.get('id')];
                if (onMouseDown) {
                    dom.removeEventListener('mousedown', onMouseDown);
                }
                if (onDragStart) {
                    dom.removeEventListener('dragstart', onDragStart);
                }
                if (domDblClick) {
                    dom.removeEventListener('dblclick', domDblClick);
                }
            });

            // thumb + name cell
            let cell = new pcui.TableCell({
                class: CLASS_DETAILS_NAME,
                alignItems: 'center'
            });
            row.append(cell);

            // thumb
            const thumb = new pcui.AssetThumbnail({
                assets: this._assets,
                value: asset,
                canvasWidth: 16,
                canvasHeight: 16
            });
            cell.append(thumb);

            row.showProgress = function () {
                if (!row.spinner) {
                    // spinner for running task
                    const spinner = new pcui.Spinner({
                        type: pcui.Spinner.TYPE_SMALL_THICK,
                        size: 16
                    });
                    row.spinner = spinner;
                    thumb.parent.appendAfter(spinner, thumb);
                }

                return row.spinner;
            };

            row.hideProgress = function () {
                if (row.spinner) {
                    row.spinner.destroy();
                    row.spinner = null;
                }
            };

            // asset name
            const labelName = new pcui.Label({
                binding: new pcui.BindingObserversToElement()
            });
            // make inline so that text-overflow will work
            labelName.style.display = 'inline';
            labelName.style.lineHeight = '24px';
            labelName.link(asset, 'name');
            labelName.on('change', () => {
                if (this._detailsView.sortKey === 'name') {
                    this._detailsView.sortObserver(asset);
                }
            });
            cell.append(labelName);

            // user indicators for remote users who select this asset
            const containerUsers = new pcui.Container({
                class: CLASS_USERS_CONTAINER,
                flex: true,
                hidden: true
            });
            cell.append(containerUsers);
            row.containerUsers = containerUsers;

            // only show users container when non empty
            containerUsers.on('append', () => {
                containerUsers.hidden = false;
            });
            containerUsers.on('remove', () => {
                if (containerUsers.dom.childNodes.length === 0) {
                    containerUsers.hidden = true;
                }
            });

            // type cell
            cell = new pcui.TableCell();
            row.append(cell);

            let typeKey = asset.get('type');
            if (asset.get('source')) {
                typeKey += 'Source';
            }

            let type = TYPES[typeKey];
            if (!type) {
                type = asset.get('type') || '';
                if (type) {
                    type = type[0].toUpperCase() + type.substring(1);
                }
            }

            const labelType = new pcui.Label({
                text: type
            });
            labelType.style.lineHeight = '24px';
            // make inline so that text-overflow will work
            labelType.style.display = 'inline';
            cell.append(labelType);

            // file size cell
            cell = new pcui.TableCell();
            row.append(cell);

            const labelSize = new pcui.Label({
                binding: new pcui.BindingObserversToElement({
                    customUpdate: (element, observers, paths) => {
                        if (!observers[0].has(paths[0])) {
                            element.value = '';
                        } else {
                            // convert value to bytes
                            element.value = bytesToHuman(observers[0].get(paths[0]));
                        }
                    }
                })
            });
            // make inline so that text-overflow will work
            labelSize.style.display = 'inline';
            labelSize.style.lineHeight = '24px';
            labelSize.link(asset, 'file.size');
            labelSize.on('change', () => {
                if (this._detailsView.sortKey === 'file.size') {
                    this._detailsView.sortObserver(asset);
                }
            });
            cell.append(labelSize);

            this._setElementTaskStatus(row, asset);

            return row;
        }

        // Returns row in details view for this asset
        _getDetailsViewRow(asset) {
            return this._rowsIndex[asset.get('id')];
        }

        // Applies specified function to all elements for that asset
        _applyFnToAssetElements(asset, fn) {
            const id = asset.get('id');

            // do folders first so that they will not be focused
            // when clicking the arrows in the grid view
            let element = this._foldersIndex[id];
            if (element) {
                fn(element);
            }

            element = this._gridIndex[id];
            if (element) {
                fn(element);
            }

            element = this._rowsIndex[id];
            if (element) {
                fn(element);
            }
        }

        _setAssetSelected(asset, selected) {
            this._applyFnToAssetElements(asset, element => {
                if (element.selected !== selected) {
                    element.selected = selected;
                }
            });
        }

        // update element based on asset task status
        _setElementTaskStatus(element, asset) {
            element.classRemove(CLASS_TASK_RUNNING);
            element.classRemove(CLASS_TASK_FAILED);

            const task = asset.get('task');
            if (task === 'failed') {
                element.class.add(CLASS_TASK_FAILED);
                if (element.showProgress) {
                    const progress = element.showProgress();
                    if (progress) {
                        progress.class.add(pcui.CLASS_ERROR);
                    }
                }

            } else if (task === 'running') {
                element.class.add(CLASS_TASK_RUNNING);
                if (element.showProgress) {
                    const progress = element.showProgress();
                    if (progress) {
                        progress.classRemove(pcui.CLASS_ERROR);
                    }
                }
            } else {
                if (element.hideProgress) {
                    element.hideProgress();
                }
            }
        }

        _onSelectAssetElement(element) {
            if (this._suspendSelectEvents) return;
            if (element.asset === LEGACY_SCRIPTS_FOLDER_ASSET) return;

            editor.call('selector:add', 'asset', element.asset.legacyScript || element.asset);
            this.emit('select', element.asset.legacyScript || element.asset);
        }

        _onDeselectAssetElement(element) {
            if (this._suspendSelectEvents) return;
            if (element.asset === LEGACY_SCRIPTS_FOLDER_ASSET) return;

            editor.call('selector:remove', element.asset.legacyScript || element.asset);
            this.emit('deselect', element.asset.legacyScript || element.asset);
        }

        _onSelectorChange(type, assets) {
            this._prevSelectorType = this._selectorType;
            this._prevSelectorItems = this._selectorItems;
            this._selectorType = type;
            this._selectorItems = assets;

            this._suspendSelectEvents = true;
            this.selectedAssets = (type === 'asset' ? assets : []);
            this._suspendSelectEvents = false;
        }

        _createUserIndicator(userId, userEntry, container) {
            const indicator = new pcui.Element(document.createElement('div'), {
                class: CLASS_USER_INDICATOR
            });
            indicator.style.backgroundColor = userEntry.color;
            container.append(indicator);
            userEntry.elements.push(indicator);

            indicator.once('destroy', () => {
                const index = userEntry.elements.indexOf(indicator);
                if (index >= 0) {
                    userEntry.elements.splice(index, 1);
                    if (userEntry.elements.length === 0) {
                        delete this._usersIndex[userId];
                    }
                }
            });
        }

        // Called when we receive remote users' selector state
        _onSelectorSync(userId, data) {
            let userEntry = this._usersIndex[userId];
            if (userEntry) {
                let i = userEntry.elements.length;
                while (i--) {
                    userEntry.elements[i].destroy();
                }
            }

            if (data.type !== 'asset') return;

            userEntry = {
                elements: [],
                color: editor.call('users:color', userId, 'hex') || randomColor()
            };
            this._usersIndex[userId] = userEntry;

            data.ids.forEach(assetId => {
                const gridItem = this._gridIndex[assetId];
                if (gridItem) {
                    this._createUserIndicator(userId, userEntry, gridItem.containerUsers);
                }

                const row = this._rowsIndex[assetId];
                if (row) {
                    this._createUserIndicator(userId, userEntry, row.containerUsers);
                }
            });
        }

        _onAddLegacyScript(script) {
            script.set('type', 'script'); // this seems to be needed for the inspector to work

            let fakeAsset = this._legacyScriptsIndex[script.get('filename')];
            if (!fakeAsset) {
                fakeAsset = new Observer({
                    id: script.get('filename'),
                    name: script.get('filename'),
                    type: 'script',
                    path: [LEGACY_SCRIPTS_ID]
                });

                fakeAsset.legacyScript = script;

                this._legacyScriptsIndex[script.get('filename')] = fakeAsset;
            }

            this._addAsset(fakeAsset, -1, true);
        }

        _onRemoveLegacyScript(script) {
            const asset = this._legacyScriptsIndex[script.get('filename')];
            if (asset) {
                this._removeAsset(asset);
            }

            delete this._legacyScriptsIndex[script.get('filename')];
        }

        _addAsset(asset, index, addToDetailsView) {
            const id = asset.get('id');

            // init events
            if (!this._assetEvents[id]) {
                this._assetEvents[id] = [];
            }

            // if it's a folder add it to the folder view
            if (asset.get('type') === 'folder') {
                this._addFolder(asset);
            }

            // if it's a target asset then update it if its references
            // change
            if (!asset.get('source')) {
                this._assetEvents[id].push(editor.on(`assets:used:${id}`, (used) => {
                    this._onAssetUsedChange(asset, used);
                }));
            }

            // change asset path
            this._assetEvents[id].push(asset.on('path:set', (path, oldPath) => {
                this._onAssetPathChange(asset, path, oldPath);
            }));

            this._assetEvents[id].push(asset.on('task:set', (value) => {
                this._onAssetTaskChange(asset, value);
            }));

            // add to grid view
            this._addGridItem(asset, index);

            // add to details view
            if (addToDetailsView) {
                this._detailsView.addObserver(asset, index);
            }
        }

        _addGridItem(asset, index) {
            const item = new AssetGridViewItem({
                assets: this._assets
            });

            item.link(asset);
            item.asset = asset;

            this._setElementTaskStatus(item, asset);

            const isLegacyScriptFolder = (asset === LEGACY_SCRIPTS_FOLDER_ASSET);
            if (isLegacyScriptFolder) {
                item.class.add(CLASS_LEGACY_SCRIPTS_FOLDER);
            }

            this._gridIndex[asset.get('id')] = item;

            let domDblClick;

            // folder dbl click
            if (DBL_CLICKABLES[asset.get('type')]) {
                domDblClick = (evt) => this._onAssetDblClick(evt, asset);
                item.dom.addEventListener('dblclick', domDblClick);
            }

            // context menu
            editor.call('assets:contextmenu:attach', item, asset.legacyScript || asset);

            let onMouseDown;
            let onDragStart;

            // drag
            if (!isLegacyScriptFolder) {
                item.dom.draggable = true;

                // hover
                item.on('hover', () => {
                    this._onAssetHover(asset);
                });
                item.on('hoverend', () => {
                    this._onAssetHoverEnd(asset);
                });

                // this allows dragging that gets disabled by layout.js
                onMouseDown = (evt) => {
                    evt.stopPropagation();
                };

                item.dom.addEventListener('mousedown', onMouseDown);

                onDragStart = (evt) => this._onAssetDragStart(evt, asset);
                item.dom.addEventListener('dragstart', onDragStart);
            }

            item.on('destroy', dom => {
                if (domDblClick) {
                    dom.removeEventListener('dblclick', domDblClick);
                }

                if (onMouseDown) {
                    dom.removeEventListener('mousedown', onMouseDown);
                }
                if (onDragStart) {
                    dom.removeEventListener('dragStart', onDragStart);
                }

                delete this._gridIndex[asset.get('id')];
            });

            if (!isLegacyScriptFolder) {
                let appendBefore = null;
                if (index >= 0 && this._assets.data[index + 1]) {
                    appendBefore = this._gridIndex[this._assets.data[index + 1].get('id')];
                }
                this._gridView.appendBefore(item, appendBefore);
            } else {
                this._gridView.prepend(item);
            }

            return item;
        }

        _removeAsset(asset) {
            const id = asset.get('id');
            if (this._assetEvents[id]) {
                this._assetEvents[id].forEach(evt => evt.unbind());
                delete this._assetEvents[id];
            }

            if (asset.get('type') === 'folder') {
                this._removeFolder(asset);
            }

            this._detailsView.removeObserver(asset);

            const gridItem = this._gridIndex[id];
            if (gridItem) {
                gridItem.destroy();
            }

            // if the removed asset is the current folder or a parent of
            // the current folder then reset the current folder
            if (this.currentFolder) {
                // get parent folders of current folder
                const path = this.currentFolder.get('path');
                // add current folder at end of path
                path.push(parseInt(this.currentFolder.get('id'), 10));

                // get index of removed asset in full path
                const index = path.indexOf(parseInt(asset.get('id'), 10));

                if (index !== -1) {
                    let current = null;

                    if (index > 0) {
                        for (let i = index - 1; i >= 0; i--) {
                            current = this._assets.get(path[i]);
                            if (current) {
                                break;
                            }
                        }
                    }

                    this.currentFolder = current;
                }
            }
        }

        _moveAsset(asset, index) {
            const suspendEvents = this._suspendSelectEvents;
            this._suspendSelectEvents = true;

            const folder = this._foldersIndex[asset.get('id')];
            // move folder alphabetically
            if (folder) {
                const selected = folder.selected;
                const parent = folder.parent;
                parent.remove(folder);
                this._insertTreeItemAlphabetically(parent, folder);
                folder.selected = selected;
            }

            // reorder grid item
            const gridItem = this._gridIndex[asset.get('id')];
            if (gridItem) {
                const selected = gridItem.selected;
                this._gridView.remove(gridItem);
                if (this._assets.data[index + 1]) {
                    this._gridView.appendBefore(gridItem, this._gridIndex[this._assets.data[index + 1].get('id')]);
                } else {
                    this._gridView.append(gridItem);
                }
                gridItem.selected = selected;
            }

            this._suspendSelectEvents = suspendEvents;
        }

        _onAssetPathChange(asset, path, oldPath) {
            // show or hide based on filters
            const row = this._rowsIndex[asset.get('id')];
            if (row) {
                row.hidden = !this._filterAssetElement(row);
            }

            const gridItem = this._gridIndex[asset.get('id')];
            if (gridItem) {
                gridItem.hidden = !this._filterAssetElement(gridItem);
            }

            if (asset.get('type') === 'folder') {

                // early out if the asset has the same parent
                if (path[path.length - 1] === oldPath[oldPath.length - 1]) return;

                const folder = this._foldersIndex[asset.get('id')];
                // remove folder and add it under the right parent
                if (folder) {
                    if (folder.parent) {
                        folder.parent.remove(folder);
                    }

                    let newParent;
                    if (path.length) {
                        newParent = this._foldersIndex[path[path.length - 1]];

                        if (!newParent) {
                            // unlikely to ever happen...
                            this._removeFolder(asset);
                            this._queueAssetToWaitForParent(asset.get('id'), path[path.length - 1]);
                        }
                    } else {
                        newParent = this._foldersViewRoot;
                    }

                    if (newParent) {
                        this._insertTreeItemAlphabetically(newParent, folder);
                    }
                }
            }
        }

        _onAssetTaskChange(asset) {
            this._applyFnToAssetElements(asset, element => {
                this._setElementTaskStatus(element, asset);
            });
        }

        _addFolder(asset) {
            const id = asset.get('id');

            // find parent
            let parent;
            const path = asset.get('path');
            let parentId;
            if (path && path.length) {
                parentId = path[path.length - 1];
                parent = this._foldersIndex[path[path.length - 1]];
            } else {
                parentId = '';
                parent = this._foldersViewRoot;
            }

            // if we can't find the parent skip this folder
            // it will be added later when its parent is added
            if (!parent) {
                this._queueAssetToWaitForParent(id, parentId);
                return;
            }

            if (this._foldersIndex[id]) return;

            const isLegacyScriptFolder = (asset === LEGACY_SCRIPTS_FOLDER_ASSET);

            const treeItem = new pcui.TreeViewItem({
                text: asset.get('name'),
                allowDrop: !isLegacyScriptFolder,
                allowDrag: !isLegacyScriptFolder
            });

            if (!isLegacyScriptFolder) {
                treeItem.on('hover', () => {
                    this._onAssetHover(asset);
                });
                treeItem.on('hoverend', () => {
                    this._onAssetHoverEnd(asset);
                });
            } else {
                treeItem.class.add(CLASS_LEGACY_SCRIPTS_FOLDER);
            }

            editor.call('assets:contextmenu:attach', treeItem, asset.legacyScript || asset);

            treeItem.asset = asset;

            this._foldersIndex[id] = treeItem;

            if (!this._assetEvents[id]) {
                this._assetEvents[id] = [];
            }

            let evtName = asset.on('name:set', (value) => {
                treeItem.text = value;
            });

            treeItem.on('destroy', () => {
                if (evtName) {
                    evtName.unbind();
                    evtName = null;
                }
            });

            this._insertTreeItemAlphabetically(parent, treeItem);

            // add child folders
            if (this._foldersWaitingParent[id]) {
                this._foldersWaitingParent[id].forEach(childId => {
                    const childAsset = this._assets.get(childId);
                    if (childAsset) {
                        this._addFolder(childAsset);
                    }
                });

                delete this._foldersWaitingParent[id];
            }

            return treeItem;
        }

        _queueAssetToWaitForParent(assetId, parentId) {
            if (!this._foldersWaitingParent[parentId]) {
                this._foldersWaitingParent[parentId] = new Set();
            }

            this._foldersWaitingParent[parentId].add(assetId);
        }

        _insertTreeItemAlphabetically(parentTreeItem, treeItem) {
            // ensure the legacy scripts folder remains at the top
            const legacyFolder = this._foldersIndex[LEGACY_SCRIPTS_ID];

            // find the right spot to insert the tree item based on alphabetical order
            const text = treeItem.asset.get('name').toLowerCase();
            let sibling = parentTreeItem.firstChild;
            while (sibling) {
                if (sibling !== treeItem && sibling !== legacyFolder && sibling.asset.get('name').toLowerCase() > text) {
                    if (!treeItem.parent) {
                        parentTreeItem.appendBefore(treeItem, sibling);
                    } else {
                        // this is just a sanity check but if
                        // the tree item is already parented then
                        // just call insertBefore on the DOM directly
                        // so that no additional append events are raised,
                        // since we only really want to reorder the tree item under
                        // the same parent. If we call regular appendBefore then
                        // that will cause duplicate unnecessary events to be
                        // fired on the tree item and the tree view.
                        parentTreeItem.domContent.insertBefore(treeItem.dom, sibling.dom);
                    }
                    break;
                }

                sibling = sibling.nextSibling;
            }

            if (!treeItem.parent) {
                parentTreeItem.append(treeItem);
            }

            if (legacyFolder) {
                if (this._foldersViewRoot.firstChild !== legacyFolder) {
                    this._foldersViewRoot.remove(legacyFolder);
                    this._foldersViewRoot.appendBefore(legacyFolder, this._foldersViewRoot.firstChild);
                }
            }
        }

        _removeFolder(asset) {
            const id = asset.get('id');

            if (this._foldersIndex[id]) {
                this._foldersIndex[id].destroy();
                delete this._foldersIndex[id];
            }

            if (this._foldersWaitingParent[id]) {
                delete this._foldersWaitingParent[id];
            }
        }

        _onFolderTreeReparent(reparentedItems) {
            const assets = reparentedItems.map(reparented => {
                return reparented.item.asset;
            });

            editor.call('assets:fs:move', assets, reparentedItems[0].newParent.asset || null);
        }

        _onFolderTreeSelect(item) {
            if (this._suspendSelectEvents) return;

            if (item.asset === LEGACY_SCRIPTS_FOLDER_ASSET) {
                item.selected = false;
                this.currentFolder = item.asset;
                return;
            }

            if (item.asset) {
                if (this._foldersView.pressedCtrl || this._foldersView.pressedShift) {
                    editor.call('selector:add', 'asset', item.asset);
                } else {
                    if (item.asset === this.currentFolder) {
                        editor.call('selector:set', 'asset', [item.asset]);
                    } else {
                        item.selected = false;
                        this.currentFolder = item.asset;
                    }
                }
            } else {
                item.selected = false;
                this.currentFolder = null;
            }
        }

        _onFolderTreeDeselect(item) {
            if (this._suspendSelectEvents) return;

            if (this._foldersView.selected.length === 1 && !this._foldersView.pressedCtrl && !this._foldersView.pressedShift) {
                // if we deselected all folders but one then this probably means we
                // just clicked on an already selected folder so clear the current selection completely
                // and switch to that folder as this feels more like what would be expected by the user.
                this._suspendSelectEvents = true;
                this._foldersView.deselect();
                editor.call('selector:clear');
                this._suspendSelectEvents = false;
            } else if (item.asset && item.asset !== LEGACY_SCRIPTS_FOLDER_ASSET) {
                editor.call('selector:remove', item.asset);
            }
        }

        _onFolderTreeDragStart(items) {
            this._onAssetDragStart(null, items[0].asset);
        }

        // Perform AND operation between tags
        _tagsAND(tagGroup, assetTags) {
            for (let i = 0; i < tagGroup.length; i++) {
                if (assetTags.indexOf(tagGroup[i]) === -1) {
                    return false;
                }
            }

            return true;
        }

        // Perform OR operation between tags or groups of subtags
        _tagsOR(tagGroup, assetTags) {
            for (let i = 0; i < tagGroup.length; i++) {
                if (Array.isArray(tagGroup[i])) {
                    if (this._tagsAND(tagGroup[i], assetTags)) {
                        return true;
                    }
                } else if (assetTags.indexOf(tagGroup[i]) !== -1) {
                    return true;
                }
            }

            return false;
        }

        // Show or hide an element based on the current filters
        _filterAssetElement(element) {
            if (!element.asset) return false;

            if (this._dropdownType.value !== 'all') {
                if (this._dropdownType.value !== (element.asset.get('source') ? element.asset.get('type') + 'Source' : element.asset.get('type'))) {
                    return false;
                }
            }

            // do not show source assets if flag disabled (except for folders)
            if (!this._showSourceAssets && element.asset.get('source') && element.asset.get('type') !== 'folder') {
                return false;
            }

            if (this.validateAssetsFn && !this.validateAssetsFn(element.asset)) {
                return false;
            }

            const name = element.asset.get('name');

            const searchQuery = this._searchInput.value;

            if (searchQuery) {
                if (this._searchTags) {
                    // check for tags
                    const tags = element.asset.getRaw('tags');
                    if (tags.length === 0) {
                        return false;
                    }

                    return this._tagsOR(this._searchTags, tags);

                } else if (searchQuery[0] === '*' && searchQuery.length > 1) {
                    // check for regular expression first if the query starts with '*'
                    try {
                        if (new RegExp(searchQuery.slice(1), 'i').test(name)) {
                            return true;
                        }
                    } catch (ex) {} // swallow exception and continue
                }

                // check if name includes search query
                if (!name.toLowerCase().includes(searchQuery.toLowerCase())) {

                    // if id matches then return true immediately
                    const id = parseInt(searchQuery, 10);
                    if (id && element.asset.get('id') === id)  {
                        return true;
                    }

                    return false;
                }
            }

            if (this._currentFolder === LEGACY_SCRIPTS_FOLDER_ASSET) {
                return !!element.asset.legacyScript;
            }

            // if we have a search query then show results from this folder and subfolders too
            const path = element.asset.get('path');
            if (searchQuery) {
                if (!this._currentFolder) {
                    return true;
                }

                return path.includes(parseInt(this._currentFolder.get('id'), 10));
            }

            // at this stage only return true if the asset is in the current folder
            if (!this._currentFolder) {
                return !path.length;
            }

            return path[path.length - 1] === parseInt(this._currentFolder.get('id'), 10);
        }

        _onWhoIsOnlineRemove(userId) {
            const userEntry = this._usersIndex[userId];
            if (!userEntry) {
                return;
            }

            let i = userEntry.elements.length;
            while (i--) {
                userEntry.elements[i].destroy();
            }
        }

        _onAssetUsedChange(asset, used) {
            this._applyFnToAssetElements(asset, element => {
                if (used) {
                    element.classRemove(CLASS_ASSET_NOT_REFERENCED);
                } else {
                    element.classAdd(CLASS_ASSET_NOT_REFERENCED);
                }
            });
        }

        toggleDetailsView() {
            this._detailsView.hidden = !this._detailsView.hidden;
            this._gridView.hidden = !this._detailsView.hidden;
        }

        _filterView(view) {
            view.hidden = false;
            this._containerProgress.hidden = true;

            // cancel any filtering currently in progress
            view.filterAsyncCancel();

            let evtDelay, evtCancel, evtEnd;

            // show progress if filtering takes longer
            evtDelay = view.once('filter:delay', () => {
                evtDelay = null;
                this._containerProgress.hidden = false;
            });

            // hide progress when filtering ends
            evtEnd = view.once('filter:end', () => {
                if (evtDelay) {
                    evtDelay.unbind();
                    evtDelay = null;
                }

                if (evtCancel) {
                    evtCancel.unbind();
                    evtCancel = null;
                }

                this._containerProgress.hidden = true;
            });

            evtCancel = view.once('filter:cancel', () => {
                if (evtDelay) {
                    evtDelay.unbind();
                    evtDelay = null;
                }

                if (evtEnd) {
                    evtEnd.unbind();
                    evtEnd = null;
                }
            });

            // filter current view
            view.filterAsync();
        }

        /**
         * @name pcui.AssetPanel#filter
         * @description Filters the asset panel based on the current filters active.
         */
        filter() {
            if (!this._assets) return;

            if (this.viewMode === AssetPanel.VIEW_DETAILS) {
                this._gridView.hidden = true;
                this._gridView.filterAsyncCancel();

                this._filterView(this._detailsView);
            } else {
                this._detailsView.hidden = true;
                this._detailsView.filterAsyncCancel();

                this._filterView(this._gridView);
            }
        }

        /**
         * @name pcui.AssetPanel#navigateBack
         * @description Navigates one folder back from the current folder
         */
        navigateBack() {
            if (!this.currentFolder) return;

            const path = this.currentFolder.get('path');
            let folder = null;
            if (path.length) {
                folder = this._assets.get(path[path.length - 1]);
            }

            this.currentFolder = folder;
        }

        destroy() {
            if (this._destroyed) return;

            this._legacyScriptsIndex = {};

            this._eventsEditor.forEach(e => e.unbind());
            this._eventsEditor.length = 0;

            this.dropManager = null;

            this.assets = null;

            this._tooltips.forEach(tooltip => tooltip.destroy());
            this._tooltips.length = 0;

            super.destroy();
        }

        get assets() {
            return this._assets;
        }

        set assets(value) {
            this._setHoveredAsset(undefined);

            this._prevSelectorType = null;
            this._prevSelectorItems = [];
            this._selectorType = null;
            this._selectorItems = [];
            this._selectedAssets = [];

            this._assetListEvents.forEach(e => e.unbind());
            this._assetListEvents.length = 0;

            this._detailsView.unlink();
            this._gridView.clear();

            for (const id in this._foldersIndex) {
                this._foldersIndex[id].destroy();
            }
            this._foldersIndex = {};

            this._foldersWaitingParent = {};

            this._assets = value;
            if (!this._assets) return;

            const assets = this._assets.array();

            // add legacy scripts too
            if (config.project.settings.useLegacyScripts) {
                assets.unshift(LEGACY_SCRIPTS_FOLDER_ASSET); // keep legacy scripts folder on top
                for (const id in this._legacyScriptsIndex) {
                    assets.push(this._legacyScriptsIndex[id]);
                }
            }

            assets.forEach(asset => {
                this._addAsset(asset);
            });

            this._detailsView.link(assets);

            this._assetListEvents.push(this._assets.on('add', (asset, _, index) => {
                this._addAsset(asset, index, true);
            }));
            this._assetListEvents.push(this._assets.on('remove', asset => {
                this._removeAsset(asset);
            }));
            this._assetListEvents.push(this._assets.on('move', (asset, index) => {
                this._moveAsset(asset, index);
            }));

            this.filter();
        }

        get currentFolder() {
            return this._currentFolder;
        }

        set currentFolder(value) {
            // legacy
            if (value === 'scripts') {
                value = LEGACY_SCRIPTS_FOLDER_ASSET;
            }

            if (this._currentFolder === value) return;

            let id;
            if (this._currentFolder) {
                id = this._currentFolder.get('id');
                if (this._foldersIndex[id] && !this._foldersIndex[id].destroyed) {
                    this._foldersIndex[id].classRemove(CLASS_CURRENT_FOLDER);
                }
            } else {
                this._foldersViewRoot.classRemove(CLASS_CURRENT_FOLDER);
            }

            this._currentFolder = value;

            const focused = document.activeElement;

            if (this._currentFolder) {
                this._btnBack.enabled = true;
                id = this._currentFolder.get('id');
                if (this._foldersIndex[id]) {
                    this._foldersIndex[id].class.add(CLASS_CURRENT_FOLDER);
                    this._foldersIndex[id].parentsOpen = true;

                    // focus folder in order to scroll it into view
                    this._foldersIndex[id].focus();
                }

            } else {
                this._btnBack.enabled = false;
                this._foldersViewRoot.class.add(CLASS_CURRENT_FOLDER);
                this._foldersViewRoot.focus();
            }

            // restore focus
            if (focused) {
                focused.focus();
            }

            if (!this._suspendFiltering) {
                this.filter();
            }

            this.emit('currentFolder', value);
        }

        get dropManager() {
            return this._dropManager;
        }

        set dropManager(value) {
            if (this._dropManager === value) return;

            if (this._foldersDropTarget) {
                this._foldersDropTarget.destroy();
                this._foldersDropTarget = null;
            }

            if (this._tableDropTarget) {
                this._tableDropTarget.destroy();
                this._tableDropTarget = null;
            }

            if (this._gridViewDropTarget) {
                this._gridViewDropTarget.destroy();
                this._gridViewDropTarget = null;
            }

            this._eventsDropManager.forEach(e => e.unbind());
            this._eventsDropManager.length = 0;

            this._dropManager = value;

            if (this._dropManager) {
                this._eventsDropManager.push(this._dropManager.on('deactivate', this._onDeactivateDropManager.bind(this)));

                this._foldersDropTarget = this._createAssetDropTarget(this._containerFolders);
                this._tableDropTarget = this._createAssetDropTarget(this._detailsView);
                this._gridViewDropTarget = this._createAssetDropTarget(this._gridView);
            }
        }

        get detailsView() {
            return this._detailsView;
        }

        get foldersView() {
            return this._containerFolders;
        }

        get gridView() {
            return this._gridView;
        }

        get viewMode() {
            return this._viewMode;
        }

        set viewMode(value) {
            if (this._viewMode === value) return;

            this._viewMode = value;

            this._refreshViewModeButtons();

            if (this._progressBar.value < 100) {
                this._containerProgress.hidden = false;
                this._detailsView.hidden = true;
                this._gridView.hidden = true;
            } else {
                this.filter();

                if (value === AssetPanel.VIEW_SMALL_GRID) {
                    if (!this._gridView.class.contains(CLASS_GRID_SMALL)) {
                        this._gridView.classAdd(CLASS_GRID_SMALL);
                    }
                } else {
                    if (this._gridView.class.contains(CLASS_GRID_SMALL)) {
                        this._gridView.classRemove(CLASS_GRID_SMALL);
                    }
                }
            }

            this.emit('viewMode', value);
        }

        get activeView() {
            return this.viewMode === AssetPanel.VIEW_DETAILS ? this.detailsView : this.gridView;
        }

        get progressBar() {
            return this._progressBar;
        }

        get dropdownType() {
            return this._dropdownType;
        }

        get searchInput() {
            return this._searchInput;
        }

        get selectedAssets() {
            return this._selectedAssets.slice();
        }

        set selectedAssets(value) {
            if (!value) value = [];

            this._btnDelete.enabled = this.writePermissions && value.length;

            const selectedIndex = {};

            // build index of selected assets
            value.forEach(asset => {
                selectedIndex[asset.get('id')] = true;
            });

            // deselect selected assets except the ones in the index
            const selected = this._selectedAssets;
            let i = selected.length;
            while (i--) {
                if (selectedIndex[selected[i].get('id')]) continue;
                this._setAssetSelected(selected[i], false);
            }

            this._selectedAssets = value.slice();

            if (value.length) {
                // disable focusing for table because of performance issues
                // when there are many rows
                this._detailsView.allowRowFocus = false;

                value.forEach(asset => {
                    this._setAssetSelected(asset, true);
                });

                // restore table focus and focus last selected row
                this._detailsView.allowRowFocus = true;
                const lastRow = this._rowsIndex[value[value.length - 1].get('id')];
                if (lastRow && lastRow.selected) {
                    lastRow.focus();
                }

            }
        }

        get visibleAssets() {
            const result = [];

            const dict = (this._viewMode === AssetPanel.VIEW_DETAILS ? this._rowsIndex : this._gridIndex);
            for (const key in dict) {
                const item = dict[key];
                if (!item.hidden) {
                    result.push(item.asset.legacyScript || item.asset);
                }
            }

            return result;
        }

        get showSourceAssets() {
            return this._showSourceAssets;
        }

        set showSourceAssets(value) {
            if (this._showSourceAssets === value) {
                return;
            }

            this._showSourceAssets = value;

            if (!this._suspendFiltering) {
                this.filter();
            }
        }

        get suspendSelectionEvents() {
            return this._suspendSelectEvents;
        }

        set suspendSelectionEvents(value) {
            this._suspendSelectEvents = value;
        }

        get suspendFiltering() {
            return this._suspendFiltering;
        }

        set suspendFiltering(value) {
            this._suspendFiltering = value;
        }

        get writePermissions() {
            return this._writePermissions;
        }

        set writePermissions(value) {
            if (this._writePermissions === value) return;

            this._writePermissions = value;

            if (!value) {
                this._btnNew.enabled = false;
                this._btnDelete.enabled = false;
                this._foldersView.allowDrag = false;
            } else {
                this._btnNew.enabled = true;
                this._btnDelete.enabled = !!this._selectedAssets.length;
                this._foldersView.allowDrag = true;
            }
        }
    }

    AssetPanel.VIEW_LARGE_GRID = 'lgrid';
    AssetPanel.VIEW_SMALL_GRID = 'sgrid';
    AssetPanel.VIEW_DETAILS = 'details';
    AssetPanel.LEGACY_SCRIPTS_ID = LEGACY_SCRIPTS_ID;

    return {
        AssetPanel: AssetPanel
    };
})());
