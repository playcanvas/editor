import { Button, Container, TextInput } from '@playcanvas/pcui';

export type VcDialogOpts = {
    title: string;
    // html-free body lines; entity names are passed through bold()
    body: (string | { bold: string })[];
    confirmText: string;
    danger?: boolean;
    input?: { placeholder: string };
    // confirm disabled until input matches exactly (type-to-confirm)
    confirmMatch?: string;
    checkboxes?: { key: string; label: string; value?: boolean }[];
    onConfirm: (values: { input: string; checks: Record<string, boolean> }) => void;
    onCancel?: () => void;
};

export type VcDialogHandle = {
    close: () => void;
    setError: (msg: string) => void;
};

// only one dialog at a time; opening a new one cancels the previous
let activeDialog: VcDialogHandle = null;

// dialogs must render inside the project picker overlay or its
// outside-click handler dismisses the picker when a dialog is clicked
let dialogHost: Container = null;

export const setVcDialogHost = (host: Container) => {
    dialogHost = host;
};

export const showVcDialog = (opts: VcDialogOpts): VcDialogHandle => {
    activeDialog?.close();

    const overlay = new Container({ class: 'vc-dialog-overlay' });
    const dialog = new Container({ class: 'vc-dialog' });
    overlay.append(dialog);

    const hd = document.createElement('div');
    hd.classList.add('hd');
    if (opts.danger) {
        hd.classList.add('danger');
    }
    hd.textContent = opts.title;
    dialog.dom.appendChild(hd);

    const bd = document.createElement('div');
    bd.classList.add('bd');
    dialog.dom.appendChild(bd);

    for (const line of opts.body) {
        if (typeof line === 'string') {
            bd.appendChild(document.createTextNode(line));
        } else {
            const b = document.createElement('b');
            b.textContent = line.bold;
            bd.appendChild(b);
        }
    }

    let input: TextInput = null;
    if (opts.input) {
        // native placeholder; pcui's [placeholder] renders an out-of-place chip
        input = new TextInput({ keyChange: true, renderChanges: false });
        (input.dom.querySelector('input') as HTMLInputElement).placeholder = opts.input.placeholder;
        bd.appendChild(input.dom);
    }

    const checks: Record<string, boolean> = {};
    for (const c of opts.checkboxes ?? []) {
        checks[c.key] = !!c.value;
        // a <label> row so clicking the text toggles the native checkbox; the
        // checkbox shares the compare-list .check style (see %vc-checkbox)
        const row = document.createElement('label');
        row.classList.add('vc-dialog-check');
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.classList.add('check');
        box.checked = !!c.value;
        box.addEventListener('change', () => {
            checks[c.key] = box.checked;
        });
        row.appendChild(box);
        const label = document.createElement('span');
        label.classList.add('label');
        label.textContent = c.label;
        row.appendChild(label);
        bd.appendChild(row);
    }

    const error = document.createElement('div');
    error.classList.add('vc-dialog-error');
    error.hidden = true;
    bd.appendChild(error);

    const ft = document.createElement('div');
    ft.classList.add('ft');
    dialog.dom.appendChild(ft);

    const cancel = new Button({ text: 'Cancel' });
    ft.appendChild(cancel.dom);

    const confirm = new Button({ text: opts.confirmText, class: opts.danger ? ['confirm', 'danger'] : 'confirm' });
    ft.appendChild(confirm.dom);

    const updateConfirm = () => {
        // confirmMatch requires an input field; without one the gate is ignored
        confirm.enabled = !opts.confirmMatch || !input || input.value === opts.confirmMatch;
    };
    updateConfirm();
    if (input) {
        input.on('change', updateConfirm);
    }

    const close = () => {
        if (activeDialog === handle) {
            activeDialog = null;
        }
        document.removeEventListener('keydown', onKey, true);
        overlay.dom.removeEventListener('mousedown', onBackdrop);
        overlay.destroy();
    };

    const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            close();
            opts.onCancel?.();
        } else if (e.key === 'Enter' && confirm.enabled && document.activeElement?.tagName !== 'TEXTAREA') {
            e.stopPropagation();
            confirm.emit('click');
        }
    };
    document.addEventListener('keydown', onKey, true);

    cancel.on('click', () => {
        close();
        opts.onCancel?.();
    });

    confirm.on('click', () => {
        opts.onConfirm({ input: input ? input.value.trim() : '', checks });
    });

    // backdrop click cancels
    const onBackdrop = (e: MouseEvent) => {
        if (e.target === overlay.dom) {
            close();
            opts.onCancel?.();
        }
    };
    overlay.dom.addEventListener('mousedown', onBackdrop);

    (dialogHost ?? editor.call('layout.root')).append(overlay);

    if (input) {
        setTimeout(() => input.focus());
    }

    const handle = {
        close,
        setError: (msg: string) => {
            error.hidden = false;
            error.textContent = msg;
        }
    };
    activeDialog = handle;
    return handle;
};
