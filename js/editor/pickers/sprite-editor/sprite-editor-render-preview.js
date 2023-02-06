editor.once('load', function () {
    const centerPivot = [0.5, 0.5];

    // Renders a frame to the canvas taking into account the size of all the specified frames
    // to determine aspect ratio.
    // - frame: The frame index to render
    // - canvas: The canvas where the preview will be rendered
    // - allFrames: All the frames relevant to this render
    // - animating: If true then the frames pivot will be used otherwise everything will be rendered as if centered
    editor.method('picker:sprites:renderFramePreview', function (frame, canvas, allFrames, animating) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        if (!frame || !frame.pivot || !frame.rect) {
            return;
        }

        const atlasImage = editor.call('picker:sprites:atlasImage');
        if (!atlasImage) return;

        const x = frame.rect[0];
        // convert bottom left WebGL coord to top left pixel coord
        const y = atlasImage.height - frame.rect[1] - frame.rect[3];
        const w = frame.rect[2];
        const h = frame.rect[3];

        // choose targetWidth and targetHeight keeping the aspect ratio
        let targetWidth = width;
        let targetHeight = height;
        let offsetX = 0;
        let offsetY = 0;

        if (allFrames) {
            let maxHeight = 0;
            let maxWidth = 0;
            let leftBound = Number.POSITIVE_INFINITY;
            let rightBound = Number.NEGATIVE_INFINITY;
            let bottomBound = Number.POSITIVE_INFINITY;
            let topBound = Number.NEGATIVE_INFINITY;
            for (let i = 0, len = allFrames.length; i < len; i++) {
                let f = allFrames[i];
                if (!f) continue;

                if (f._data)
                    f = f._data;

                const pivot = animating ? f.pivot : centerPivot;

                const left = -f.rect[2] * pivot[0];
                const right = (1 - pivot[0]) * f.rect[2];
                const bottom = -f.rect[3] * pivot[1];
                const top = (1 - pivot[1]) * f.rect[3];

                leftBound = Math.min(leftBound, left);
                rightBound = Math.max(rightBound, right);
                bottomBound = Math.min(bottomBound, bottom);
                topBound = Math.max(topBound, top);
            }

            maxWidth = rightBound - leftBound;
            maxHeight = topBound - bottomBound;

            let widthFactor = width;
            let heightFactor = height;

            const canvasRatio = width / height;
            const aspectRatio = maxWidth / maxHeight;

            // resize all frames based on aspect ratio of all frames
            // together
            if (canvasRatio > aspectRatio) {
                widthFactor = height * aspectRatio;
            } else {
                heightFactor = width / aspectRatio;
            }

            // calculate x and width
            const pivot = animating ? frame.pivot : centerPivot;
            const left = -frame.rect[2] * pivot[0];
            offsetX = widthFactor * (left - leftBound) / maxWidth;
            targetWidth = widthFactor * frame.rect[2] / maxWidth;

            // calculate y and height
            const top = (1 - pivot[1]) * frame.rect[3];
            offsetY = heightFactor * (1 - (top - bottomBound) / maxHeight);
            targetHeight = heightFactor * frame.rect[3] / maxHeight;

            // center it
            offsetX += (width - widthFactor) / 2;
            offsetY += (height - heightFactor) / 2;
        } else {
            const aspectRatio = w / h;

            if (aspectRatio >= 1) {
                targetHeight = width / aspectRatio;
            } else {
                targetWidth = height * aspectRatio;
            }

            offsetX = (width - targetWidth) / 2;
            offsetY = (height - targetHeight) / 2;
        }


        // disable smoothing
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(atlasImage, x, y, w, h, offsetX, offsetY, targetWidth, targetHeight);
    });
});
