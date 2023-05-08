import { Panel, Code, Container, Label, Progress } from '@playcanvas/pcui';
import { Ajax } from '../../../common/ajax.js';
import { TooltipReference } from '../tooltip-reference.js';

const DOM = parent => [
    {
        root: {
            panel: new Panel({
                headerText: parent._assetType.toUpperCase()
            })
        },
        children: [
            {
                code: new Code()
            },
            {
                root: {
                    errorLoadingDataContainer: new Container({
                        flex: true,
                        flexDirection: 'column',
                        alignItems: 'center'
                    })
                },
                children: [
                    {
                        errorLoadingDataLabel: new Label({
                            text: 'failed loading data'
                        })
                    }
                ]
            },
            {
                progress: new Progress({ width: '100%' })
            }
        ]
    }
];

class CodeBlockAssetInspector extends Container {
    constructor(args) {
        args = Object.assign({}, args);

        super(args);

        this._assetType = args.assetType;
        this._dataFormatter = args.dataFormatter;
        this._assets = null;
        this._loading = false;

        this.buildDom(DOM(this));

        // child element adjustments
        this._errorLoadingDataContainer.hidden = true;
        this._errorLoadingDataLabel.class.add(pcui.CLASS_ERROR);

        // reference
        const ref = editor.call('attributes:reference:get', `asset:${this._assetType}:asset`);
        if (ref) {
            (new TooltipReference({
                reference: ref
            })).attach({
                target: this._panel.header
            });
        }

        this._progress.value = 100;
    }

    _loadData() {
        if (this._assets.length !== 1 || this._loading)
            return;
        if (this._assets[0].get('file.size') > 128 * 1024) {
            return;
        }

        this._progress.hidden = false;
        this._progress.value = 100;
        this._loading = true;

        const fileUrl = this._assets[0].get('file.url');
        const fileHash = this._assets[0].get('file.hash');

        this._request = Ajax({
            url: '{{url.home}}' + fileUrl.appendQuery('t=' + fileHash),
            notJson: this._assetType !== 'json'
        })
        .on('load', (status, data) => {
            this._loading = false;
            if (this._dataFormatter) {
                this._code.text = this._dataFormatter(data);
            } else {
                this._code.text = data;
            }
            this._progress.hidden = true;
        })
        .on('error', () => {
            this._loading = false;
            this._errorLoadingDataContainer.hidden = false;
            this._progress.hidden = true;
        });
    }

    link(assets) {
        this.unlink();
        this._assets = assets;
        if (assets[0].has('file.url')) {
            if (!this._loading) {
                this._loadData();
            }
        }
        this._panel.hidden = assets.length > 1;
    }

    unlink() {
        if (!this._assets) return;
        this._assets = null;
        if (this._request) {
            this._request.owner.abort();
            this._request = null;
        }
        this._code.text = '';
    }
}

export { CodeBlockAssetInspector };
