// Should not start with a number and then should not contain invalid chars
const sanityRegex = /^[^0-9.#<>$+%!`&='{}@\\/:*?"|\n][^#<>$+%!`&='{}@\\/:*?"|\n]*$/;

// Some reserved names (e.g. "data", "move", "swap", ...) can not be used and would lead to some issues.
// Inlined from playcanvas engine (src/framework/script/script-create.js) to avoid bundling the entire engine.
const reservedScriptNames = new Set([
    'system', 'entity', 'create', 'destroy', 'swap', 'move', 'data',
    'scripts', '_scripts', '_scriptsIndex', '_scriptsData',
    'enabled', '_oldState', 'onEnable', 'onDisable', 'onPostStateChange',
    '_onSetEnabled', '_checkState', '_onBeforeRemove',
    '_onInitializeAttributes', '_onInitialize', '_onPostInitialize',
    '_onUpdate', '_onPostUpdate',
    '_callbacks', '_callbackActive', 'has', 'get', 'on', 'off', 'fire', 'once', 'hasEvent',
    'worker'
]);

export function normalizeScriptName(filename: string): null | string {
    filename = filename.trim();

    if (!filename) {
        return null;
    }

    // It's not as comprehensive on the client side, but it will be sanitized on the server side and the user should get an error.
    if (!sanityRegex.test(filename)) {
        return null;
    }

    const filenameWithoutExtension = trimJsExtension(filename);
    if (reservedScriptNames.has(filenameWithoutExtension)) {
        return null;
    }

    if (filenameWithoutExtension === filename) {
        filename += '.js';
    }

    return filename;
}

function trimJsExtension(filename: string) {
    if (filename.endsWith('.js')) {
        return filename.slice(0, -3);
    }

    if (filename.endsWith('.mjs')) {
        return filename.slice(0, -4);
    }

    return filename;
}
