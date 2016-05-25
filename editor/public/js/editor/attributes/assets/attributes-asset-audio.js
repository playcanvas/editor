editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'audio' || assets[0].get('source'))
            return;

        var asset = assets[0];

        var panel = editor.call('attributes:addPanel', {
            name: 'Audio'
        });
        panel.class.add('component');
        // reference
        editor.call('attributes:reference:attach', 'asset:audio:asset', panel, panel.headerElement);


        // duration
        var fieldDuration = editor.call('attributes:addField', {
            parent: panel,
            name: 'Duration',
            value: '...'
        });
        fieldDuration.renderChanges = false;


        var playing = null;
        var updateTimeline = function() {
            timeline.progress = audio.currentTime / audio.duration;
        };


        // audio
        var audio = new Audio();
        audio.src = config.url.home + asset.get('file.url');
        panel.append(audio);


        // play
        var btnPlay = new ui.Button({
            text: '&#57649;'
        });
        btnPlay.disabled = true;
        btnPlay.class.add('audio-play');
        btnPlay.on('click', function() {
            if (audio.paused) {
                audio.play();
            } else {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        panel.append(btnPlay);


        // timeline
        var timeline = new ui.Progress();
        timeline.class.add('audio-timeline');
        timeline.progress = 1;
        timeline.speed = .9;
        panel.append(timeline);


        // duration information available
        audio.addEventListener('durationchange', function(evt) {
            fieldDuration.text = audio.duration.toFixed(2) + 's';
        }, false);

        // can be played
        audio.addEventListener('canplay', function(evt) {
            btnPlay.enabled = true;
            timeline.progress = 0;
        }, false);

        // on play
        audio.addEventListener('play', function() {
            btnPlay.class.add('active');
            btnPlay.text = '&#57649;';

            if (playing)
                return;

            playing = setInterval(updateTimeline, 1000 / 60);
        }, false);

        // on stop
        audio.addEventListener('pause', function() {
            timeline.progress = 0;
            btnPlay.class.remove('active');
            btnPlay.text = '&#57649;';

            clearInterval(playing);
            playing = null;
        }, false);


        panel.once('destroy', function() {
            clearInterval(playing);
        });
    });
});
