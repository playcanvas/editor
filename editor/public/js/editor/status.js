editor.once('load', function() {
    'use strict';

    var jobs = { };
    var panel = editor.call('layout.statusBar');


    // status
    var status = new ui.Label({
        text: 'PlayCanvas'
    });
    status.renderChanges = false;
    status.class.add('status');
    panel.append(status);

    // progress
    var progress = new ui.Progress();
    progress.class.add('jobsProgress');
    panel.append(progress);

    // jobs
    var jobsCount = new ui.Label({
        text: '0'
    });
    jobsCount.renderChanges = false;
    jobsCount.class.add('jobsCount');
    panel.append(jobsCount);


    // status text
    editor.method('status:text', function(text) {
        status.text = text;
        status.class.remove('error');
    });


    // status error
    editor.method('status:error', function(text) {
        status.text = text;
        status.class.add('error');
    });



    // update jobs
    var updateJobs = function() {
        var count = Object.keys(jobs).length;
        jobsCount.text = count;

        if (count > 0) {
            var least = 1;
            for(var key in jobs) {
                if (jobs[key] < least)
                    least = jobs[key];
            }
            progress.progress = least;
            progress.class.add('active');
        } else {
            progress.class.remove('active');
            progress.progress = 1;
        }
    };

    // status job
    editor.method('status:job', function(id, value) {
        if (jobs.hasOwnProperty(id) && value === undefined) {
            delete jobs[id];
        } else {
            jobs[id] = value;
        }

        updateJobs();
    });
});
