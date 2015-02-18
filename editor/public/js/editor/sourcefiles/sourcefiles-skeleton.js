editor.once('load', function () {
    'use strict';

    // returns skeleton script for a script with the specified url
    editor.method('sourcefiles:skeleton', function (url) {
        var parts = url.split('/');
        // remove .js extension
        var scriptName = parts[parts.length-1].slice(0,-3).replace(new RegExp("[\\.-]"), '_');
        var objectName = scriptName.charAt(0).toUpperCase() + scriptName.slice(1);

        var result = [
            "pc.script.create('" + scriptName + "', function (app) {",
            "    // Creates a new " + objectName + " instance",
            "    var " + objectName + " = function (entity) {",
            "        this.entity = entity;",
            "    };",
            "",
            "    " + objectName + ".prototype = {",
            "        // Called once after all resources are loaded and before the first update",
            "        initialize: function () {",
            "        },",
            "",
            "        // Called every frame, dt is time in seconds since last update",
            "        update: function (dt) {",
            "        }",
            "    };",
            "",
            "    return " + objectName + ";",
            "});"].join('\n');

        return result;
    });
});