import { Ajax } from '../../common/ajax.js';

editor.once('load', () => {
    editor.method('assets:paste', function (parentFolder, keepFolderStructure, callback) {
        if (!editor.call('permissions:write')) return;

        const clipboard = editor.call('clipboard');
        const value = clipboard.value;
        if (!value) return;
        if (value.type !== 'asset') return;

        const data = {
            projectId: value.projectId,
            branchId: value.branchId,
            targetProjectId: config.project.id,
            targetBranchId: config.self.branch.id,
            keepFolderStructure: !!keepFolderStructure,
            assets: value.assets.slice()
        };

        if (parentFolder) {
            data.targetFolderId = parentFolder.get('id');
        }

        const now = Date.now();
        editor.call('status:text', 'Pasting assets...');
        editor.call('status:job', 'asset-paste:' + now, 1);

        Ajax({
            url: '{{url.api}}/assets/paste',
            auth: true,
            method: 'POST',
            data: data
        })
        .on('load', (status, data) => {
            if (status === 201) {
                editor.call('status:text', `${data.result.length} asset${data.result.length > 1 ? 's' : ''} created`);
            } else {
                editor.call('status:clear');
            }
            editor.call('status:job', 'asset-paste:' + now);
            if (callback) {
                callback(null, data);
            }

            // TODO: should we clear the clipboard?
            // if (clipboard.value === value) {
            //     clipboard.value = null;
            // }
        })
        .on('error', (status, data) => {
            editor.call('status:error', 'Error while pasting assets');
            editor.call('status:job', 'asset-paste:' + now);
            if (callback) {
                callback(data);
            }
        });
    });

});
