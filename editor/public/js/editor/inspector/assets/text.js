Object.assign(pcui, (function () {
    'use strict';

    const DOM = [
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
        }
    ];

    class TextAssetInspector extends pcui.Panel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'TEXT';

            super(args);

            this._assets = null;
            this._loading = false;

            this.buildDom(DOM);

            // child element adjustments
            this._errorLoadingDataContainer.hidden = true;
            this._errorLoadingDataLabel.class.add(pcui.CLASS_ERROR);
            editor.call('attributes:reference:attach', 'asset:text:asset', this, this.header.dom);
        }

        _loadData() {
            if (this._assets.length !== 1 || this._loading)
                return;

            this._loading = true;

            const fileUrl = this._assets[0].get('file.url');
            const fileHash = this._assets[0].get('file.hash');

            this._request = Ajax({
                url: '{{url.home}}' + fileUrl.appendQuery('t=' + fileHash),
                notJson: true
            })
            .on('load', (status, data) => {
                this._loading = false;
                this._code.text = data;
            })
            .on('error', () => {
                this._loading = false;
                this._errorLoadingDataContainer.hidden = false;
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
        }

        unlink() {
            if (!this._assets) return;
            this._assets = null;
            if (this._request) {
                this._request.owner.abort();
                this._request = null;
            }
        }
    }

    return {
        TextAssetInspector: TextAssetInspector
    };
})());
