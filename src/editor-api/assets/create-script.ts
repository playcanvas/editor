const VALID_FILENAME = /^[^0-9.#<>$+%!`&='{}@\\/:*?"|\n][^#<>$+%!`&='{}@\\/:*?"|\n]*$/;
const extensionToBoilerplateMap = new Map([
    ['.js', createBoilerplate],
    ['.mjs', createEsmBoilerplate],
    ['.ts', createTsBoilerplate]
]);
const validExtensions = Array.from(extensionToBoilerplateMap.keys());

/**
 * Creates filename and script content from provided arguments. If the provide filename contains a '.mjs'
 * suffix, it will generate an ESM based class syntax.
 *
 * @param filename - The desired filename.
 * @param text - The desired contents of the script. If not provided boilerplate code will be used.
 * @returns The filename and content of the script
 */
function createScript(filename: string, text: string) {
    let className = '';
    let scriptName = '';

    // tokenize filename
    const tokens = [];
    const name = filename.slice(0, -3);
    const str = name.replace(/([A-Z0-9])/g, ' $1');
    const parts = str.split(/([\s\-_.])/);

    // filter valid tokens
    for (let i = 0; i < parts.length; i++) {
        parts[i] = parts[i].toLowerCase().trim();
        if (parts[i] && parts[i] !== '-' && parts[i] !== '_' && parts[i] !== '.') {
            tokens.push(parts[i]);
        }
    }

    if (tokens.length) {
        scriptName = tokens[0];

        for (let i = 1; i < tokens.length; i++) {
            scriptName += tokens[i].charAt(0).toUpperCase() + tokens[i].slice(1);
        }

        for (let i = 0; i < tokens.length; i++) {
            className += tokens[i].charAt(0).toUpperCase() + tokens[i].slice(1);
        }
    } else {
        className = 'Script';
        scriptName = 'script';
    }

    if (!VALID_FILENAME.test(className)) {
        className = 'Script';
    }

    if (!filename) {
        filename = `${scriptName}.js`;
    }

    const hasValidExtension = validExtensions.some(ext => filename.endsWith(ext));
    if (!hasValidExtension) {
        filename += '.js';
    }

    // Extract extension from filename
    const extension = filename.slice(filename.lastIndexOf('.'));

    // Get the correct boilerplate generator based on the file extension
    const boilerPlateGenerator = extensionToBoilerplateMap.get(extension);

    const content = text || boilerPlateGenerator(className, scriptName);

    return {
        filename,
        content
    };
}

function createBoilerplate(className: string, scriptName: string) {
    return `
var ${className} = pc.createScript('${scriptName}');

// initialize code called once per entity
${className}.prototype.initialize = function() {

};

// update code called every frame
${className}.prototype.update = function(dt) {

};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// ${className}.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/
`.trim();
}

function createEsmBoilerplate(className: string, scriptName: string) {
    return `
import { Script } from 'playcanvas';

/**
 * The {@link https://api.playcanvas.com/classes/Engine.Script.html | Script} class is
 * the base class for all PlayCanvas scripts. Learn more about writing scripts in the
 * {@link https://developer.playcanvas.com/user-manual/scripting/ | scripting guide}.
 */
export class ${className} extends Script {

    static scriptName = '${scriptName}';

    /**
     * Called when the script is about to run for the first time.
     */
    initialize() {
    }

    /**
     * Called for enabled (running state) scripts on each tick.
     *
     * @param {number} dt - The delta time in seconds since the last frame.
     */
    update(dt) {
    }
}
`.trim();
}

function createTsBoilerplate(className: string, scriptName: string) {
    return `
import { Script } from 'playcanvas';

/**
 * The {@link https://api.playcanvas.com/classes/Engine.Script.html | Script} class is
 * the base class for all PlayCanvas scripts. Learn more about writing scripts in the
 * {@link https://developer.playcanvas.com/user-manual/scripting/ | scripting guide}.
 */
export class ${className} extends Script {

    static scriptName = "${scriptName}"

    /**
     * Called when the script is about to run for the first time.
     */
    initialize(): void {
    }

    /**
     * Called for enabled (running state) scripts on each tick.
     *
     * @param {number} dt - The delta time in seconds since the last frame.
     */
    update(dt: number): void {
    }
}
`.trim();
}

export { createScript };
