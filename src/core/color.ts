export const rgb2hsv = (rgb: number[]) => {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const v = Math.max(r, g, b);
    const diff = v - Math.min(r, g, b);
    const diffc = (c: number) => {
        return (v - c) / 6 / diff + 1 / 2;
    };

    let rr, gg, bb, h, s;
    if (diff === 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
            h = bb - gg;
        } else if (g === v) {
            h = (1 / 3) + rr - bb;
        } else if (b === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }
    return [h, s, v];
};

export const hsv2rgb = (hsv: number[]) => {
    let h = hsv[0];
    let s = hsv[1];
    let v = hsv[2];
    let r, g, b;
    if (h && s === undefined && v === undefined) {
        const hObj = h as unknown as { h: number; s: number; v: number };
        s = hObj.s;
        v = hObj.v;
        h = hObj.h;
    }
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

export const rgbaStr = (color: number[], scale?: number) => {
    if (!scale) {
        scale = 1;
    }
    let rgba = color.map((element: number, index: number) => {
        return index < 3 ? Math.round(element * scale) : element;
    }).join(',');
    for (let i = color.length; i < 4; ++i) {
        rgba += `,${i < 3 ? scale : 1}`;
    }
    return `rgba(${rgba})`;
};

export const hexStr = (clr: number[]) => {
    return clr.map((v: number) => {
        return (`00${v.toString(16)}`).slice(-2).toUpperCase();
    }).join('');
};

// rgb(a) -> hsva
export const toHsva = (rgba: number[]) => {
    const hsva = rgb2hsv(rgba.map((v: number) => {
        return v * 255;
    }));
    hsva.push(rgba.length > 3 ? rgba[3] : 1);
    return hsva;
};

// hsv(1) -> rgba
export const toRgba = (hsva: number[]) => {
    const rgba = hsv2rgb(hsva).map((v: number) => {
        return v / 255;
    });
    rgba.push(hsva.length > 3 ? hsva[3] : 1);
    return rgba;
};

// calculate the normalized coordinate [x,y] relative to rect
export const normalizedCoord = (widget: { element: HTMLElement }, x: number, y: number) => {
    const rect = widget.element.getBoundingClientRect();
    return [
        (x - rect.left) / rect.width,
        (y - rect.top) / rect.height
    ];
};
