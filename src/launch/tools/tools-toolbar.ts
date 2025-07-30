editor.once('load', () => {
    // variables
    const toolbar = document.createElement('div');
    toolbar.classList.add('toolbar');
    editor.call('tools:root').appendChild(toolbar);

    // button close
    const btnClose = document.createElement('div');
    btnClose.innerHTML = '&#57650;';
    btnClose.classList.add('button');
    toolbar.appendChild(btnClose);
    btnClose.addEventListener('click', () => {
        editor.call('tools:disable');
    });
});
