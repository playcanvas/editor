editor.once('load', () => {
    editor.on('realtime:connecting', () => {
        editor.call('status:connection', 'Connecting...');
    });

    editor.on('realtime:disconnected', () => {
        editor.call('status:connection:error', 'Disconnected');
    });

    editor.on('realtime:connected', () => {
        editor.call('status:connection', 'Connected');
    });

    let remainingTime;

    const retry = function () {
        editor.call('status:connection', `Connecting again in ${remainingTime} seconds...`);
        if (remainingTime > 1) {
            remainingTime--;
            setTimeout(retry, 1000);
        }
    };

    editor.on('realtime:nextAttempt', (seconds) => {
        remainingTime = seconds;
        retry(seconds);
    });
});
