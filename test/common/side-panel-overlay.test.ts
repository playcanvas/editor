import type { Overlay } from '@playcanvas/pcui';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isSidePanelOverlayBackdrop } from '../../src/editor/pickers/side-panel-overlay';

describe('isSidePanelOverlayBackdrop', () => {
    it('only matches the overlay backdrop', () => {
        const inner = {};
        const panel = {};
        const overlay = {
            dom: {
                querySelector: () => inner
            }
        } as unknown as Overlay;

        expect(isSidePanelOverlayBackdrop(overlay, inner as EventTarget)).to.equal(true);
        expect(isSidePanelOverlayBackdrop(overlay, panel as EventTarget)).to.equal(false);
    });
});
