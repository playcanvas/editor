// runtime screenshots are downscaled to at most this width to keep payloads small
const CAPTURE_MAX_WIDTH = 800;

/**
 * Size of a runtime screenshot of a canvas: its drawing buffer, downscaled to at most
 * {@link CAPTURE_MAX_WIDTH} wide.
 *
 * @param width - The canvas drawing buffer width (device pixels).
 * @param height - The canvas drawing buffer height (device pixels).
 * @returns The screenshot size.
 */
const captureSize = (width: number, height: number) => {
    if (width <= CAPTURE_MAX_WIDTH) {
        return { width, height };
    }
    return { width: CAPTURE_MAX_WIDTH, height: Math.round(height * (CAPTURE_MAX_WIDTH / width)) };
};

/**
 * Convert a point on a runtime screenshot to CSS pixels from the canvas top-left, the space
 * input events are dispatched in. The screenshot is taken from the drawing buffer, so it differs
 * from the CSS size whenever the device pixel ratio isn't 1 or the canvas was downscaled.
 *
 * @param x - The x coordinate on the screenshot.
 * @param y - The y coordinate on the screenshot.
 * @param image - The screenshot size.
 * @param image.width - The screenshot width.
 * @param image.height - The screenshot height.
 * @param css - The canvas CSS size.
 * @param css.width - The canvas CSS width.
 * @param css.height - The canvas CSS height.
 * @returns The point in CSS pixels.
 */
const captureToCss = (
    x: number,
    y: number,
    image: { width: number; height: number },
    css: { width: number; height: number }
) => ({
    x: image.width ? (x * css.width) / image.width : x,
    y: image.height ? (y * css.height) / image.height : y
});

export { CAPTURE_MAX_WIDTH, captureSize, captureToCss };
