import { Container, Label, Button } from '@playcanvas/pcui';

editor.once('load', () => {

    // show a warning if the scene size is close to the limit of 16MB (bson size limit ~ 15MB JSON size limit)
    const SCENE_SIZE_LIMIT = 14 * 1024 * 1024;

    const root = editor.call('layout.root');
    const container = new Container({
        id: 'scene-size-alert',
        hidden: true
    });

    const label = new Label({
        unsafe: true
    });
    container.append(label);

    const btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    container.append(btnClose);
    btnClose.on('click', () => {
        container.hidden = true;
    });

    const onSceneLoaded = function (data: unknown) {

        const size = JSON.stringify(data).length;
        if (size > SCENE_SIZE_LIMIT) {
            const msg = '<a href="https://developer.playcanvas.com/user-manual/scenes/#size-limit" target="_blank">here</a> about scene limits.';
            label.text = `You are close to your scene size limit. Check ${msg}`;
            container.hidden = false;
        } else {
            container.hidden = true;
        }
    };

    root.append(container);

    editor.on('scene:raw', onSceneLoaded);
});
