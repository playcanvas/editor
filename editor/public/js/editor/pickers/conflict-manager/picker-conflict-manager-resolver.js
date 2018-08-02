editor.once('load', function () {
    'use strict';

    var ConflictResolver = function (srcAssetIndex, dstAssetIndex, srcEntityIndex, dstEntityIndex) {
        Events.call(this);
        this.elements = [];
        this.srcAssetIndex = srcAssetIndex;
        this.dstAssetIndex = dstAssetIndex;
        this.srcEntityIndex = srcEntityIndex;
        this.dstEntityIndex = dstEntityIndex;
    };

    ConflictResolver.prototype = Object.create(Events.prototype);

    ConflictResolver.prototype.createSection = function (title, foldable) {
        var section = new ui.ConflictSection(this, title, foldable);
        this.elements.push(section);
        return section;
    };

    ConflictResolver.prototype.createSeparator = function (title) {
        var label = new ui.Label({
            text: title
        });
        label.class.add('section-separator');
        this.elements.push(label);
        return label;
    };

    ConflictResolver.prototype.appendToParent = function (parent) {
        for (var i = 0, len = this.elements.length; i < len; i++) {
            var element = this.elements[i];
            if (element instanceof ui.ConflictSection) {
                if (element.numConflicts) {
                    parent.append(element.panel);
                }
            } else {
                parent.append(element);
            }
        }

        // Reflow (call onAddedToDom) after 2 frames. The reason why it's 2 frames
        // and not 1 is it doesn't always work on 1 frame and I don't know why yet..
        var self = this;
        requestAnimationFrame(function () {
            requestAnimationFrame(self.reflow.bind(self));
        });
    };

    ConflictResolver.prototype.reflow = function () {
        for (var i = 0, len = this.elements.length; i < len; i++) {
            var element = this.elements[i];
            if (element instanceof ui.ConflictSection) {
                element.onAddedToDom();
            }
        }

        this.emit('reflow');
    };

    ConflictResolver.prototype.resolveUsingSource = function () {
        for (var i = 0, len = this.elements.length; i < len; i++) {
            var element = this.elements[i];
            if (element instanceof ui.ConflictSection) {
                element.resolveUsingSource();
            }
        }
    };

    ConflictResolver.prototype.resolveUsingDestination = function () {
        for (var i = 0, len = this.elements.length; i < len; i++) {
            var element = this.elements[i];
            if (element instanceof ui.ConflictSection) {
                element.resolveUsingDestination();
            }
        }
    };

    ConflictResolver.prototype.destroy = function () {
        for (var i = 0, len = this.elements.length; i < len; i++) {
            this.elements[i].destroy();
        }
        this.elements.length = 0;
    };

    window.ui.ConflictResolver = ConflictResolver;
});
