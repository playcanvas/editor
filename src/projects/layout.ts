import { Container } from '@playcanvas/pcui';

import { Tooltip } from '@/common/pcui/element/element-tooltip';

// the projects home page: one full-page root for the projects page and its dialogs, and the shared tooltip
editor.once('load', () => {
    const root = new Container({ id: 'layout-root', isRoot: true });
    document.body.appendChild(root.dom);
    editor.method('layout.root', () => root);

    const tooltip = new Tooltip({ id: 'layout-tooltip' });
    root.append(tooltip);
    editor.method('layout.tooltip', () => tooltip);
});
