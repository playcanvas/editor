editor.once('load', () => {
    const reports = new Map<string, { issues: number, errors: number }>();

    const emit = () => {
        let issues = 0;
        let errors = 0;
        for (const r of reports.values()) {
            issues += r.issues;
            errors += r.errors;
        }
        editor.emit('assets:auditor:issues', issues, errors);
    };

    editor.method('assets:auditor:report', (name: string, issues: number, errors: number) => {
        reports.set(name, { issues, errors });
        emit();
    });
});
