editor.once('load', function () {
    'use strict';

    var ConflictResolver = function () {
        this.elements = [];
    };

    ConflictResolver.prototype.createSection = function (title, foldable) {
        var section = new ui.ConflictSection(title, foldable);
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
                parent.append(element.panel);
                element.onAddedToDom();
            } else {
                parent.append(element);
            }
        }
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
