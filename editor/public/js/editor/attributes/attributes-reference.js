editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var panel = editor.call('layout.right');


    editor.method('attributes:reference', function(args) {
        var tooltip = new ui.Tooltip({
            align: 'right'
        });
        tooltip.hoverable = true;
        tooltip.class.add('reference');

        var html = '';
        if (args.title)
            html += '<h1>' + args.title + '</h1>';
        if (args.subTitle)
            html += '<h2>' + args.subTitle + '</h2>';
        if (args.description)
            html += '<p>' + args.description + '</p>';
        if (args.url)
            html += '<a class="reference" href="' + args.url + '" target="_blank">API Reference</a>';
        tooltip.html = html;

        var links = { };
        var timerHover = null;
        var timerBlur = null;

        tooltip.attach = function(args) {
            var target = args.target;
            var element = args.element;

            var show = function() {
                if (! target || target.hidden) return;
                tooltip.position(panel.element.getBoundingClientRect().left, element.getBoundingClientRect().top + 16);
                tooltip.hidden = false;
            };

            var evtHide = function() {
                clearTimeout(timerHover);
                clearTimeout(timerBlur);
                tooltip.hidden = true;
            };

            var evtHover = function() {
                clearTimeout(timerBlur);
                timerHover = setTimeout(show, 500);
            };

            var evtBlur = function() {
                clearTimeout(timerHover);
                timerBlur = setTimeout(hide, 200);
            };

            var evtClick = function() {
                clearTimeout(timerBlur);
                clearTimeout(timerHover);
                show();
            };

            target.on('hide', evtHide);

            target.once('destroy', function() {
                element.removeEventListener('mouseover', evtHover);
                element.removeEventListener('mouseout', evtBlur);
                element.removeEventListener('click', evtClick);
                target.unbind('hide', evtHide);
                target = null;
                element = null;
                clearTimeout(timerHover);
                clearTimeout(timerBlur);
                tooltip.hidden = true;
            });

            element.addEventListener('mouseover', evtHover, false);
            element.addEventListener('mouseout', evtBlur, false);
            element.addEventListener('click', evtClick, false);
        };

        var hide = function() {
            tooltip.hidden = true;
        };

        tooltip.on('hover', function() {
            clearTimeout(timerBlur);
        });

        root.append(tooltip);

        return tooltip;
    });
});
