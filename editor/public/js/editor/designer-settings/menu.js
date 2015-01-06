(function() {
    'use strict';

    // settings button
    var button = new ui.Button({
        text: 'Designer Settings'
    });
    header.append(button);

    button.on('click', function() {
        msg.call('selector:clear');
        msg.call('attributes:inspect', 'designerSettings', msg.call('designerSettings'));
    });
})();
