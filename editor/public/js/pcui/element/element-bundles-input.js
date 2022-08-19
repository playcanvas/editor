Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-bundles-input';

    class BundlesInput extends pcui.SelectInput {
        constructor(args) {
            if (!args) args = {};

            args.options = [];
            args.type = 'number';
            args.multiSelect = true;

            super(args);

            this.class.add(CLASS_ROOT);

            this._assets = [];

            this._updateOptions();
        }

        _updateOptions() {
            let options = editor.call('assets:bundles:list');
            options = options.map((bundle) => {
                return { v: bundle.get('id'), t: bundle.get('name') };
            });
            this.options = options;
        }

        _addTag(bundleId) {
            super._addTag(bundleId);
            var bundleAsset = editor.call('assets:get', bundleId);
            if (bundleAsset && this._assets.length > 0) {
                editor.call('assets:bundles:addAssets', this._assets, bundleAsset);
            }
        }

        _removeTag(tagElement, bundleId) {
            super._removeTag(tagElement, bundleId);
            var bundleAsset = editor.call('assets:get', bundleId);
            if (bundleAsset && this._assets.length > 0) {
                editor.call('assets:bundles:removeAssets', this._assets, bundleAsset);
            }
        }

        link(observers, paths) {
            // order is important here
            // we have to update the options first
            // and then link because updating options
            // hides tags
            this._updateOptions();
            super.link(observers, paths);

            this._assets = observers.filter((observer) => {
                return observer._type === 'asset';
            });

            const selectedBundles = [];
            this._containerTags.dom.childNodes.forEach((dom) => {
                selectedBundles.push(dom.ui.value);
            });

            this._assets.forEach((asset) => {
                const assetBundles = editor.call('assets:bundles:listForAsset', asset);
                assetBundles.forEach((assetBundle) => {
                    if (!selectedBundles.includes(assetBundle.get('id'))) {
                        this._addTag(assetBundle.get('id'));
                    }
                });
            });
            this._containerTags.dom.childNodes.forEach((dom) => {
                const assetBundles = editor.call('assets:bundles:listForAsset', this._assets[0]).map((asset) => {
                    return asset.get('id');
                });
                if (!assetBundles.includes(dom.ui.value)) {
                    this._removeTag(dom.ui, dom.ui.value);
                }
            });
        }

        unlink() {
            super.unlink();
            this._assets = [];
        }
    }

    pcui.Element.register('bundles', BundlesInput, { renderChanges: true });

    return {
        BundlesInput: BundlesInput
    };
})());
