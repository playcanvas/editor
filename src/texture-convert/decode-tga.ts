// ported verbatim from monorepo pipeline/shared/base/image-loader.js so the editor decodes exactly
// what the server does. keep the two in step.

// TGA origin is stored in bit 5 of the image descriptor byte (byte 17 of header).
// 0 = bottom-left origin (needs vertical flip), 1 = top-left origin (no flip).
const TGA_ORIGIN_BIT = 0x20;
const MAX_DIMENSION = 16384;

/**
 * Decode a TGA file buffer into raw RGBA pixel data.
 * Supports uncompressed/RLE true-color (types 2, 10) and grayscale (types 3, 11),
 * with 8-bit, 16-bit, 24-bit, and 32-bit pixel depths.
 *
 * @param {Buffer} buffer - TGA file contents.
 * @returns {{ data: Buffer, width: number, height: number, channels: number, isBottomLeft: boolean, hasAlpha: boolean, isGrayscale: boolean }} Decoded pixel data and metadata.
 */
export function decodeTga(buffer: Uint8Array) {
    const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const idLength = buffer[0];
    const imageType = buffer[2];
    const width = dv.getUint16(12, true);
    const height = dv.getUint16(14, true);
    const bpp = buffer[16];
    const descriptor = buffer[17];
    const isBottomLeft = !(descriptor & TGA_ORIGIN_BIT);
    const channels = bpp / 8;

    const isColor = imageType === 2 || imageType === 10;
    const isGray = imageType === 3 || imageType === 11;
    const isRle = imageType === 10 || imageType === 11;

    if (!isColor && !isGray) {
        throw new Error(`Unsupported TGA image type: ${imageType}`);
    }
    if (isColor && channels !== 3 && channels !== 4) {
        throw new Error(`Unsupported TGA bit depth: ${bpp}`);
    }
    if (isGray && channels !== 1 && channels !== 2) {
        throw new Error(`Unsupported TGA grayscale bit depth: ${bpp}`);
    }
    if (width <= 0 || width > MAX_DIMENSION || height <= 0 || height > MAX_DIMENSION) {
        throw new Error(`Invalid or unsupported TGA dimensions: ${width}x${height}`);
    }

    const pixelCount = width * height;
    const rgba = new Uint8Array(pixelCount * 4);
    let offset = 18 + idLength;

    // Skip optional Color Map data — a color map can be present even in true-color/grayscale images
    if (buffer[1] !== 0) {
        const colorMapLength = dv.getUint16(5, true);
        const colorMapEntrySize = buffer[7];
        offset += colorMapLength * Math.ceil(colorMapEntrySize / 8);
    }
    let maxAlpha = 0;
    let minAlpha = 255;
    let isGrayscale = isGray;

    if (!isRle) {
        for (let i = 0; i < pixelCount; i++) {
            let r, g, b, a;
            if (isGray) {
                r = g = b = buffer[offset];
                a = channels === 2 ? buffer[offset + 1] : 255;
            } else {
                r = buffer[offset + 2];
                g = buffer[offset + 1];
                b = buffer[offset + 0];
                a = channels === 4 ? buffer[offset + 3] : 255;
                if (r !== g || r !== b) isGrayscale = false;
            }
            rgba[i * 4 + 0] = r;
            rgba[i * 4 + 1] = g;
            rgba[i * 4 + 2] = b;
            rgba[i * 4 + 3] = a;
            if (a > maxAlpha) maxAlpha = a;
            if (a < minAlpha) minAlpha = a;
            offset += channels;
        }
    } else {
        let pixel = 0;
        while (pixel < pixelCount) {
            const header = buffer[offset++];
            const count = (header & 0x7f) + 1;
            if (header & 0x80) {
                let r, g, b, a;
                if (isGray) {
                    r = g = b = buffer[offset++];
                    a = channels === 2 ? buffer[offset++] : 255;
                } else {
                    b = buffer[offset++];
                    g = buffer[offset++];
                    r = buffer[offset++];
                    a = channels === 4 ? buffer[offset++] : 255;
                    if (r !== g || r !== b) isGrayscale = false;
                }
                if (a > maxAlpha) maxAlpha = a;
                if (a < minAlpha) minAlpha = a;
                for (let j = 0; j < count; j++) {
                    rgba[pixel * 4 + 0] = r;
                    rgba[pixel * 4 + 1] = g;
                    rgba[pixel * 4 + 2] = b;
                    rgba[pixel * 4 + 3] = a;
                    pixel++;
                }
            } else {
                for (let j = 0; j < count; j++) {
                    let r, g, b, a;
                    if (isGray) {
                        r = g = b = buffer[offset];
                        a = channels === 2 ? buffer[offset + 1] : 255;
                    } else {
                        r = buffer[offset + 2];
                        g = buffer[offset + 1];
                        b = buffer[offset + 0];
                        a = channels === 4 ? buffer[offset + 3] : 255;
                        if (r !== g || r !== b) isGrayscale = false;
                    }
                    rgba[pixel * 4 + 0] = r;
                    rgba[pixel * 4 + 1] = g;
                    rgba[pixel * 4 + 2] = b;
                    rgba[pixel * 4 + 3] = a;
                    if (a > maxAlpha) maxAlpha = a;
                    if (a < minAlpha) minAlpha = a;
                    offset += channels;
                    pixel++;
                }
            }
        }
    }

    // only flag as alpha if there's genuine variation (not all-zero xRGB padding)
    const hasAlpha = maxAlpha > 0 && minAlpha < 255;

    return { data: rgba, width, height, channels: 4, isBottomLeft, hasAlpha, isGrayscale };
}
