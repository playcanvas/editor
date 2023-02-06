editor.once('load', function () {
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

    // display engine version popup
    const params = new URLSearchParams(location.search);
    const version = params.get('version');
    if (version) {
        window.showTooltipMessage(`You are currently using engine version: ${version}`);
    }
});
