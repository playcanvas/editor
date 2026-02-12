// dynamic import paths must be explicitly declared otherwise tree-shaking will remove them from the build
const importImageDecoder = (format) => {
    switch (format) {
        case 'avif':
            return import('@jsquash/avif/decode.js');
        case 'webp':
            return import('@jsquash/webp/decode.js');
        case 'png':
            return import('@jsquash/png/decode.js');
        case 'jpeg':
            return import('@jsquash/jpeg/decode.js');
    }
};

const importImageEncoder = (format) => {
    switch (format) {
        case 'avif':
            return import('@jsquash/avif/encode.js');
        case 'webp':
            return import('@jsquash/webp/encode.js');
        case 'png':
            return import('@jsquash/png/encode.js');
        case 'jpeg':
            return import('@jsquash/jpeg/encode.js');
    }
};

export const convert = async (frontendURL, buffer, sourceFormat, targetFormat): Promise<ArrayBuffer> => {
    const { default: encode, init: initEncode } = await importImageEncoder(targetFormat);
    const { default: decode, init: initDecode } = await importImageDecoder(sourceFormat);

    const encodeBinary = await WebAssembly.compileStreaming(fetch(`${frontendURL}wasm/codecs/${targetFormat}/enc.wasm`));
    const decodeBinary = await WebAssembly.compileStreaming(fetch(`${frontendURL}wasm/codecs/${sourceFormat}/dec.wasm`));

    await initEncode(encodeBinary);
    await initDecode(decodeBinary);

    const decoded = await decode(buffer);
    const encoded = await encode(decoded) as any;

    // PNG encode method doesn't return a buffer, so you must access it manually.
    return encoded.buffer ? encoded.buffer : encoded;
};
