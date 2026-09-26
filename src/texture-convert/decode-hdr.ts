// ported verbatim from monorepo pipeline/shared/base/image-loader.js so the editor decodes exactly
// what the server does. keep the two in step.

/**
 * Decode a Radiance HDR (.hdr) file buffer into float32 RGB pixel data.
 * Handles both old-style RGBE scanlines and new-style adaptive RLE.
 * Supports all valid orientation strings (any combination of +/-Y and +/-X).
 * Output is always in standard top-to-bottom, left-to-right order.
 *
 * @param {Buffer} buffer - HDR file contents.
 * @returns {{ data: Float32Array, width: number, height: number }} Decoded float32 pixel data and dimensions.
 */
export function decodeHdr(buffer: Uint8Array) {
    let offset = 0;

    const headerEnd = findDoubleNewline(buffer);
    offset = headerEnd;

    const resLine = readLine(buffer, offset);
    offset += resLine.length + 1;

    // Parse any valid orientation: [+-][XY] dim [+-][XY] dim
    const resMatch = resLine.match(/([+-])([XY])\s+(\d+)\s+([+-])([XY])\s+(\d+)/);
    if (!resMatch) {
        throw new Error(`Invalid HDR resolution line: ${resLine}`);
    }

    const [, firstSign, firstAx, firstDimStr, secondSign, , secondDimStr] = resMatch;
    const firstDim = parseInt(firstDimStr, 10);
    const secondDim = parseInt(secondDimStr, 10);

    const scanlineLen = secondDim;
    const numScanlines = firstDim;

    // First axis determines whether scanlines are rows (Y-first) or columns (X-first)
    const transpose = firstAx === 'X';
    const width = firstAx === 'X' ? firstDim : secondDim;
    const height = firstAx === 'Y' ? firstDim : secondDim;

    // Standard orientation is -Y (top-to-bottom) +X (left-to-right)
    const ySign = firstAx === 'Y' ? firstSign : secondSign;
    const xSign = firstAx === 'X' ? firstSign : secondSign;
    const flipY = ySign === '+';
    const flipX = xSign === '-';

    // Decode RGBE scanlines to float32 RGB
    const decoded = new Float32Array(numScanlines * scanlineLen * 3);
    for (let s = 0; s < numScanlines; s++) {
        const scanline = readHdrScanline(buffer, offset, scanlineLen);
        offset = scanline.newOffset;

        for (let p = 0; p < scanlineLen; p++) {
            const i = p * 4;
            const e = scanline.data[i + 3];
            const outIdx = (s * scanlineLen + p) * 3;
            if (e > 0) {
                const scale = Math.pow(2.0, e - 128 - 8);
                decoded[outIdx] = scanline.data[i] * scale;
                decoded[outIdx + 1] = scanline.data[i + 1] * scale;
                decoded[outIdx + 2] = scanline.data[i + 2] * scale;
            }
        }
    }

    // Fast path: standard orientation (-Y +X), no reordering needed
    if (!transpose && !flipY && !flipX) {
        return { data: decoded, width, height };
    }

    // Reorder to standard top-to-bottom, left-to-right
    const floatData = new Float32Array(width * height * 3);
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let s, p;
            if (transpose) {
                s = flipX ? width - 1 - col : col;
                p = flipY ? height - 1 - row : row;
            } else {
                s = flipY ? height - 1 - row : row;
                p = flipX ? width - 1 - col : col;
            }
            const srcIdx = (s * scanlineLen + p) * 3;
            const dstIdx = (row * width + col) * 3;
            floatData[dstIdx] = decoded[srcIdx];
            floatData[dstIdx + 1] = decoded[srcIdx + 1];
            floatData[dstIdx + 2] = decoded[srcIdx + 2];
        }
    }

    return { data: floatData, width, height };
}

function findDoubleNewline(buffer: Uint8Array) {
    for (let i = 0; i < buffer.length - 1; i++) {
        if (buffer[i] === 0x0a && buffer[i + 1] === 0x0a) return i + 2;
        if (buffer[i] === 0x0d && buffer[i + 1] === 0x0a && buffer[i + 2] === 0x0d && buffer[i + 3] === 0x0a)
            return i + 4;
    }
    throw new Error('HDR header end not found');
}

function readLine(buffer: Uint8Array, offset: number) {
    let end = offset;
    while (end < buffer.length && buffer[end] !== 0x0a) end++;
    return new TextDecoder('ascii').decode(buffer.subarray(offset, end));
}

function readHdrScanline(buffer: Uint8Array, offset: number, width: number) {
    // Check for new-style adaptive RLE (marker: 0x02 0x02 followed by width)
    if (
        width >= 8 &&
        width <= 0x7fff &&
        buffer[offset] === 2 &&
        buffer[offset + 1] === 2 &&
        buffer[offset + 2] === ((width >> 8) & 0xff) &&
        buffer[offset + 3] === (width & 0xff)
    ) {
        offset += 4;
        const data = new Uint8Array(width * 4);

        // Read each of the 4 channels separately (R, G, B, E)
        for (let ch = 0; ch < 4; ch++) {
            let x = 0;
            while (x < width) {
                const code = buffer[offset++];
                if (code > 128) {
                    const count = code - 128;
                    const val = buffer[offset++];
                    for (let j = 0; j < count; j++) {
                        data[(x + j) * 4 + ch] = val;
                    }
                    x += count;
                } else {
                    for (let j = 0; j < code; j++) {
                        data[(x + j) * 4 + ch] = buffer[offset++];
                    }
                    x += code;
                }
            }
        }

        return { data, newOffset: offset };
    }

    // Old-style: flat RGBE data
    const data = new Uint8Array(width * 4);
    for (let x = 0; x < width; x++) {
        data[x * 4 + 0] = buffer[offset++];
        data[x * 4 + 1] = buffer[offset++];
        data[x * 4 + 2] = buffer[offset++];
        data[x * 4 + 3] = buffer[offset++];
    }

    return { data, newOffset: offset };
}

// header-only [width, height], parsed the way decodeHdr starts
export function hdrSize(buffer: Uint8Array) {
    const m = readLine(buffer, findDoubleNewline(buffer)).match(/([+-])([XY])\s+(\d+)\s+([+-])([XY])\s+(\d+)/);
    if (!m) {
        return null;
    }
    const [first, second] = [parseInt(m[3], 10), parseInt(m[6], 10)];
    return m[2] === 'X' ? [first, second] : [second, first];
}
