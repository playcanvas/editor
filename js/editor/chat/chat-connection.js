editor.once('load', function () {
    // connect to room with project-id name
    editor.on('relay:connected', () => {
        editor.call('relay:joinRoom', 'project-' + config.project.id);
    });

});
