"use strict";

function Progress(args) {
    ui.Element.call(this);
    args = args || { };

    this._progress = 0;

    if (args.progress)
        this._progress = Math.max(0, Math.min(1, args.progress));

    this._targetProgress = this._progress;

    this._lastProgress = Math.floor(this._progress * 100);

    this.element = document.createElement('div');
    this.element.classList.add('ui-progress');

    this._inner = document.createElement('div');
    this._inner.classList.add('inner');
    this._inner.style.width = (this._progress * 100) + '%';
    this.element.appendChild(this._inner);

    this._speed = args.speed || 1;

    this._now = Date.now();
    this._animating = false;

    this._failed = false;

    var self = this;
    this._animateHandler = function() {
        self._animate();
    };
}
Progress.prototype = Object.create(ui.Element.prototype);


Object.defineProperty(Progress.prototype, 'progress', {
    get: function() {
        return this._progress;
    },
    set: function(value) {
        value = Math.max(0, Math.min(1, value));

        if (this._targetProgress === value)
            return;

        this._targetProgress = value;

        if (this._speed === 0 || this._speed === 1) {
            this._progress = this._targetProgress;
            this._inner.style.width = (this._progress * 100) + '%';

            var progress = Math.max(0, Math.min(100, Math.round(this._progress * 100)));
            if (progress !== this._lastProgress) {
                this._lastProgress = progress;
                this.emit('progress:' + progress);
                this.emit('progress', progress);
            }
        } else if (! this._animating) {
            requestAnimationFrame(this._animateHandler);
        }
    }
});


Object.defineProperty(Progress.prototype, 'speed', {
    get: function() {
        return this._speed;
    },
    set: function(value) {
        this._speed = Math.max(0, Math.min(1, value));
    }
});


Object.defineProperty(Progress.prototype, 'failed', {
    get: function() {
        return this._failed;
    },
    set: function(value) {
        this._failed = !! value;

        if (this._failed) {
            this.class.add('failed');
        } else {
            this.class.remove('failed');
        }
    }
});


Progress.prototype._animate = function() {
    if (Math.abs(this._targetProgress - this._progress) < 0.01) {
        this._progress = this._targetProgress;
        this._animating = false;
    } else {
        if (! this._animating) {
            this._now = Date.now() - (1000 / 60);
            this._animating = true;
        }
        requestAnimationFrame(this._animateHandler);

        var dt = Math.max(0.1, Math.min(3, (Date.now() - this._now) / (1000 / 60)));
        this._now = Date.now();
        this._progress = this._progress + ((this._targetProgress - this._progress) * (this._speed * dt));
    }

    var progress = Math.max(0, Math.min(100, Math.round(this._progress * 100)));
    if (progress !== this._lastProgress) {
        this._lastProgress = progress;
        this.emit('progress:' + progress);
        this.emit('progress', progress);
    }

    this._inner.style.width = (this._progress * 100) + '%';
};


window.ui.Progress = Progress;
