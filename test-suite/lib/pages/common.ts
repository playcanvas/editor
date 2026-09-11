import type { Locator, Page } from '@playwright/test';

export class EditorShell {
    constructor(readonly page: Page) {}

    async openLogoMenu(item: string | RegExp) {
        await this.page.locator('.pcui-element.font-regular.logo').click();
        await this.page.locator('.pcui-menu:not(.pcui-hidden) span').filter({ hasText: item }).first().click();
    }

    // a pcui MenuItem content holds two labels, the text then the shortcut, and a shortcut can
    // repeat the item name (Delete), so skip the shortcut label to keep the match single
    menuItem(text: string | RegExp) {
        const re = typeof text === 'string' ? new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) : text;
        return this.page.locator('.pcui-menu:not(.pcui-hidden) .pcui-menu-item-content > .pcui-label:not(.pcui-menu-item-shortcut)').filter({ hasText: re });
    }

    get confirm() {
        // the asset auditor overlay reuses the .picker-confirm class for styling, so
        // match the one that owns the yes/no buttons
        const root = this.page.locator('.picker-confirm:has(.yes)');
        return { root, text: root.locator('.text'), yes: root.locator('.yes'), no: root.locator('.no') };
    }

    // a pcui LabelGroup appends its label first, then the field, so the label is the
    // group's first child; matching a child (not any descendant) avoids hitting
    // labels rendered inside the field itself
    labelGroup(scope: Locator, label: string) {
        return scope.locator(`.pcui-label-group:has(> .pcui-label:text-is("${label}"))`);
    }

    history() {
        return this.page.evaluate(() => {
            const h = window.editor.api.globals.history;
            return { canUndo: h.canUndo, canRedo: h.canRedo, last: h.lastAction ? h.lastAction.name : null };
        });
    }

    async undo() {
        await this.page.keyboard.press('ControlOrMeta+Z');
    }

    async redo() {
        await this.page.keyboard.press('ControlOrMeta+Shift+Z');
    }
}
