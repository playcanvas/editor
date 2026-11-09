import { expect } from 'chai';
import { describe, it } from 'mocha';

import { captureSize, captureToCss } from '../../../src/launch/mcp/capture';

describe('captureSize', () => {
    it('keeps a drawing buffer up to 800 wide', () => {
        expect(captureSize(800, 600)).to.deep.equal({ width: 800, height: 600 });
        expect(captureSize(640, 480)).to.deep.equal({ width: 640, height: 480 });
    });

    it('downscales a wider drawing buffer to 800 wide', () => {
        expect(captureSize(1600, 900)).to.deep.equal({ width: 800, height: 450 });
        expect(captureSize(1001, 333)).to.deep.equal({ width: 800, height: 266 });
    });
});

describe('captureToCss', () => {
    it('is the identity when the image matches the CSS size', () => {
        const size = { width: 640, height: 480 };
        expect(captureToCss(320, 240, size, size)).to.deep.equal({ x: 320, y: 240 });
    });

    it('scales up a canvas wider than 800 CSS px', () => {
        // DPR 1, 1600x900 canvas: the centre shows at 400x225 in the 800x450 image
        const image = captureSize(1600, 900);
        expect(captureToCss(400, 225, image, { width: 1600, height: 900 })).to.deep.equal({ x: 800, y: 450 });
    });

    it('scales down when the device pixel ratio is above 1', () => {
        // DPR 2, 300x200 CSS canvas: 600x400 drawing buffer, captured at full size
        const image = captureSize(600, 400);
        expect(captureToCss(300, 200, image, { width: 300, height: 200 })).to.deep.equal({ x: 150, y: 100 });
    });

    it('handles a high device pixel ratio together with the downscale', () => {
        // DPR 2, 1000x500 CSS canvas: 2000x1000 drawing buffer, captured at 800x400
        const image = captureSize(2000, 1000);
        expect(captureToCss(400, 200, image, { width: 1000, height: 500 })).to.deep.equal({ x: 500, y: 250 });
    });

    it('leaves the point alone for an empty image', () => {
        expect(captureToCss(10, 20, { width: 0, height: 0 }, { width: 100, height: 100 })).to.deep.equal({
            x: 10,
            y: 20
        });
    });
});
