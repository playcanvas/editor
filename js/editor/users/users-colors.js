editor.once('load', function () {
    'use strict';

    var users = { };
    var palette = [
        [5, 0.63, 0.46],
        [6, 0.78, 0.57],
        [24, 1.00, 0.41],
        [28, 0.80, 0.52],
        [37, 0.90, 0.51],
        [48, 0.89, 0.50],
        [145, 0.76, 0.49],
        [146, 0.63, 0.42],
        [168, 0.76, 0.42],
        [169, 0.76, 0.36],
        [204, 0.70, 0.53],
        [205, 0.64, 0.44],
        [282, 0.39, 0.53],
        [283, 0.44, 0.47]
    ];

    var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    var hslToRgb = function (h, s, l) {
        var r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [r, g, b];
    };

    editor.method('color:hsl2rgb', hslToRgb);

    var rgbToHex = function (r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };


    var hsl = palette[0];
    var rgb = hslToRgb(hsl[0] / 360, hsl[1], hsl[2]);

    var colorDefault = {
        data: rgb.slice(0),
        rgb: 'rgb(' + Math.round(rgb[0] * 255) + ', ' + Math.round(rgb[1] * 255) + ', ' + Math.round(rgb[2] * 255) + ')',
        hsl: 'hsl(' + hsl[0] + ', ' + Math.round(hsl[1] * 100) + '%, ' + Math.round(hsl[2] * 100) + '%)',
        hex: rgbToHex(Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255))
    };


    function addUser(id) {
        var hash = id % 14;
        if (Math.floor(hash / 2) !== hash / 2)
            hash = (hash + Math.floor(palette.length / 2)) % 14;

        var hsl = palette[hash];
        var rgb = hslToRgb(hsl[0] / 360, hsl[1], hsl[2]);

        users[id] = {
            id: id,
            color: {
                data: rgb.slice(0),
                rgb: 'rgb(' + Math.round(rgb[0] * 255) + ', ' + Math.round(rgb[1] * 255) + ', ' + Math.round(rgb[2] * 255) + ')',
                hsl: 'hsl(' + hsl[0] + ', ' + Math.round(hsl[1] * 100) + '%, ' + Math.round(hsl[2] * 100) + '%)',
                hex: rgbToHex(Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255))
            }
        };
    }

    editor.method('users:color', function (id, type) {
        type = type || 'data';
        if (!users[id]) {
            addUser(id);
        }

        var color = users[id] && users[id].color || colorDefault;
        return color[type];
    });
});
