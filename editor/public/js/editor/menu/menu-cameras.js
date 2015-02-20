editor.once('load', function() {
    'use strict';

    var header = editor.call('layout.header');

    var combo = new ui.SelectField({
        options: {
            0: 'Perspective',
            1: 'Top',
            2: 'Bottom',
            3: 'Front',
            4: 'Back',
            5: 'Left',
            6: 'Right'
        },
        number: true
    });

    combo.value = 0;

    combo.style.float = 'right';
    combo.style['margin-top'] = '12px';

    header.append(combo);

    combo.on('change', function (value) {
        var framework = editor.call('viewport:framework') ;
        if (framework) {
            framework.setActiveCamera(value);
        }
    });

});
