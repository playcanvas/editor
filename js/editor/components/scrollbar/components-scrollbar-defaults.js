editor.once('load', function () {
    'use strict';

    var DEFAULT_THICKNESS = 20;
    var DEFAULT_LENGTH = 100;

    editor.method('components:scrollbar:getContainerElementDefaultsForOrientation', function (orientation) {
        switch (orientation) {
            case ORIENTATION_VERTICAL:
                return {
                    anchor: [1, 0, 1, 1],
                    pivot: [1, 1],
                    margin: [0, DEFAULT_THICKNESS, 0, 0],
                    width: DEFAULT_THICKNESS,
                    height: DEFAULT_LENGTH,
                    color: [0.5, 0.5, 0.5]
                };

            case ORIENTATION_HORIZONTAL:
                return {
                    anchor: [0, 0, 1, 0],
                    pivot: [0, 0],
                    margin: [0, 0, DEFAULT_THICKNESS, 0],
                    width: DEFAULT_LENGTH,
                    height: DEFAULT_THICKNESS,
                    color: [0.5, 0.5, 0.5]
                };
        }
    });

    editor.method('components:scrollbar:getHandleElementDefaultsForOrientation', function (orientation) {
        switch (orientation) {
            case ORIENTATION_VERTICAL:
                return {
                    anchor: [0, 1, 1, 1],
                    pivot: [1, 1],
                    margin: [0, 0, 0, 0],
                    width: DEFAULT_THICKNESS
                };

            case ORIENTATION_HORIZONTAL:
                return {
                    anchor: [0, 0, 0, 1],
                    pivot: [0, 0],
                    margin: [0, 0, 0, 0],
                    height: DEFAULT_THICKNESS
                };
        }
    });
});
