editor.once('load', function() {
    'use strict';

    if (!config.self.superUser && !config.self.publishFacebook)
        return;

    var foldStates = {
        'facebook': true
    };

    var settings = editor.call('settings:projectPrivate');

    var originalTokenHelp;
    var originalAppIdHelp;

    editor.on('attributes:inspect[editorSettings]', function() {

        var panel = editor.call('attributes:addPanel', {
            name: 'Facebook'
        });
        panel.foldable = true;
        panel.folded = foldStates['facebook'];
        panel.on('fold', function() { foldStates['facebook'] = true; });
        panel.on('unfold', function() { foldStates['facebook'] = false; });
        panel.hidden = !editor.call('permissions:write');
        panel.class.add('component', 'facebook');

        // reference
        editor.call('attributes:reference:attach', 'settings:facebook', panel, panel.headerElement);

        var fieldFbAppId = editor.call('attributes:addField', {
            parent: panel,
            name: 'App ID',
            type: 'string',
            link: settings,
            path: 'facebook.appId'
        });
        var tooltip = editor.call('attributes:reference:attach', 'settings:facebook:app-id', fieldFbAppId.parent.innerElement.firstChild.ui);
        var appIdParagraph = tooltip.innerElement.querySelector('p')
        if (! originalAppIdHelp)
            originalAppIdHelp = appIdParagraph.innerHTML;

        appIdParagraph.innerHTML = originalAppIdHelp + ' Click <a href="https://developers.facebook.com/apps/" target="_blank">here</a> to see all your Facebook applications.';

        var fieldFbUploadToken = editor.call('attributes:addField', {
            parent: panel,
            name: 'Upload Token',
            type: 'string',
            link: settings,
            path: 'facebook.uploadToken'
        });
        tooltip = editor.call('attributes:reference:attach', 'settings:facebook:upload-token', fieldFbUploadToken.parent.innerElement.firstChild.ui);

        var fieldSdk = editor.call('attributes:addField', {
            parent: panel,
            name: 'SDK Version',
            type: 'string'
        });

        fieldSdk.value = settings.get('facebook.sdkVersion');
        fieldSdk.class.add('facebook-version');
        fieldSdk.renderChanges = false;

        // ref
        editor.call('attributes:reference:attach', 'settings:facebook:sdk-version', fieldSdk.parent.innerElement.firstChild.ui);

        // version should be in this form: 1.0 or 1.0.4 etc.
        var versionRegex = /^[0-9]+(\.[0-9]+)+$/;

        var changingVersion = false;

        // check if version exists and if so set it
        var setVersion = function (version) {
            if (versions.indexOf(version) === -1) {
                (new AjaxRequest({
                    method: 'GET',
                    url: '/editor/facebook/version/' + version,
                    notJson: true
                }))
                .on('load', function () {
                    settings.set('facebook.sdkVersion', version);
                })
                .on('error', function () {
                    fieldSdk.class.add('error');
                });
            } else {
                settings.set('facebook.sdkVersion', version);
            }
        };

        fieldSdk.on('change', function (value) {
            if (! value) {
                fieldSdk.value = settings.get('facebook.sdkVersion') || config.facebook.version;
            } else if (! versionRegex.test(value)) {
                fieldSdk.class.add('error');
            } else {
                fieldSdk.class.remove('error');

                if (! changingVersion) {
                    setVersion(value);
                }
            }

            if (! changingVersion)
                list.hidden = true;
        });

        settings.on('facebook.sdkVersion:set', function (value) {
            changingVersion = true;
            fieldSdk.value = value;
            changingVersion = false;

            fieldSdk.class.remove('error');
        });

        fieldSdk.elementInput.addEventListener('click', function () {
            list.hidden = false;
        });

        fieldSdk.elementInput.addEventListener('keydown', function (e) {
            // up arrow
            if (e.keyCode === 38) {
                e.preventDefault();
                e.stopPropagation();

                listItems[focused].class.remove('focused');

                focused--;
                if (focused < 0)
                    focused = listItems.length - 1;

                listItems[focused].class.add('focused');

                changingVersion = true;
                fieldSdk.value = versions[focused];
                changingVersion = false;
            }
            // down arrow
            else if (e.keyCode === 40) {
                e.preventDefault();
                e.stopPropagation();

                listItems[focused].class.remove('focused');

                focused++;
                if (focused >= listItems.length)
                    focused = 0;

                listItems[focused].class.add('focused');

                changingVersion = true;
                fieldSdk.value = versions[focused];
                changingVersion = false;
            }
            // enter
            else if (e.keyCode === 13) {
                var val = fieldSdk.value;
                var focusedVal = versions[focused];
                // if we have the same value as the field
                // then call setVersion otherwise it will be handled
                // by the 'change' event of the field
                if (val === focusedVal) {
                    setVersion(focusedVal);
                    list.hidden = true;
                }
            }
            // esc
            else if (e.keyCode === 27) {
                fieldSdk.value = settings.get('facebook.sdkVersion');
                list.hidden = true;
            }
        });

        var list = new ui.List();
        list.class.add('facebook-versions');
        list.hidden = true;
        fieldSdk.element.appendChild(list.element);

        var versions = ['1.0', '2.0', '2.1'];
        var listItems = [];
        var focused = 0;

        var hideList = function (e) {
            var el = e.target;
            var found = false;
            while (el) {
                if (el === fieldSdk.element) {
                    found = true;
                    break;
                }

                el = el.parentElement;
            }

            if (! found) {
                list.hidden = true;
                fieldSdk.value = settings.get('facebook.sdkVersion');
            }
        };

        list.on('show', function () {
            window.addEventListener('mousedown', hideList);

            listItems.forEach(function (item, index) {
                if (versions[index] === fieldSdk.value) {
                    focused = index;
                    item.class.add('focused');
                } else {
                    item.class.remove('focused');
                }
            });
        });
        list.on('hide', function () {
            window.removeEventListener('mousedown', hideList);
        });

        var createListItem = function (version) {
            var item = new ui.ListItem({
                text: version
            });
            list.append(item);

            item.on('click', function () {
                fieldSdk.value = version;
                list.hidden = true;
            });

            listItems.push(item);
        };

        versions.forEach(createListItem);

        var tokenParagraph = tooltip.innerElement.querySelector('p');
        if (! originalTokenHelp)
            originalTokenHelp = tokenParagraph.innerHTML;

        var getTokenText = function () {
            return originalTokenHelp + ' You can find this under the ' + (settings.get('facebook.appId') ? '<a href="https://developers.facebook.com/apps/' + settings.get('facebook.appId') + '/hosting/" target="_blank">Canvas Hosting Page</a>' : 'Canvas Hosting page') + ' at the dashboard of your Facebook application.';
        };

        tokenParagraph.innerHTML = getTokenText();

        var evtAppId = settings.on('facebook.appId:set', function (value) {
            tokenParagraph.innerHTML = getTokenText();
        });

        var evtPermissions = editor.on('permissions:set:' + config.self.id, function (accesslevel) {
            panel.hidden = !editor.call('permissions:write');
        });

        panel.on('destroy', function () {
            evtPermissions.unbind();
            evtAppId.unbind();
        });
    });
});
