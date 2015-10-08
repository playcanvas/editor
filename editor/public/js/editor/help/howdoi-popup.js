editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var overlay = new ui.Overlay();
    overlay.class.add('help-howdoi');
    overlay.hidden = true;
    overlay.clickable = true;
    root.append(overlay);

    var panel = new ui.Panel();
    overlay.append(panel);

    var img = new Image();
    panel.append(img);
    img.style.display = 'none';
    img.draggable = false;

    var video = document.createElement('iframe');
    video.width = '360';
    video.height = '360';
    video.setAttribute('allowFullScreen', '');
    video.style.display = 'none';
    panel.append(video);

    var header = new ui.Label();
    header.renderChanges = false;
    header.class.add('header');
    panel.append(header);

    var content = new ui.Label();
    content.renderChanges = false;
    panel.append(content);

    var close = new ui.Button({
        text: 'GOT IT'
    });
    close.class.add('close');
    panel.append(close);

    close.on('click', function () {
        overlay.hidden = true;
    });

    var docs = new ui.Button({
        text: 'View Docs'
    });
    docs.class.add('docs');
    panel.append(docs);
    docs.hidden = true;

    var key = function (e) {
        // close on esc
        if (e.keyCode === 27) {
            overlay.hidden = true;
        }
    };

    overlay.on('show', function () {
        editor.emit('help:howdoi:popup:open');
        window.addEventListener('keydown', key);
    });

    overlay.on('hide', function () {
        window.removeEventListener('keydown', key);

        editor.emit('help:howdoi:popup:close');
        // stop video
        video.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');

        // clear img
        img.src = '';
    });


    editor.method('help:howdoi:popup', function (data) {
        overlay.hidden = false;
        header.text = data.title;
        content.text = data.text;

        img.style.display = 'none';
        video.style.display = 'none';

        if (data.img) {
            img.src = data.img;
            img.onload = function () {
                img.style.display = 'block';
            };
        } else {
            if (data.video) {
                video.src = data.video.url + '?controls=2&showinfo=0&enablejsapi=1';
                video.width = data.video.width;
                video.height = data.video.height * Math.min(1, content.element.getBoundingClientRect().width / data.video.width);
                video.style.display = 'block';
            }
        }

        docs.unbind('click');

        if (data.docs) {
            docs.hidden = false;
            docs.on('click', function () {
                window.open(data.docs, '_blank');
            });
        } else {
            docs.hidden = true;
        }

    });

});