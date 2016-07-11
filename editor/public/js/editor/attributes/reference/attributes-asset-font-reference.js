editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'asset',
        title: 'FONT',
        subTitle: '{Font}',
        description: 'A Font that can be used to render text using the Text Component.'
    }, {
        name: 'customRange',
        title: 'CUSTOM CHARACTER RANGE',
        description: 'Add a custom range of characters by entering their Unicode codes in the From and To fields. E.g. to add all basic Latin characters you could enter 0x20 - 0x7e and click the + button.'
    }, {
        name: 'presets',
        title: 'CHARACTER PRESETS',
        description: 'Click on a character preset to add it to the selected font'
    }, {
        name: 'characters',
        title: 'CHARACTERS',
        description: 'All the characters that should be included in the runtime font asset. Note that in order for a character to be included in the runtime font, it must be supported by the source font. Click Process Font after you make changes to the characters.'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:font:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
