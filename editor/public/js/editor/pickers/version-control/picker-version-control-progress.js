editor.once('load', function () {
    'use strict';

    editor.method('picker:versioncontrol:createProgressWidget', function (args) {
        var panel = new ui.Panel();
        panel.class.add('progress-widget');

        // message
        var labelMessage = new ui.Label({
            text: args.progressText
        });
        labelMessage.renderChanges = false;
        panel.append(labelMessage);

        // note
        var labelNote = new ui.Label();
        labelNote.class.add('note');
        labelNote.renderChanges = false;
        panel.append(labelNote);

        // spinner svg
        var spinner = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        spinner.classList.add('spin');
        spinner.setAttribute('width', 65);
        spinner.setAttribute('height', 65);
        spinner.setAttribute('x', 0);
        spinner.setAttribute('y', 0);
        spinner.setAttribute('viewBox', '0 0 64 64');
        spinner.innerHTML = '<g width="65" height="65"><path fill="#773417" d="M32,60 C47.463973,60 60,47.463973 60,32 C60,16.536027 47.463973,4 32,4 C16.536027,4 4,16.536027 4,32 C4,47.463973 16.536027,60 32,60 Z M32,64 C14.326888,64 0,49.673112 0,32 C0,14.326888 14.326888,0 32,0 C49.673112,0 64,14.326888 64,32 C64,49.673112 49.673112,64 32,64 Z"></path><path class="spin" fill="#FF6600" d="M62.3041668,42.3124142 C58.1809687,54.9535127 46.0037894,64 32,64 L32,60.0514995 C44.0345452,60.0514995 54.8533306,51.9951081 58.5660922,41.0051114 L62.3041668,42.3124142 Z"></path></g>';
        panel.innerElement.appendChild(spinner);

        // completed svg
        var completed = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        completed.setAttribute('width', 65);
        completed.setAttribute('height', 65);
        completed.setAttribute('x', 0);
        completed.setAttribute('y', 0);
        completed.setAttribute('viewBox', '0 0 65 65');
        completed.innerHTML = '<defs><path id="playcanvas-spinner-complete-a" d="M55.6576027,9.34239734 C58.6394896,12.564759 60.9420008,16.1598026 62.5652053,20.127636 C64.1884099,24.0954693 65,28.2195494 65,32.5 C65,36.7804506 64.1884099,40.9045307 62.5652053,44.872364 C60.9420008,48.8401974 58.6394896,52.435241 55.6576027,55.6576027 C52.435241,58.6394896 48.8401974,60.9420008 44.872364,62.5652053 C40.9045307,64.1884099 36.7804506,65 32.5,65 C28.2195494,65 24.0954693,64.1884099 20.127636,62.5652053 C16.1598026,60.9420008 12.564759,58.6394896 9.34239734,55.6576027 C6.28836801,52.483336 3.96782148,48.9183513 2.38068812,44.9625416 C0.793554772,41.006732 0,36.852593 0,32.5 C0,28.147407 0.793554772,23.993268 2.38068812,20.0374584 C3.96782148,16.0816487 6.28836801,12.516664 9.34239734,9.34239734 C12.564759,6.36051043 16.1598026,4.05799924 20.127636,2.43479467 C24.0954693,0.811590108 28.2195494,0 32.5,0 C36.7804506,0 40.9045307,0.811590108 44.872364,2.43479467 C48.8401974,4.05799924 52.435241,6.36051043 55.6576027,9.34239734 Z M32.5,61.953125 C37.8388067,61.953125 42.7668619,60.6376936 47.2843137,58.0067913 C51.8017655,55.3758889 55.3758889,51.8017655 58.0067913,47.2843137 C60.6376936,42.7668619 61.953125,37.8388067 61.953125,32.5 C61.953125,27.1611933 60.6376936,22.2331381 58.0067913,17.7156863 C55.3758889,13.1982345 51.8017655,9.62411106 47.2843137,6.99320874 C42.7668619,4.36230643 37.8388067,3.046875 32.5,3.046875 C27.1611933,3.046875 22.2331381,4.36230643 17.7156863,6.99320874 C13.1982345,9.62411106 9.62411106,13.1982345 6.99320874,17.7156863 C4.36230643,22.2331381 3.046875,27.1611933 3.046875,32.5 C3.046875,37.8388067 4.36230643,42.7668619 6.99320874,47.2843137 C9.62411106,51.8017655 13.1982345,55.3758889 17.7156863,58.0067913 C22.2331381,60.6376936 27.1611933,61.953125 32.5,61.953125 Z M47.7580466,26.5843507 L28.063263,46.0627081 L16.0155383,33.9789123 L19.1424459,30.8520047 L28.063263,39.7728219 L44.3786418,23.4574431 L47.7580466,26.5843507 Z"/></defs><g fill="none" fill-rule="evenodd"><use fill="#F60" xlink:href="#playcanvas-spinner-complete-a"/></g>';
        panel.innerElement.appendChild(completed);
        completed.classList.add('hidden');

        // error svg
        var error = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        error.setAttribute('width', 65);
        error.setAttribute('height', 65);
        error.setAttribute('x', 0);
        error.setAttribute('y', 0);
        error.setAttribute('viewBox', '0 0 65 65');
        error.innerHTML = '<defs><path id="playcanvas-spinner-error-a" d="M55.6576027,9.34239734 C58.6394896,12.564759 60.9420008,16.1598026 62.5652053,20.127636 C64.1884099,24.0954693 65,28.2195494 65,32.5 C65,36.7804506 64.1884099,40.9045307 62.5652053,44.872364 C60.9420008,48.8401974 58.6394896,52.435241 55.6576027,55.6576027 C52.435241,58.6394896 48.8401974,60.9420008 44.872364,62.5652053 C40.9045307,64.1884099 36.7804506,65 32.5,65 C28.2195494,65 24.0954693,64.1884099 20.127636,62.5652053 C16.1598026,60.9420008 12.564759,58.6394896 9.34239734,55.6576027 C6.28836801,52.483336 3.96782148,48.9183513 2.38068812,44.9625416 C0.793554772,41.006732 0,36.852593 0,32.5 C0,28.147407 0.793554772,23.993268 2.38068812,20.0374584 C3.96782148,16.0816487 6.28836801,12.516664 9.34239734,9.34239734 C12.564759,6.36051043 16.1598026,4.05799924 20.127636,2.43479467 C24.0954693,0.811590108 28.2195494,0 32.5,0 C36.7804506,0 40.9045307,0.811590108 44.872364,2.43479467 C48.8401974,4.05799924 52.435241,6.36051043 55.6576027,9.34239734 Z M32.5,61.953125 C37.8388067,61.953125 42.7668619,60.6376936 47.2843137,58.0067913 C51.8017655,55.3758889 55.3758889,51.8017655 58.0067913,47.2843137 C60.6376936,42.7668619 61.953125,37.8388067 61.953125,32.5 C61.953125,27.1611933 60.6376936,22.2331381 58.0067913,17.7156863 C55.3758889,13.1982345 51.8017655,9.62411106 47.2843137,6.99320874 C42.7668619,4.36230643 37.8388067,3.046875 32.5,3.046875 C27.1611933,3.046875 22.2331381,4.36230643 17.7156863,6.99320874 C13.1982345,9.62411106 9.62411106,13.1982345 6.99320874,17.7156863 C4.36230643,22.2331381 3.046875,27.1611933 3.046875,32.5 C3.046875,37.8388067 4.36230643,42.7668619 6.99320874,47.2843137 C9.62411106,51.8017655 13.1982345,55.3758889 17.7156863,58.0067913 C22.2331381,60.6376936 27.1611933,61.953125 32.5,61.953125 Z M35.5816525,32.2391268 L43.7840074,40.4684849 L40.6947836,43.605265 L32.3920037,35.3937245 L24.0892238,43.605265 L21,40.4684849 L29.2023549,32.2391268 L21,24.1269076 L24.3794048,21 L32.3920037,29.0389773 L40.4046026,21 L43.7840074,24.1269076 L35.5816525,32.2391268 Z"/></defs><g fill="none" fill-rule="evenodd"><use fill="#fb222f" xlink:href="#playcanvas-spinner-error-a"/></g>';
        panel.innerElement.appendChild(error);
        error.classList.add('hidden');

        // Call this when the asynchronous action is finished
        panel.finish = function (err) {
            if (err) {
                panel.setMessage(args.errorText);
                panel.setNote(err);
                error.classList.remove('hidden');
            } else {
                panel.setMessage(args.finishText);
                panel.setNote('');
                completed.classList.remove('hidden');
            } 
            spinner.classList.add('hidden');
        };

        panel.setMessage = function (text) {
            labelMessage.text = text;
        };

        panel.setNote = function (text) {
            labelNote.text = text;
            labelNote.hidden = !text;
        };

        // restore panel contents when the panel is hidden
        panel.on('hide', function () {
            labelMessage.text = args.progressText;
            labelNote.hidden = true;
            completed.classList.add('hidden');
            error.classList.add('hidden');
            spinner.classList.remove('hidden');
        });

        return panel;
    });
});