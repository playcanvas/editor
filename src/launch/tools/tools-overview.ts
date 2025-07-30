editor.once('load', () => {
    // variables
    const enabled = editor.call('tools:enabled');
    let events = [];
    let eventsIndex = { };

    // canvas
    const canvas = document.createElement('canvas');
    canvas.classList.add('overview');
    editor.call('tools:root').appendChild(canvas);

    // context
    const ctx = canvas.getContext('2d');
    ctx.font = '10px Arial';

    const render = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const now = editor.call('tools:time:now');
        const scrollTime = editor.call('tools:scroll:time');
        const capacity = editor.call('tools:time:capacity');
        ctx.textBaseline = 'alphabetic';

        const startX = scrollTime / now * canvas.width;
        const endX = (Math.min(now, scrollTime + capacity)) / now * canvas.width;

        // view rect
        ctx.beginPath();
        ctx.rect(startX, 0, endX - startX, canvas.height);
        ctx.fillStyle = '#303030';
        ctx.fill();
        // line bottom
        ctx.beginPath();
        ctx.moveTo(startX, canvas.height - 0.5);
        ctx.lineTo(endX, canvas.height - 0.5);
        ctx.strokeStyle = '#2c2c2c';
        ctx.stroke();

        // events
        let x, x2, e;
        for (let i = 0; i < events.length; i++) {
            e = events[i];
            x = e.t / now * canvas.width;

            if (events[i].t2 !== null) {
                let t2 = e.t2;
                if (e.t2 === -1) {
                    t2 = now;
                }

                x2 = Math.max(t2 / now * canvas.width, x + 1);

                ctx.beginPath();
                ctx.rect(x, Math.floor((canvas.height - 8) / 2), x2 - x, 8);
                ctx.fillStyle = editor.call('tools:timeline:color', e.k);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.moveTo(x, 1);
                ctx.lineTo(x, canvas.height - 1);
                ctx.strokeStyle = editor.call('tools:timeline:color', e.k);
                ctx.stroke();
            }
        }

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';

        // start/end text
        ctx.fillStyle = '#fff';
        // start time
        ctx.textAlign = 'left';
        ctx.strokeText('00:00.0 FPS', 2.5, canvas.height - 2.5);
        ctx.fillText('00:00.0 FPS', 2.5, canvas.height - 2.5);
        // now time
        ctx.textAlign = 'right';
        ctx.strokeText(editor.call('tools:time:toHuman', now, 1), canvas.width - 2.5, canvas.height - 2.5);
        ctx.fillText(editor.call('tools:time:toHuman', now, 1), canvas.width - 2.5, canvas.height - 2.5);

        let startTextWidth = 0;
        ctx.textBaseline = 'top';

        let text, measures, offset;

        // view start
        if (scrollTime > 0) {
            text = editor.call('tools:time:toHuman', scrollTime, 1);
            measures = ctx.measureText(text);
            offset = 2.5;
            if (startX + 2.5 + measures.width < endX - 2.5) {
                startTextWidth = measures.width;
                ctx.textAlign = 'left';
            } else {
                offset = -2.5;
                ctx.textAlign = 'right';
            }
            ctx.strokeText(text, startX + offset, 0);
            ctx.fillText(text, startX + offset, 0);
        }

        // view end
        if ((scrollTime + capacity) < now - 100) {
            text = editor.call('tools:time:toHuman', Math.min(now, scrollTime + capacity), 1);
            measures = ctx.measureText(text);
            offset = 2.5;
            if (endX - 2.5 - measures.width - startTextWidth > startX + 2.5) {
                ctx.textAlign = 'right';
                offset = -2.5;
            } else {
                ctx.textAlign = 'left';
            }
            ctx.strokeText(text, endX + offset, 0);
            ctx.fillText(text, endX + offset, 0);
        }

        ctx.lineWidth = 1;
    };

    // resize
    editor.on('tools:resize', (width, height) => {
        canvas.width = width - 300 - 32;
        canvas.height = 24;
        render();
    });
    canvas.width = editor.call('tools:size:width') - 300 - 32;
    canvas.height = 24;

    editor.on('tools:clear', () => {
        events = [];
        eventsIndex = { };
    });

    editor.on('tools:timeline:add', (item) => {
        let found = false;

        // check if can extend existing event
        for (let i = 0; i < events.length; i++) {
            if (events[i].t2 !== null && events[i].k === item.k && (events[i].t - 1) <= item.t && (events[i].t2 === -1 || (events[i].t2 + 1) >= item.t)) {
                found = true;
                events[i].t2 = item.t2;
                eventsIndex[item.i] = events[i];
                break;
            }
        }

        if (!found) {
            const obj = {
                i: item.i,
                t: item.t,
                t2: item.t2,
                k: item.k
            };
            events.push(obj);
            eventsIndex[obj.i] = obj;
        }
    });

    editor.on('tools:timeline:update', (item) => {
        if (!enabled || !eventsIndex[item.i]) {
            return;
        }

        eventsIndex[item.i].t2 = item.t2;
    });

    editor.on('tools:render', render);
});
