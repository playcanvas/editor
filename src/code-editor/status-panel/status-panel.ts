import { Label } from '@playcanvas/pcui';

editor.once('load', () => {
    const panel = editor.call('layout.statusBar');

    const branchName = new Label({
        class: 'branch-name',
        text: config.self.branch.name
    });
    panel.append(branchName);
    if (!editor.call('permissions:read')) {
        branchName.hidden = true;
    }
    editor.on('permissions:set', () => {
        branchName.hidden = !editor.call('permissions:read');
    });

    const label = new Label({
        class: 'status',
        text: 'Loading...'
    });
    panel.append(label);

    // connection status
    const connection = new Label({
        class: 'connection-status'
    });
    panel.append(connection);

    // if true then do not clear the errors
    let permanentError = false;

    editor.method('status:log', (msg: string) => {
        if (permanentError) {
            console.log(msg);
            return;
        }

        label.class.remove('error');
        label.class.remove('warning');
        label.text = msg;
    });

    editor.method('status:warning', (msg: string) => {
        if (permanentError) {
            console.warn(msg);
            return;
        }

        label.class.remove('error');
        label.class.add('warning');
        label.text = msg;
        console.warn(msg);
    });

    editor.method('status:error', (msg: string) => {
        label.class.add('error');
        label.class.remove('warning');
        label.text = msg;
        console.error(msg);
    });

    editor.method('status:permanentError', (msg: string) => {
        editor.call('status:error', msg);
        permanentError = true;
    });

    editor.method('status:clear', () => {
        editor.call('status:log', '');
    });

    // connection status
    editor.method('status:connection', (text: string) => {
        connection.text = text;
        connection.class.remove('error');
    });

    editor.method('status:connection:error', (text: string) => {
        connection.text = text;
        connection.class.add('error');
    });
});
