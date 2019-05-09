editor.once('load', function () {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length > 1) return;
        var asset = assets[0];
        if (asset.get('source')) return;
        if (asset.get('type') !== 'font') return;

        var regexI18n = /^i18n\.[^\.]+?$/;

        var events = [];

        var panel = editor.call('attributes:addPanel', {
            name: "LOCALIZATION"
        });
        panel.class.add('component');
        panel.class.add('localization');

        // reference
        editor.call('attributes:reference:attach', 'asset:localization', panel, panel.headerElement);

        // Add locale
        var fieldAddLocale = editor.call('attributes:addField', {
            parent: panel,
            name: 'Add Locale',
            type: 'string',
            placeholder: 'Type to add (e.g. en-US)'
        });

        fieldAddLocale.class.add('add-locale');

        // validate new locale and add it to the asset
        fieldAddLocale.on('change', function (value) {
            fieldAddLocale.class.remove('error');

            if (!value) {
                return;
            }

            var error = false;

            if (asset.has('i18n.' + value)) {
                error = true;
            } else if (value.length > 10) {
                error = true;
            } else if (! /^[a-zA-Z0-9\-]+$/.test(value)) {
                error = true;
            }

            if (error) {
                fieldAddLocale.class.add('error');
                return;
            }

            asset.set('i18n.' + value, null);

            fieldAddLocale.value = '';
        });

        var panelLocales = new ui.Panel();
        panel.append(panelLocales);

        var localePanelsIndex = {};

        // Creates panel for each locale
        var createLocalePanel = function (locale) {
            localePanelsIndex[locale] = true;

            var panelLocale = new ui.Panel(locale);
            panelLocale.class.add('component');
            panelLocale.class.add('locale');

            // remove locale button
            var btnRemove = new ui.Button({
                text: '&#57650;'
            });
            btnRemove.class.add('remove');
            panelLocale.headerElement.appendChild(btnRemove.element);

            btnRemove.on('click', function () {
                asset.unset('i18n.' + locale);
            });

            // replacement asset
            var fieldAsset = editor.call('attributes:addField', {
                parent: panelLocale,
                name: 'Asset',
                type: 'asset',
                kind: asset.get('type'),
                link: assets,
                path: 'i18n.' + locale
            });

            events.push(asset.once('i18n.' + locale + ':unset', function () {
                panelLocale.destroy();
                panelLocale = null;
                delete localePanelsIndex[locale];
            }));

            return panelLocale;
        };

        // Add locale panel when one is added to the asset
        asset.on('*:set', function (path) {
            if (!regexI18n.test(path)) return;

            var parts = path.split('.');
            var locale = parts[1];

            // if panel for locale already exists then skip this
            if (localePanelsIndex[locale]) return;

            var panelLocale = createLocalePanel(locale);

            var sorted = Object.keys(asset.get('i18n')).sort();
            var idx = sorted.indexOf(locale);
            if (idx !== -1) {
                panelLocales.appendBefore(panelLocale, panelLocales.innerElement.childNodes[idx]);
            }
        });

        // Add existing locales sorted by locale
        Object.keys(asset.get('i18n')).sort().forEach(function (locale) {
            var panelLocale = createLocalePanel(locale);
            panelLocales.append(panelLocale);
        });

        // clear events
        panel.on('destroy', function () {
            for (var i = 0; i < events.length; i++) {
                events[i].unbind();
            }
            events.length = 0;
        });

    });
});
