editor.once('load', function() {
    'use strict';

    if (!config.self.superUser && !config.self.publishFacebook)
        return;

    var foldStates = {
        'facebook': true
    };

    var settings = editor.call('project:privateSettings');

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
        panel.disabled = !editor.call('permissions:write');
        panel.hidden = !editor.call('permissions:read');
        panel.class.add('component', 'facebook');

        // reference
        editor.call('attributes:reference:attach', 'settings:facebook', panel, panel.headerElement);

        var fieldFbAppId = editor.call('attributes:addField', {
            parent: panel,
            name: 'App ID',
            type: 'string',
            link: settings,
            path: 'facebook.app_id'
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
            path: 'facebook.upload_token'
        });
        tooltip = editor.call('attributes:reference:attach', 'settings:facebook:upload-token', fieldFbUploadToken.parent.innerElement.firstChild.ui);

        var tokenParagraph = tooltip.innerElement.querySelector('p');
        if (! originalTokenHelp)
            originalTokenHelp = tokenParagraph.innerHTML;

        var getTokenText = function () {
            return originalTokenHelp + ' You can find this under the ' + (settings.get('facebook.app_id') ? '<a href="https://developers.facebook.com/apps/' + settings.get('facebook.app_id') + '/hosting/" target="_blank">Canvas Hosting Page</a>' : 'Canvas Hosting page') + ' at the dashboard of your Facebook application.';
        };

        tokenParagraph.innerHTML = getTokenText();

        var evtAppId = settings.on('facebook.app_id:set', function (value) {
            tokenParagraph.innerHTML = getTokenText();
        });

        var evtPermissions = editor.on('permissions:set:' + config.self.id, function (accesslevel) {
            panel.hidden = accesslevel !== 'admin' && accesslevel !== 'write';
        });

        panel.on('destroy', function () {
            evtPermissions.unbind();
            evtAppId.unbind();
        });
    });
});
