import fs from 'fs';
import path from 'path';

import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import * as sass from 'sass-embedded';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const MAG_OUT = '\x1b[35m';
const CYAN_OUT = '\x1b[36m';
const BOLD_OUT = '\x1b[1m';
const REGULAR_OUT = '\x1b[22m';

/**
 * @param {number} duration - The duration in milliseconds
 * @returns {string} - The formatted duration
 */
const formatDuration = (duration) => {
    if (duration > 1000) {
        return `${Math.round(duration / 100) / 10}s`;
    }
    return `${duration}ms`;
};

/**
 * @param {string} file - The file to write
 * @param {string} text - The text to write
 */
const writeFile = async (file, text) => {
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.writeFile(file, text);
};

/**
 * @param {string} src - The source file
 * @param {string} dest - The destination file
 * @returns {Promise<void>}
 */
const compile = async (src, dest) => {
    const from = path.relative(rootDir, src);
    const to = path.relative(rootDir, dest);
    const msg = `${BOLD_OUT}${from}${REGULAR_OUT} → ${BOLD_OUT}${to}${REGULAR_OUT}`;

    console.log(`${CYAN_OUT}compiles ${msg}...`);

    const now = performance.now();
    const compiled = await sass.compileAsync(src, { style: 'compressed', logger: sass.Logger.silent });
    const result = await postcss([autoprefixer]).process(compiled.css, { from: undefined });
    await writeFile(dest, result.css);
    const duration = Math.floor(performance.now() - now);

    console.log(`${MAG_OUT}created ${msg} in ${BOLD_OUT}${formatDuration(duration)}${REGULAR_OUT}`);
};

Promise.all(fs.readdirSync('sass')
.filter(file => file.endsWith('.scss'))
.map(file => compile(`sass/${file}`, `dist/css/${file.replace('.scss', '.css')}`)));
