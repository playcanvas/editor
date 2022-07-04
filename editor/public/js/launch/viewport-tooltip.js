editor.once('load', function () {
    'use strict';

    // console
    var panel = document.createElement('div');
    panel.id = 'application-tooltip';
    panel.classList.add('hidden');
    document.body.appendChild(panel);

    // close button img
    var closeBtn = document.createElement('img');
    closeBtn.src = 'https://playcanvas.com/static-assets/images/icons/fa/16x16/remove.png';
    panel.appendChild(closeBtn);

    var messageSpan = document.createElement('span');
    panel.appendChild(messageSpan);

    closeBtn.addEventListener('click', function () {
        panel.classList.add('hidden');
    });

    window.showTooltipMessage = (msg) => {
        messageSpan.innerText = msg;
        panel.classList.remove('hidden');
    };

    if (config.engineVersions.length === 3 && location.search.includes(`version=${Object.values(config.engineVersions[2])[0]}`)) {
        showTooltipMessage(`You are currently using engine version: ${Object.keys(config.engineVersions[2])[0]}`);
    } else if (location.search.includes(`version=${Object.values(config.engineVersions[0])[0]}`)) {
        showTooltipMessage(`You are currently using engine version: ${Object.keys(config.engineVersions[0])[0]}`);
    }
});
