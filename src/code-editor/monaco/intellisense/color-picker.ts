editor.once('load', () => {

    function componentToHex(c) {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? `0${hex}` : hex;
    }

    function rgbaToHex(r, g, b, a = 1) {
        // Check if alpha is necessary to include
        const alphaHex = a < 1 ? componentToHex(a) : '';
        return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}${alphaHex}`;
    }

    function parseHex(hex) {
        if (hex.length === 3 || hex.length === 4) {
            // Convert shorthand hex to full hex
            hex = hex.split('').map(c => c + c).join('');
        }
        if (hex.length === 6) {
            hex += 'ff'; // Assume fully opaque if alpha isn't specified
        }
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;
        return [r, g, b, a];
    }

    monaco.languages.registerColorProvider('javascript', {
        provideColorPresentations: (model, colorInfo) => {
            const { red, green, blue, alpha } = colorInfo.color;
            const hex = rgbaToHex(red, green, blue, alpha); // Ensure rgbaToHex outputs the string in correct format.

            return [{
                label: hex,
                textEdit: {
                    range: colorInfo.range,
                    text: hex
                }
            }];
        },

        provideDocumentColors(model) {
            const colorInfos = [];
            const regex = /(["'`])#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\1/gi;
            let match;

            while ((match = regex.exec(model.getValue())) !== null) {
                const hex = match[2];
                const [red, green, blue, alpha] = parseHex(hex);

                // @ts-ignore
                const range = new monaco.Range(
                    model.getPositionAt(match.index).lineNumber,
                    model.getPositionAt(match.index).column + 1,
                    model.getPositionAt(match.index + match[0].length).lineNumber,
                    model.getPositionAt(match.index + match[0].length).column - 1
                );

                colorInfos.push({ range, color: { red, green, blue, alpha } });
            }

            return colorInfos;
        }
    });
});
