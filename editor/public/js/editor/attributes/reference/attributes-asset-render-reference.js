editor.once('load', function () {
    'use strict';

    var fields = [{
        title: 'renderIndex',
        subTitle: '{Number}',
        description: 'The index of the Render Asset inside its Container Asset.'
    }, {
        title: 'containerAsset',
        subTitle: '{pc.Asset}',
        description: 'The Container Asset that this render asset is part of'
    }];

    for (var i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:render:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
