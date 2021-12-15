editor.once('load', function () {
    'use strict';

    if (!editor.call('users:hasFlag', 'hasFixCorruptedTemplates')) return;
    if (!editor.call('permissions:write')) return;

    const STATE_START = 1;
    const STATE_FINDING_ISSUES = 2;
    const STATE_FOUND_ISSUES = 3;
    const STATE_MIGRATING = 4;
    const STATE_END = 5;
    const STATE_ERROR = 100;

    const overlay = new pcui.Overlay({
        class: 'picker-fix-templates',
        hidden: true
    });

    editor.call('layout.root').append(overlay);

    const header = new pcui.Container({
        flex: true,
        flexDirection: 'row',
        class: 'header'
    });
    overlay.append(header);

    const icon = new pcui.Label({
        class: 'icon',
        text: '&#57880;',
        unsafe: true
    });
    header.append(icon);

    const title = new pcui.Label({
        text: 'ISSUES WITH TEMPLATES'
    });
    header.append(title);

    const text = new pcui.Label({
        unsafe: true,
        text: '<p>We identified some template instances with invalid data. These might cause further issues as you continue development if not fixed.</p>' +
              '<p>Please see <a href="https://forum.playcanvas.com/t/draft-corruption-of-template-instances-please-read/23265" target="_blank">this post</a> for more information.</p>' +
              '<p>We will need to modify these templates instances but this will mean that some entities in your scene will lose their template connection. Click CANCEL to continue without any modifications or click PROCEED and follow the instructions in the following screens.</p>'
    });

    overlay.append(text);

    const containerButtons = new pcui.Container({
        flex: true,
        class: 'buttons',
        flexDirection: 'row'
    });
    overlay.append(containerButtons);

    const btnCancel = new pcui.Button({
        text: 'CANCEL',
        class: 'cancel'
    });
    btnCancel.style.marginLeft = 'auto';
    containerButtons.append(btnCancel);

    const btnConfirm = new pcui.Button({
        text: 'PROCEED'
    });
    containerButtons.append(btnConfirm);

    const overlayFullScreen = new pcui.Overlay({
        class: 'picker-fix-templates-fullscreen',
        hidden: true
    });
    editor.call('layout.root').append(overlayFullScreen);

    const content = new pcui.Container({
        flex: true
    });
    content.style.alignItems = 'center';
    content.style.justifyContent = 'center';
    overlayFullScreen.append(content);

    let report = null;

    function downloadReport(title) {
        if (!report) return;

        const blob = new Blob([JSON.stringify(report, null, 4)], { type: 'application/json' });
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = URL.createObjectURL(blob);
        a.download = title + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    const progressText = new pcui.Label({
        unsafe: true
    });
    content.append(progressText);
    editor.on('picker:fixCorruptedTemplates:progress', text => {
        progressText.text = text;
    });

    const spinner = new pcui.Spinner({
        size: 64,
        hidden: true
    });
    content.append(spinner);

    const progressButtons = new pcui.Container({
        flex: true,
        flexDirection: 'row'
    });
    progressButtons.style.justifyContent = 'center';
    content.append(progressButtons);

    let currentState = null;
    function setState(state, data) {
        if (currentState === state) return;

        currentState = state;

        if (currentState === STATE_START) {
            progressText.text = 'Please click the button to identify all of the issues first. No changes will be made.';
            spinner.hidden = true;
            btnFindIssues.hidden = false;
            btnProceedWithMigration.hidden = true;
            btnReport.hidden = true;
            btnCancelMigration.hidden = true;
        } else if (currentState === STATE_FINDING_ISSUES) {
            progressText.text = 'Finding issues...';
            spinner.hidden = false;
            btnFindIssues.enabled = false;
            btnProceedWithMigration.hidden = true;
            btnReport.hidden = true;
            btnCancelMigration.hidden = true;
        } else if (currentState === STATE_FOUND_ISSUES) {
            progressText.text = '<p>Issues found. Please click DOWNLOAD REPORT to download a report of all the issues.</p><p>Click CREATE CHECKPOINT AND MIGRATE to begin the process or click CANCEL to stop.</p>';
            spinner.hidden = true;
            btnFindIssues.hidden = true;
            btnReport.hidden = false;
            btnProceedWithMigration.hidden = false;
            btnCancelMigration.hidden = false;
        } else if (currentState === STATE_MIGRATING) {
            spinner.hidden = false;
            btnFindIssues.hidden = true;
            btnReport.hidden = true;
            btnProceedWithMigration.hidden = true;
            btnCancelMigration.hidden = true;
        } else if (currentState === STATE_END) {
            progressText.text = 'Migration complete. Please click the button to download a report and refresh the Editor.';
            spinner.hidden = true;
            btnFindIssues.hidden = true;
            btnReport.hidden = false;
            btnProceedWithMigration.hidden = true;
            btnCancelMigration.hidden = true;
        } else if (currentState === STATE_ERROR) {
            progressText.text = '<span style="color: #fb222f">Error: </span>' + data;
            spinner.hidden = true;
            progressButtons.hidden = true;
        }
    }

    const btnFindIssues = new pcui.Button({
        text: 'FIND ISSUES'
    });
    progressButtons.append(btnFindIssues);
    btnFindIssues.on('click', () => {
        setState(STATE_FINDING_ISSUES);
        editor.emit('picker:fixCorruptedTemplates:findIssues');
    });

    const btnReport = new pcui.Button({
        text: 'DOWNLOAD REPORT',
        hidden: true
    });
    progressButtons.append(btnReport);

    btnReport.on('click', () => {
        const title = (currentState === STATE_FOUND_ISSUES ? 'issues' : 'migration-report');
        downloadReport(title);
    });

    const btnProceedWithMigration = new pcui.Button({
        text: 'CREATE CHECKPOINT AND MIGRATE',
        hidden: true
    });
    progressButtons.append(btnProceedWithMigration);
    btnProceedWithMigration.on('click', () => {
        setState(STATE_MIGRATING);

        // take checkpoint
        progressText.text = 'Creating checkpoint...';
        editor.call('checkpoints:create', config.self.branch.id, `Checkpoint before executing corrupted templates migration in branch '${config.self.branch.name}'`, (err) => {
            if (err) {
                setState(STATE_ERROR, err);
                return;
            }

            progressText.text = 'Migrating...';
            editor.emit('picker:fixCorruptedTemplates:confirm');
        });
    });

    const btnCancelMigration = new pcui.Button({
        text: 'CANCEL',
        class: 'cancel',
        hidden: true
    });
    progressButtons.append(btnCancelMigration);
    btnCancelMigration.on('click', () => {
        window.location.reload();
    });

    setState(STATE_START);

    editor.on('editor:fixCorruptedTemplates:end', result => {
        report = result;
        if (currentState === STATE_FINDING_ISSUES) {
            setState(STATE_FOUND_ISSUES);
        } else if (currentState === STATE_MIGRATING) {
            setState(STATE_END);
        }
    });

    editor.on('editor:fixCorruptedTemplates:error', error => {
        setState(STATE_ERROR, error);
    });

    btnCancel.on('click', () => {
        editor.emit('picker:fixCorruptedTemplates:cancel');
        overlay.hidden = true;
    });

    btnConfirm.on('click', () => {
        overlayFullScreen.hidden = false;
        overlay.hidden = true;
    });

    overlay.on('show', () => {
        editor.emit('picker:open', 'fix-templates');
    });
    overlayFullScreen.on('show', () => {
        editor.emit('picker:open', 'fix-templates-progress');
    });

    overlay.on('hide', () => {
        editor.emit('picker:close', 'fix-templates');
    });
    overlayFullScreen.on('hide', () => {
        editor.emit('picker:close', 'fix-templates-progress');
    });

    editor.method('picker:fixCorruptedTemplates', () => {
        overlay.hidden = false;
    });
});
