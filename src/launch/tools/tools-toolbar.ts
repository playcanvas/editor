editor.once('load', () => {
    // variables
    const toolbar = document.createElement('div');
    toolbar.classList.add('toolbar');
    editor.call('tools:root').appendChild(toolbar);

    // button minimize/maximize
    const btnMinimize = document.createElement('div');
    btnMinimize.innerHTML = '&#57689;'; // down arrow icon (minimize)
    btnMinimize.classList.add('button', 'minimize');
    toolbar.appendChild(btnMinimize);

    btnMinimize.addEventListener('click', (evt) => {
        evt.stopPropagation();
        if (editor.call('tools:minimized')) {
            editor.call('tools:maximize');
        } else {
            editor.call('tools:minimize');
        }
    });

    // update icon when minimized state changes
    editor.on('tools:minimized', (isMinimized) => {
        btnMinimize.innerHTML = isMinimized ? '&#57687;' : '&#57689;'; // up arrow when minimized, down arrow when expanded
    });
});
