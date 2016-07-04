editor.once('load', function() {
    'use strict';

    var users = { };
    var awaitingLoad = { };

    var stringToHash = function(string) {
        var hash = 0;
        for(var i = 0; i < string.length; i++) {
            var char = string.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return Math.abs(hash);
    };

    var hue2rgb = function hue2rgb(p, q, t){
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };

    var hslToRgb = function(h, s, l) {
        var r, g, b;

        if(s == 0) {
            r = g = b = l;
        }else{
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [ r, g, b ];
    };

    var rgbToHex = function(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };


    var hue = 60;
    var rgbDark = hslToRgb(hue / 360, 0.5, 0.4);
    var rgbNormal = hslToRgb(hue / 360, 0.75, 0.5);
    var rgbLight = hslToRgb(hue / 360, 1, 0.65);

    var colorsDefault = {
        dark: {
            data: rgbDark.slice(0),
            rgb: 'rgb(' + Math.round(rgbDark[0] * 255) + ', ' + Math.round(rgbDark[1] * 255) + ', ' + Math.round(rgbDark[2] * 255) + ')',
            hsl: 'hsl(' + hue + ', 50%, 40%)',
            hex: rgbToHex(Math.round(rgbDark[0] * 255), Math.round(rgbDark[1] * 255), Math.round(rgbDark[2] * 255))
        },
        normal: {
            data: rgbNormal.slice(0),
            rgb: 'rgb(' + Math.round(rgbNormal[0] * 255) + ', ' + Math.round(rgbNormal[1] * 255) + ', ' + Math.round(rgbNormal[2] * 255) + ')',
            hsl: 'hsl(' + hue + ', 75%, 50%)',
            hex: rgbToHex(Math.round(rgbNormal[0] * 255), Math.round(rgbNormal[1] * 255), Math.round(rgbNormal[2] * 255))
        },
        light: {
            data: rgbLight.slice(0),
            rgb: 'rgb(' + Math.round(rgbLight[0] * 255) + ', ' + Math.round(rgbLight[1] * 255) + ', ' + Math.round(rgbLight[2] * 255) + ')',
            hsl: 'hsl(' + hue + ', 100%, 65%)',
            hex: rgbToHex(Math.round(rgbLight[0] * 255), Math.round(rgbLight[1] * 255), Math.round(rgbLight[2] * 255))
        }
    };


    editor.on('whoisonline:add', function(id) {
        if (awaitingLoad[id])
            return;

        awaitingLoad[id] = true;

        editor.call('users:loadOne', id, function(data) {
            if (! awaitingLoad[id]) return;
            delete awaitingLoad[id];

            var hash = stringToHash(data.username);
            var hue = (Math.floor(hash / 15) * 15) % 360;
            var rgbDark = hslToRgb(hue / 360, 0.5, 0.4);
            var rgbNormal = hslToRgb(hue / 360, 0.75, 0.5);
            var rgbLight = hslToRgb(hue / 360, 1, 0.65);

            users[id] = {
                id: id,
                username: data.username,
                colors: {
                    dark: {
                        data: rgbDark.slice(0),
                        rgb: 'rgb(' + Math.round(rgbDark[0] * 255) + ', ' + Math.round(rgbDark[1] * 255) + ', ' + Math.round(rgbDark[2] * 255) + ')',
                        hsl: 'hsl(' + hue + ', 50%, 40%)',
                        hex: rgbToHex(Math.round(rgbDark[0] * 255), Math.round(rgbDark[1] * 255), Math.round(rgbDark[2] * 255))
                    },
                    normal: {
                        data: rgbNormal.slice(0),
                        rgb: 'rgb(' + Math.round(rgbNormal[0] * 255) + ', ' + Math.round(rgbNormal[1] * 255) + ', ' + Math.round(rgbNormal[2] * 255) + ')',
                        hsl: 'hsl(' + hue + ', 75%, 50%)',
                        hex: rgbToHex(Math.round(rgbNormal[0] * 255), Math.round(rgbNormal[1] * 255), Math.round(rgbNormal[2] * 255))
                    },
                    light: {
                        data: rgbLight.slice(0),
                        rgb: 'rgb(' + Math.round(rgbLight[0] * 255) + ', ' + Math.round(rgbLight[1] * 255) + ', ' + Math.round(rgbLight[2] * 255) + ')',
                        hsl: 'hsl(' + hue + ', 100%, 65%)',
                        hex: rgbToHex(Math.round(rgbLight[0] * 255), Math.round(rgbLight[1] * 255), Math.round(rgbLight[2] * 255))
                    }
                }
            };
        });
    });

    editor.on('whoisonline:remove', function(id) {
        delete awaitingLoad[id];
        delete users[id];
    });

    editor.method('whoisonline:color', function(id, type, tone) {
        type = type || 'data';
        tone = tone || 'normal';
        var colors = users[id] && users[id].colors || colorsDefault;
        return colors[tone][type];
    });
});
