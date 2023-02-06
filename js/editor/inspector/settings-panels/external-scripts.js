Object.assign(pcui, (function () {
    const ATTRIBUTES = [
        {
            observer: 'projectSettings',
            label: 'URLs',
            type: 'array:select',
            path: 'externalScripts',
            alias: 'project.externalScripts',
            args: {
                type: 'string',
                elementArgs: {
                    placeholder: 'URL'
                }
            }
        }
    ];

    class ExternalscriptsSettingsPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'EXTERNAL SCRIPTS';
            args.attributes = ATTRIBUTES;
            args.splitReferencePath = false;
            args._tooltipReference = 'settings:external-scripts';

            super(args);
        }
    }

    return {
        ExternalscriptsSettingsPanel: ExternalscriptsSettingsPanel
    };
})());
