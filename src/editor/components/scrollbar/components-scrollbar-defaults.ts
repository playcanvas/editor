import { ORIENTATION_VERTICAL, ORIENTATION_HORIZONTAL } from '@/core/constants';

editor.once('load', () => {
    const DEFAULT_THICKNESS = 20;
    const DEFAULT_LENGTH = 100;

    editor.method('components:scrollbar:getContainerElementDefaultsForOrientation', (orientation: number) => {
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

    editor.method('components:scrollbar:getHandleElementDefaultsForOrientation', (orientation: number) => {
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
