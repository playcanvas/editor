import type { EventHandle, Observer, ObserverList } from '@playcanvas/observer';
import { Button, Container, type ContainerArgs } from '@playcanvas/pcui';
import type { Application } from 'playcanvas';

import { tooltip, tooltipSimpleItem } from '@/common/tooltips';
import type { History } from '@/editor-api';

import { AnimStateGraphAnimComponent } from '../../animstategraph/anim-component';
import { AnimViewer } from '../../animstategraph/anim-viewer';
import { AnimStateGraphLayers } from '../../animstategraph/layers';
import { AnimStateGraphParameters } from '../../animstategraph/parameters';
import { AnimStateGraphState } from '../../animstategraph/state';
import { AnimStateGraphTransitions } from '../../animstategraph/transitions';
import { AnimStateGraphView } from '../../animstategraph/view';

const CLASS_ANIMSTATEGRAPH = 'asset-animstategraph-inspector';
const CLASS_ANIMSTATEGRAPH_OPEN_BUTTON = `${CLASS_ANIMSTATEGRAPH}-open-button`;
const CLASS_ANIMSTATEGRAPH_CLOSE_BUTTON = `${CLASS_ANIMSTATEGRAPH}-close-button`;
const CLASS_ANIMSTATEGRAPH_CLOSE_BUTTON_TOOLTIP = `${CLASS_ANIMSTATEGRAPH_CLOSE_BUTTON}-tooltip`;

const DOM = parent => [
    {
        layersPanel: new AnimStateGraphLayers(parent, {
            headerText: 'LAYERS',
            collapsible: true
        })
    },
    {
        parametersPanel: new AnimStateGraphParameters({
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

interface AnimStateGraphAssetInspectorArgs extends ContainerArgs {
    assets?: ObserverList;
    history?: History;
    entities?: ObserverList;
    inspectorPanelSecondary?: Container;
}

class AnimStateGraphAssetInspector extends Container {
    _args: AnimStateGraphAssetInspectorArgs;

    _assets: Observer[] | null;

    history: History;

    _view: AnimStateGraphView;

    _animComponentListener: AnimStateGraphAnimComponent;

    _stateContainer: AnimStateGraphState;

    _transitionsContainer: AnimStateGraphTransitions;

    _app: Application;

    _animViewer: AnimViewer;

    _openEditorButton: Button;

    _layersPanel: AnimStateGraphLayers;

    _parametersPanel: AnimStateGraphParameters;

    _assetEvents: EventHandle[];

    _closeButton: Button | undefined;

    _selectedLayer: number;

    _openWithLayer: number | undefined;

    _openInFullscreen: boolean;

    _inspectorPanelSecondary: Container;

    constructor(args: AnimStateGraphAssetInspectorArgs) {
        args = Object.assign({
            class: CLASS_ANIMSTATEGRAPH
        }, args);
        super(args);
        this._args = args;
        this._assets = null;
        this._inspectorPanelSecondary = args.inspectorPanelSecondary;
        this.readOnly = !editor.call('permissions:write');
        this.history = args.history;
        this._view = new AnimStateGraphView(this, args);
        this._animComponentListener = new AnimStateGraphAnimComponent(args, this._view);

        this.buildDom(DOM(this));

        this._stateContainer = new AnimStateGraphState(args, this._view);
        this._inspectorPanelSecondary.append(this._stateContainer);
        this._transitionsContainer = new AnimStateGraphTransitions(args, this._view);
        this._inspectorPanelSecondary.append(this._transitionsContainer);
        setTimeout(() => {
            this._app = editor.call('viewport:app');
            this._animViewer = new AnimViewer({
                app: this._app,
                class: 'animstategraph-view-anim-viewer'
            });
            this._inspectorPanelSecondary.prepend(this._animViewer);
            this._inspectorPanelSecondary.on('resize', () => {
                (this._animViewer as any)._canvas.width = this._inspectorPanelSecondary.dom.offsetWidth - 1;
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

    selectAnimStateGraph(asset: Observer, selectedItem?: unknown) {
        this._openInFullscreen = true;
        editor.call('selector:history', false);
        editor.call('selector:clear');
        editor.call('selector:add', 'asset', asset);
        editor.once('selector:change', () => {
            editor.call('selector:history', true);
            if (selectedItem) {
                this._view.selectItem(selectedItem);
            }
        });
    }

    deselectAnimStateGraph() {
        this._openInFullscreen = false;
        editor.call('selector:history', false);
        editor.call('selector:clear');
        editor.once('selector:change', () => {
            editor.call('selector:history', true);
        });
    }

    closeAsset(asset: Observer) {
        const layer = (this._view as any)._selectedLayer;
        const selectedItem = this._view.selectedItem;
        const redo = () => {
            this.deselectAnimStateGraph();
        };
        const undo = () => {
            if (layer) {
                this._openWithLayer = layer;
            }
            this.selectAnimStateGraph(asset, selectedItem);
        };
        this.history.add({
            redo,
            undo,
            name: 'close editor'
        });
        redo();
    }

    openAsset(asset: Observer) {
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
        if (this._assets.length > 1) {
            return;
        }

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
        const item = tooltipSimpleItem({
            text: 'Close the Graph Editor and return to the Asset Inspector',
            classNames: [CLASS_ANIMSTATEGRAPH_CLOSE_BUTTON_TOOLTIP]
        });
        tooltip().attach({
            container: item,
            target: this._closeButton,
            align: 'bottom'
        });
        this._closeButton.on('click', () => {
            this.closeAsset(this._assets[0]);
            item.destroy();
        });
        document.getElementById('layout-viewport').prepend(this._closeButton.dom);
    }


    closeFullscreenMode() {
        if (!this._closeButton) {
            return;
        }

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
        document.getElementById('layout-viewport').removeChild(this._closeButton.dom);
        delete this._closeButton;
    }

    link(assets: Observer[]) {
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

export { AnimStateGraphAssetInspector };
