import { hideAlert, showAlert } from './alert-bar';

editor.once('load', () => {
    // show a warning if the scene size is close to the limit of 16MB (bson size limit ~ 15MB JSON size limit)
    const SCENE_SIZE_LIMIT = 14 * 1024 * 1024;

    const onSceneLoaded = function (data: unknown) {
        const size = JSON.stringify(data).length;
        if (size > SCENE_SIZE_LIMIT) {
            const msg =
                '<a href="https://developer.playcanvas.com/user-manual/editor/scenes/#size-limit" target="_blank">here</a> about scene limits.';
            showAlert('scene-size', {
                tone: 'warn',
                text: `You are close to your scene size limit. Check ${msg}`,
                unsafe: true
            });
        } else {
            hideAlert('scene-size');
        }
    };

    editor.on('scene:raw', onSceneLoaded);
});
