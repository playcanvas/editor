import { Button, Container } from '@playcanvas/pcui';

Object.assign(pcui, (function () {
    const CLASS_ANIMSTATEGRAPH = 'asset-animstategraph-inspector';
    const CLASS_ANIMSTATEGRAPH_OPEN_BUTTON = CLASS_ANIMSTATEGRAPH + '-open-button';
    const CLASS_ANIMSTATEGRAPH_CLOSE_BUTTON = CLASS_ANIMSTATEGRAPH + '-close-button';
    const CLASS_ANIMSTATEGRAPH_CLOSE_BUTTON_TOOLTIP = CLASS_ANIMSTATEGRAPH_CLOSE_BUTTON + '-tooltip';

    const DOM = parent => [
        {
            layersPanel: new pcui.AnimstategraphLayers(parent, {
                headerText: 'LAYERS',
                collapsible: true
            })
        },
        {
            parametersPanel: new pcui.AnimstategraphParameters({
                headerText: 'PARAMETERS',
                collapsible: true,
                history: parent.history
            })
        },
        {
            openEditorButton: new Button({
                text: 'OPEN GRAPH EDITOR',
                icon: 'E412',
                class: CLASS_ANIMSTATEGRAPH_OPEN_BUTTON
            })
        }
    ];

    class AnimstategraphAssetInspector extends Container {
        constructor(args) {
            args = Object.assign({
                class: CLASS_ANIMSTATEGRAPH
            }, args);
            super(args);
            this._args = args;
            this._assets = null;
            this.readOnly = !editor.call('permissions:write');
            this.history = args.history;
            this._view = new pcui.AnimstategraphView(this, args);
            this._animComponentListener = new pcui.AnimstategraphAnimComponent(args, this._view);

            this.buildDom(DOM(this));

            this._stateContainer = new pcui.AnimstategraphState(args, this._view);
            args.inspectorPanelSecondary.append(this._stateContainer);
            this._transitionsContainer = new pcui.AnimstategraphTransitions(args, this._view);
            args.inspectorPanelSecondary.append(this._transitionsContainer);
            setTimeout(() => {
                this._app = editor.call('viewport:app');
                this._animViewer = new pcui.AnimViewer({
                    app: this._app,
                    class: 'animstategraph-view-anim-viewer'
                });
                args.inspectorPanelSecondary.prepend(this._animViewer);
                args.inspectorPanelSecondary.on('resize', () => {
                    this._animViewer._canvas.width = args.inspectorPanelSecondary.dom.offsetWidth - 1;
                });
            }, 50);
            this._openEditorButton.on('click', () => {
                this.history.add({
                    redo: () => {
                        this.openFullscreenMode();
                    },
                    undo: () => {
                        this.closeFullscreenMode();
                    },
                    name: 'open editor'
                });
                this.openFullscreenMode();
            });

            editor.method('picker:animstategraph', this.openAsset.bind(this));
            editor.method('animstategraph:editor:open', () => this._openEditorButton.hidden);
        }

        selectAnimStateGraph(asset, selectedItem) {
            this._openInFullscreen = true;
            editor.call('selector:history', false);
            editor.call('selector:add', 'asset', asset);
            editor.once('selector:change', () => {
                editor.call('selector:history', true);
                if (selectedItem) this._view.selectItem(selectedItem);
            });
        }

        deselectAnimStateGraph() {
            this._openInFullscreen = false;
            editor.call('selector:history', false);
            editor.call('selector:clear');
            editor.once('selector:change', function () {
                editor.call('selector:history', true);
            });
        }

        closeAsset(asset) {
            const layer = this._view._selectedLayer;
            const selectedItem = this._view.selectedItem;
            const redo = () => {
                this.deselectAnimStateGraph();
            };
            const undo = () => {
                if (layer) this._openWithLayer = layer;
                this.selectAnimStateGraph(asset, selectedItem);
            };
            this.history.add({
                redo,
                undo,
                name: 'close editor'
            });
            redo();
        }

        openAsset(asset) {
            const redo = () => {
                this.selectAnimStateGraph(asset);
            };
            const undo = () => {
                this.deselectAnimStateGraph();
            };
            this.history.add({
                redo,
                undo,
                name: 'open editor'
            });
            redo();
        }

        openFullscreenMode() {
            if (this._assets.length > 1) return;

            this._view.link(this._assets, this._selectedLayer);
            this._layersPanel.link(this._assets);
            this._parametersPanel.link(this._assets);

            this._layersPanel.hidden = false;
            this._parametersPanel.hidden = false;
            this._stateContainer.hidden = true;
            this._openEditorButton.hidden = true;

            this._assetEvents = [];
            this._assetEvents.push(
                this._assets[0].on('data.layers:set', () => {
                    this._layersPanel.link(this._assets);
                })
            );

            this.parent.emit('fullscreenMode:on');

            this._closeButton = new Button({
                text: '',
                icon: 'E389',
                class: CLASS_ANIMSTATEGRAPH_CLOSE_BUTTON
            });
            const closeButtonTooltip = new pcui.Tooltip({
                title: 'Close Graph Editor',
                align: 'bottom',
                showDelay: 0,
                hideDelay: 0
            });
            closeButtonTooltip.dom.classList.add(CLASS_ANIMSTATEGRAPH_CLOSE_BUTTON_TOOLTIP);
            closeButtonTooltip.attach({
                target: this._closeButton
            });
            this._closeButton.on('click', () => {
                this.closeAsset(this._assets[0]);
                closeButtonTooltip.destroy();
            });
            document.getElementById('layout-viewport').prepend(this._closeButton.dom);
        }


        closeFullscreenMode() {
            this._view.unlink();
            this._stateContainer.unlink();
            this._transitionsContainer.unlink();
            this._layersPanel.unlink();
            this._parametersPanel.unlink();

            this._layersPanel.hidden = true;
            this._parametersPanel.hidden = true;
            this._stateContainer.hidden = true;
            this._openEditorButton.hidden = false;

            if (this._assetEvents) {
                this._assetEvents.forEach((evt) => {
                    evt.unbind();
                });
                this._assetEvents = [];
            }

            this.parent.emit('fullscreenMode:off');
            if (this._closeButton) {
                document.getElementById('layout-viewport').removeChild(this._closeButton.dom);
                delete this._closeButton;
            }
        }

        link(assets) {
            this.unlink();
            this._selectedLayer = this._openWithLayer ? this._openWithLayer : 0;
            delete this._openWithLayer;
            this._assets = assets;
            if (this._openInFullscreen) {
                this.openFullscreenMode();
            }
            this._openInFullscreen = false;
            this._animComponentListener.link(assets);
        }

        unlink() {
            if (this._assets) {
                super.unlink();
                this._assets = null;
            }
            this.closeFullscreenMode();
            this._animComponentListener.unlink();
        }
    }

    return {
        AnimstategraphAssetInspector: AnimstategraphAssetInspector
    };
})());
