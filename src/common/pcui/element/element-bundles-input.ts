import type { Observer } from '@playcanvas/observer';
import { Container, Element, SelectInput, SelectInputArgs } from '@playcanvas/pcui';

const CLASS_ROOT = 'pcui-bundles-input';

/**
 * A select input for managing asset bundles.
 */
class BundlesInput extends SelectInput {
    private _assets: Observer[];

    constructor(args: SelectInputArgs = {}) {
        const selectArgs: SelectInputArgs = {
            ...args,
            options: [],
            type: 'number',
            multiSelect: true
        };

        super(selectArgs);

        this.class.add(CLASS_ROOT);

        this._assets = [];

        this._updateOptions();
    }

    protected _updateOptions() {
        let options = editor.call('assets:bundles:list');
        options = options.map((bundle: Observer) => {
            return { v: bundle.get('id'), t: bundle.get('name') };
        });
        this.options = options;
    }

    protected _addTag(bundleId: unknown): Container {
        const container = super._addTag(bundleId);
        const bundleAsset = editor.call('assets:get', bundleId);
        if (bundleAsset && this._assets.length > 0) {
            editor.call('assets:bundles:addAssets', this._assets, bundleAsset);
        }
        return container;
    }

    protected _removeTag(tagElement: Container, bundleId: unknown) {
        super._removeTag(tagElement, bundleId);
        const bundleAsset = editor.call('assets:get', bundleId);
        if (bundleAsset && this._assets.length > 0) {
            editor.call('assets:bundles:removeAssets', this._assets, bundleAsset);
        }
    }

    link(observers: Observer | Observer[], paths: string | string[]) {
        // order is important here
        // we have to update the options first
        // and then link because updating options
        // hides tags
        this._updateOptions();
        super.link(observers, paths);

        const observerArray = Array.isArray(observers) ? observers : [observers];
        this._assets = observerArray.filter((observer: Observer & { _type?: string }) => {
            return observer._type === 'asset';
        });

        const selectedBundles: unknown[] = [];
        this._containerTags.dom.childNodes.forEach((dom: ChildNode) => {
            selectedBundles.push((dom as any).ui.value);
        });

        this._assets.forEach((asset: Observer) => {
            const assetBundles = editor.call('assets:bundles:listForAsset', asset);
            assetBundles.forEach((assetBundle: Observer) => {
                if (!selectedBundles.includes(assetBundle.get('id'))) {
                    this._addTag(assetBundle.get('id'));
                }
            });
        });
        this._containerTags.dom.childNodes.forEach((dom: ChildNode) => {
            const assetBundles = editor.call('assets:bundles:listForAsset', this._assets[0]).map((asset: Observer) => {
                return asset.get('id');
            });
            if (!assetBundles.includes((dom as any).ui.value)) {
                this._removeTag((dom as any).ui, (dom as any).ui.value);
            }
        });
    }

    unlink() {
        super.unlink();
        this._assets = [];
    }
}

Element.register('bundles', BundlesInput, { renderChanges: true });

export { BundlesInput };
