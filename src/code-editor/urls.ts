editor.once('load', () => {

    // Update url with new tab order
    const updateUrl = function () {

        const tabs = editor.call('tabs:list');
        let str = '';
        let comma = '';
        for (let i = 0, len = tabs.length; i < len; i++) {
            if (tabs[i].asset) {
                str += comma + tabs[i].id;
                comma = ',';
            }
        }

        let url = `/editor/code/${config.project.id}`;

        const query = [];
        const params = new URLSearchParams(location.search);
        if (str) {
            query.push(`tabs=${str}`);
        }
        const focusedTab = editor.call('tabs:focused');
        if (focusedTab) {
            query.push(`focused=${focusedTab.id}`);
        }
        if (params.has('v2')) {
            query.push('v2');
        }
        if (params.has('version')) {
            query.push('version');
        }
        if (params.has('use_local_frontend')) {
            query.push('use_local_frontend');
        }
        if (params.has('use_local_engine')) {
            query.push(`use_local_engine=${params.get('use_local_engine')}`);
        }

        url += `?${query.join('&')}`;

        window.history.replaceState('', '', url);
    };

    let timeout;
    const deferredUpdate = function (tab) {
        if (!tab.asset) return;
        clearTimeout(timeout);
        timeout = setTimeout(updateUrl);
    };

    editor.on('tabs:open', deferredUpdate);
    editor.on('tabs:close', deferredUpdate);
    editor.on('tabs:reorder', deferredUpdate);
    editor.on('tabs:focus', deferredUpdate);

    // Select tabs when ready
    const focusedParam = new URLSearchParams(window.location.search).get('focused');
    const focusedAssetId = focusedParam && config.tabs.includes(parseInt(focusedParam, 10)) ?
        focusedParam :
        config.tabs[config.tabs.length - 1];

    config.tabs.forEach(tab => editor.call('integration:selectWhenReady', tab));

    editor.call('integration:selectWhenReady', focusedAssetId, window.config.file);
});
