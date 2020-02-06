Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'asset-audio-inspector';

    const ATTRIBUTES = [{
        label: 'Duration',
        alias: 'duration',
        type: 'label',
        args: {
            value: '...'
        }
    }];

    ATTRIBUTES.forEach(attr => {
        const path = attr.alias || attr.path;
        if (!path) return;
        const parts = path.split('.');
        attr.reference = `asset:audio:${parts[parts.length - 1]}`;
    });

    const DOM = (parent) => [
        {
            attributesInspector: new pcui.AttributesInspector({
                assets: parent.args.assets,
                history: parent.args.history,
                attributes: ATTRIBUTES
            })
        },
        {
            root: {
                audioContainer: new pcui.Container({
                    flex: true,
                    flexDirection: 'row',
                    alignItems: 'center'
                })
            },
            children: [
                {
                    audio: new Audio()
                },
                {
                    audioButton: new pcui.Button({
                        icon: 'E286'
                    })
                },
                {
                    audioTimeline: new pcui.Progress({
                        flexGrow: 1
                    })
                }
            ]
        }
    ];

    class AudioAssetInspector extends pcui.Panel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'AUDIO';

            super(args);
            this.args = args;

            this.class.add(CLASS_ROOT);

            this.buildDom(DOM(this));
            this._playing = null;
            this._events = [];
        }

        _onClickAudioButton(evt) {
            if (this._audio.paused) {
                this._audio.play();
            } else {
                this._audio.pause();
                this._audio.currentTime = 0;
            }
        }

        _audioDurationChange(evt) {
            this._attributesInspector.getField('duration').value = this._audio.duration.toFixed(2) + 's';
        }

        _audioCanPlay(evt) {
            this._audioButton.disabled = false;
            this._audioTimeline.value = 0;
        }

        _audioPlayed(evt) {
            this._audioButton.class.add('active');
            if (this._playing) {
                return;
            }
            this._playing = setInterval(this._updateTimeline.bind(this), 1000 / 60);
        }

        _audioPaused(evt) {
            this._audioTimeline.value = 0;
            this._audioButton.class.remove('active');
            clearInterval(this._playing);
            this._playing = null;
        }

        _updateTimeline() {
            this._audioTimeline.value = this._audio.currentTime / this._audio.duration * 100;
        }

        link(assets) {
            this.unlink();
            if (assets.length > 1) {
                return;
            }

            this._audioButton.disabled = true;
            this._audioTimeline.value = 100;

            this._events.push(this._audioButton.on('click', this._onClickAudioButton.bind(this)));

            this._attributesInspector.link(assets);
            this._audio = new Audio();
            this._audioContainer.prepend(this._audio);
            this._audio.src = config.url.home + assets[0].get('file.url');

            this._audio.addEventListener('canplay', this._audioCanPlay.bind(this), false);
            this._audio.addEventListener('play', this._audioPlayed.bind(this), false);
            this._audio.addEventListener('pause', this._audioPaused.bind(this), false);
            this._audio.addEventListener('durationchange', this._audioDurationChange.bind(this), false);
        }

        unlink() {
            this._attributesInspector.unlink();
            clearInterval(this._playing);
            if (this._audio) {
                this._audio.pause();
            }
            this._audio = null;
            this._events.forEach(evt => evt.unbind());
            this._events = [];
            this._attributesInspector.getField('duration').value = '...';
        }
    }

    return {
        AudioAssetInspector: AudioAssetInspector
    };
})());
