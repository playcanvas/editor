Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'settings-loading-screen';
    const CLASS_FEATURE_LOCKED = CLASS_ROOT + '-feature-locked';

    const ATTRIBUTES = [
        {
            observer: 'projectSettings',
            label: 'Script',
            type: 'asset',
            alias: 'loadingScreenScript'
        }
    ];

    const DOM = () => [
        {
            root: {
                buttonContainer: new pcui.Container({
                    flex: true,
                    flexDirection: 'row'
                })
            },
            children: [
                {
                    createDefaultButton: new pcui.Button({
                        text: 'CREATE DEFAULT',
                        icon: 'E120',
                        flexGrow: 1
                    })
                },
                {
                    selectExistingButton: new pcui.Button({
                        text: 'SELECT EXISTING',
                        icon: 'E184',
                        flexGrow: 1
                    })
                }
            ]
        },
        {
            featureLockedLabel: new pcui.Label({
                text: `This is an ORGANIZATION account feature. <a href="/upgrade?plan=organization&account=${config.owner.username}" target="_blank">UPGRADE</a> to create custom loading screens.`,
                unsafe: true,
                class: CLASS_FEATURE_LOCKED
            })
        }
    ];

    class LoadingscreenSettingsPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'LOADING SCREEN';
            args.attributes = ATTRIBUTES;

            super(args);

            this.buildDom(DOM());

            const selectExistingEvt = this._selectExistingButton.on('click', this._clickSelectExisting.bind(this));
            const createDefaultEvt = this._createDefaultButton.on('click', this._clickCreateDefault.bind(this));
            const updateAssetEvt = this._attributesInspector.getField('loadingScreenScript').on('change', value => {
                if (this._projectSettings) {
                    this._projectSettings.set('loadingScreenScript', value ? value.toString() : null);
                }
            });


            this._selectExistingTooltip = Tooltip.attach({
                target: this._selectExistingButton.element,
                text: 'Select an existing loading screen script',
                align: 'bottom',
                root: editor.call('layout.root')
            });

            this._createDefaultTooltip = Tooltip.attach({
                target: this._createDefaultButton.element,
                text: 'Create a default loading script',
                align: 'bottom',
                root: editor.call('layout.root')
            });

            this.once('destroy', () => {
                selectExistingEvt.unbind();
                createDefaultEvt.unbind();
                updateAssetEvt.unbind();
                this._selectExistingTooltip.destroy();
                this._createDefaultTooltip.destroy();
            });
        }

        _loadLayout() {
            if (!editor.call("users:isSuperUser") && config.owner.plan.type !== 'org' && config.owner.plan.type !== 'organization') {
                this._featureLockedLabel.hidden = false;
                this._attributesInspector.destroy();
                this._buttonContainer.destroy();
                return;
            }

            this._featureLockedLabel.hidden = true;

            const scriptId = this._projectSettings.get('loadingScreenScript');
            const asset = this._args.assets.get(scriptId);
            if (scriptId && asset) {
                this._attributesInspector.getField('loadingScreenScript').hidden = false;
                this._buttonContainer.hidden = true;
                this._attributesInspector.getField('loadingScreenScript').value = parseInt(scriptId, 10);
            } else {
                this._attributesInspector.getField('loadingScreenScript').hidden = true;
                this._buttonContainer.hidden = false;
            }
        }

        _setLoadingScreen(asset) {
            const id = asset && asset.get ? asset.get('id') : null;
            if (id) {
                this._projectSettings.set('loadingScreenScript', id.toString());
            }
        }

        _clickSelectExisting() {
            let evtPick = editor.once("picker:asset", (asset) => {
                this._setLoadingScreen(asset);
                evtPick = null;
            });
            // show asset picker
            editor.call("picker:asset", { type: "script" });
            editor.once('picker:asset:close', () => {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        }

        _clickCreateDefault() {
            editor.call('picker:script-create', (filename) => {
                editor.call('assets:create:script', {
                    filename,
                    content: editor.call('sourcefiles:loadingScreen:skeleton'),
                    callback: (_, asset) => {
                        this._setLoadingScreen(asset);
                    }
                });
            });
        }

        link(observers) {
            super.link(observers);
            this._loadLayout();
            this._projectSettings.on('*:set', path => {
                if (path === 'loadingScreenScript') {
                    this._loadLayout();
                }
            });
        }

        unlink() {
            // always stay linked to the same settings attribute
        }
    }

    return {
        LoadingscreenSettingsPanel: LoadingscreenSettingsPanel
    };
})());
