import type { Overlay } from '@playcanvas/pcui';

const CLASS_OVERLAY_INNER = '.pcui-overlay-inner';

const isSidePanelOverlayBackdrop = (overlay: Overlay, target: EventTarget | null) => {
    return target === overlay.dom || target === overlay.dom.querySelector(CLASS_OVERLAY_INNER);
};

const addSidePanelOverlayClose = (overlay: Overlay) => {
    overlay.clickable = false;
    overlay.dom.addEventListener('pointerdown', (evt) => {
        if (!isSidePanelOverlayBackdrop(overlay, evt.target)) {
            return;
        }

        document.body.blur();
        requestAnimationFrame(() => {
            overlay.hidden = true;
        });
        evt.preventDefault();
        evt.stopPropagation();
    });
};

export { addSidePanelOverlayClose, isSidePanelOverlayBackdrop };
