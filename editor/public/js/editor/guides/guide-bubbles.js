editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');

    var overlay = new ui.Overlay();
    overlay.clickable = true;
    overlay.hidden = true;
    overlay.class.add('bubble');
    root.append(overlay);

    var panel = new ui.Panel();
    overlay.append(panel);

    var label = new ui.Label({
        unsafe: true
    });
    label.renderChanges = false;
    panel.append(label);

    var btn = new ui.Button({
        text: 'GOT IT'
    });
    btn.class.add('next');
    btn.on('click', function() {
        overlay.hidden = true;
    });
    overlay.append(btn);

    editor.method('guide:bubble', function (title, text, x, y, align, parent) {
        var bubble = new ui.Bubble();

        if (!parent)
            parent = root;

        if (parent instanceof Node) {
            parent.appendChild(bubble.element);
        } else {
            parent.append(bubble.element);
        }

        bubble.position(x, y);

        var evt;

        bubble.on('activate', function () {
            var rect = bubble.element.getBoundingClientRect();

            panel.header = title;
            label.text = text;
            overlay.hidden = false;

            overlay.innerElement.style.top = rect.top + 'px';
            overlay.innerElement.style.left = rect.left + 'px';

            overlay.class.add('arrow-' + align);

            if (/^bottom/.test(align)) {
                var overlayRect = overlay.innerElement.getBoundingClientRect();
                overlay.innerElement.style.marginTop = (-40 - overlayRect.height) + 'px';
            }

            evt = overlay.once('hide', function () {
                bubble.deactivate();
            });
        });

        bubble.on('deactivate', function () {
            bubble.destroy();
            overlay.hidden = true;
            if (evt) {
                evt.unbind();
                evt = null;
            }
        });

        return bubble;
    });

    overlay.on('show', function () {
        overlay.class.remove('arrow-left');
        overlay.class.remove('arrow-top');
        overlay.class.remove('arrow-top-right');
        overlay.class.remove('arrow-right');
        overlay.class.remove('arrow-bottom');
        overlay.class.remove('arrow-bottom-right');
        overlay.innerElement.style.marginTop = '';
    });
});
