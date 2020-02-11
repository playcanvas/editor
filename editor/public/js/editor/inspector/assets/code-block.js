Object.assign(pcui, (function () {
    'use strict';

    const DOM = (parent) => [
        {
            root: {
                panel: new pcui.Panel({
                    headerText: parent._assetType.toUpperCase()
                })
            },
            children: [
                {
                    code: new pcui.Code()
                },
                {
                    root: {
                        errorLoadingDataContainer: new pcui.Container({
                            flex: true,
                            flexDirection: 'column',
                            alignItems: 'center'
                        })
                    },
                    children: [
                        {
                            errorLoadingDataLabel: new pcui.Label({
                                text: 'failed loading data'
                            })
                        }
                    ]
                },
                {
                    progress: new pcui.Progress({ width: '100%' })
                }
            ]
        }
    ];

    class CodeBlockAssetInspector extends pcui.Container {
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
            editor.call('attributes:reference:attach', `asset:${this._assetType}:asset`, this._panel, this._panel.header.dom);
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
                if (! this._loading) {
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

    return {
        CodeBlockAssetInspector: CodeBlockAssetInspector
    };
})());
