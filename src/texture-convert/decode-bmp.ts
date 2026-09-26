// ported verbatim from monorepo pipeline/shared/base/image-loader.js so the editor decodes exactly
// what the server does. keep the two in step.

const MAX_DIMENSION = 16384;

// BMP compression types
const BI_RGB = 0;

/**
 * Decode a BMP file buffer into raw RGBA pixel data.
 * Supports 8-bit paletted, 24-bit RGB, and 32-bit RGBA (uncompressed only).
 * Pixel data is stored bottom-to-top in BMP; caller is responsible for flipping.
 *
 * @param {Buffer} buffer - BMP file contents.
 * @returns {{ data: Buffer, width: number, height: number, hasAlpha: boolean, isGrayscale: boolean }} Decoded pixel data and metadata.
 */
export function decodeBmp(buffer: Uint8Array) {
    const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    if (buffer[0] !== 0x42 || buffer[1] !== 0x4d) {
        throw new Error('Invalid BMP: missing BM magic');
    }

    const pixelDataOffset = dv.getUint32(10, true);
    const dibHeaderSize = dv.getUint32(14, true);
    if (dibHeaderSize < 40) {
        throw new Error(`Unsupported BMP DIB header size: ${dibHeaderSize} (OS/2 headers not supported)`);
    }

    const width = dv.getInt32(18, true);
    const height = dv.getInt32(22, true);
    const bpp = dv.getUint16(28, true);
    const compression = dv.getUint32(30, true);

    if (compression !== BI_RGB) {
        throw new Error(`Unsupported BMP compression type: ${compression}`);
    }
    if (bpp !== 8 && bpp !== 24 && bpp !== 32) {
        throw new Error(`Unsupported BMP bit depth: ${bpp}`);
    }

    // Height can be negative (top-down BMP), but that's rare
    const absHeight = Math.abs(height);
    if (width <= 0 || width > MAX_DIMENSION || absHeight === 0 || absHeight > MAX_DIMENSION) {
        throw new Error(`Invalid or unsupported BMP dimensions: ${width}x${absHeight}`);
    }
    const pixelCount = width * absHeight;
    const rgba = new Uint8Array(pixelCount * 4);
    let hasAlpha = false;
    let isGrayscale = true;

    if (bpp === 8) {
        // 8-bit paletted: read color table (BGRA entries) after DIB header
        const paletteOffset = 14 + dibHeaderSize;
        const palette = new Uint8Array(256 * 4);
        for (let i = 0; i < 256; i++) {
            const po = paletteOffset + i * 4;
            palette[i * 4 + 0] = buffer[po + 2]; // R (stored as BGR in BMP)
            palette[i * 4 + 1] = buffer[po + 1]; // G
            palette[i * 4 + 2] = buffer[po + 0]; // B
            palette[i * 4 + 3] = 255;
        }
        // Pre-check palette for grayscale
        for (let i = 0; i < 256; i++) {
            if (palette[i * 4] !== palette[i * 4 + 1] || palette[i * 4] !== palette[i * 4 + 2]) {
                isGrayscale = false;
                break;
            }
        }

        const rowStride = (width + 3) & ~3; // rows padded to 4-byte boundary
        for (let y = 0; y < absHeight; y++) {
            const srcRow = pixelDataOffset + y * rowStride;
            const dstRow = y * width;
            for (let x = 0; x < width; x++) {
                const idx = buffer[srcRow + x];
                const pi = idx * 4;
                rgba[(dstRow + x) * 4 + 0] = palette[pi + 0];
                rgba[(dstRow + x) * 4 + 1] = palette[pi + 1];
                rgba[(dstRow + x) * 4 + 2] = palette[pi + 2];
                rgba[(dstRow + x) * 4 + 3] = 255;
            }
        }
    } else if (bpp === 24) {
        const rowStride = (width * 3 + 3) & ~3;
        for (let y = 0; y < absHeight; y++) {
            const srcRow = pixelDataOffset + y * rowStride;
            const dstRow = y * width;
            for (let x = 0; x < width; x++) {
                const si = srcRow + x * 3;
                const r = buffer[si + 2];
                const g = buffer[si + 1];
                const b = buffer[si + 0];
                rgba[(dstRow + x) * 4 + 0] = r;
                rgba[(dstRow + x) * 4 + 1] = g;
                rgba[(dstRow + x) * 4 + 2] = b;
                rgba[(dstRow + x) * 4 + 3] = 255;
                if (r !== g || r !== b) isGrayscale = false;
            }
        }
    } else {
        // 32-bit BGRA (4th byte may be padding in xRGB BMPs)
        const rowStride = width * 4;
        let maxAlpha = 0;
        let minAlpha = 255;
        for (let y = 0; y < absHeight; y++) {
            const srcRow = pixelDataOffset + y * rowStride;
            const dstRow = y * width;
            for (let x = 0; x < width; x++) {
                const si = srcRow + x * 4;
                const r = buffer[si + 2];
                const g = buffer[si + 1];
                const b = buffer[si + 0];
                const a = buffer[si + 3];
                rgba[(dstRow + x) * 4 + 0] = r;
                rgba[(dstRow + x) * 4 + 1] = g;
                rgba[(dstRow + x) * 4 + 2] = b;
                rgba[(dstRow + x) * 4 + 3] = a;
                if (a > maxAlpha) maxAlpha = a;
                if (a < minAlpha) minAlpha = a;
                if (r !== g || r !== b) isGrayscale = false;
            }
        }
        // only flag as alpha if there's genuine variation (not all-zero xRGB padding)
        if (maxAlpha > 0 && minAlpha < 255) hasAlpha = true;
    }

    // height > 0 means bottom-to-top (standard), height < 0 means top-down
    const isBottomUp = height > 0;
    return { data: rgba, width, height: absHeight, hasAlpha, isGrayscale, isBottomUp };
}
