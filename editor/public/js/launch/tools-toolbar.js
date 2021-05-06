editor.once('load', function () {
    'use strict';

    // variables
    var toolbar = document.createElement('div');
    toolbar.classList.add('toolbar');
    editor.call('tools:root').appendChild(toolbar);

    // button close
    var btnClose = document.createElement('div');
    btnClose.innerHTML = '&#57650;';
    btnClose.classList.add('button');
    toolbar.appendChild(btnClose);
    btnClose.addEventListener('click', function () {
        editor.call('tools:disable');
    });
});
