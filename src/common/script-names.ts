import { getReservedScriptNames } from 'playcanvas';

// Should not start with a number and then should not contain invalid chars
const sanityRegex = /^[^0-9.#<>$+%!`&='{}@\\/:*?"|\n][^#<>$+%!`&='{}@\\/:*?"|\n]*$/;

// Some reserved names (e.g. "data", "move", "swap", ...) can not be used and would lead to some issues.
const reservedScriptNames = getReservedScriptNames();

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
