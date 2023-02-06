editor.once('load', function () {
    window.addEventListener('error', function (evt) {
        // console.log(evt);
        editor.call('status:error', evt.message);
    }, false);
});
