editor.once('load', function () {
    'use strict';

    const jobs = { };
    const panel = editor.call('layout.statusBar');

    // status
    const status = new pcui.Label();
    status.class.add('status');
    panel.append(status);

    // progress
    const progress = new pcui.Progress();
    progress.class.add('jobsProgress');
    panel.append(progress);

    // jobs
    const jobsCount = new pcui.Label({
        text: '0'
    });
    jobsCount.class.add('jobsCount');
    panel.append(jobsCount);


    // status text
    editor.method('status:text', function (text) {
        status.text = text;
        status.class.remove('error');
    });

    // status error
    editor.method('status:error', function (text) {
        status.text = text;
        status.class.add('error');
    });

    // status clear
    editor.method('status:clear', function () {
        status.text = '';
        status.class.remove('error');
    });

    // update jobs
    const updateJobs = function () {
        const count = Object.keys(jobs).length;
        jobsCount.text = count;

        if (count > 0) {
            let least = 1;
            for (const key in jobs) {
                if (jobs[key] < least)
                    least = jobs[key];
            }
            progress.value = least * 100;
            progress.class.add('active');
        } else {
            progress.class.remove('active');
            progress.value = 100;
        }
    };

    // status job
    editor.method('status:job', function (id, value) {
        if (jobs.hasOwnProperty(id) && value === undefined) {
            delete jobs[id];
        } else {
            jobs[id] = value;
        }

        updateJobs();
    });

    editor.jobs.on('start', (id) => {
        editor.call('status:job', id, 1);
    });

    editor.jobs.on('finish', (id) => {
        editor.call('status:job', id);
    });
});
