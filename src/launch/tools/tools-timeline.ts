editor.once('load', () => {
    // variables
    let enabled = editor.call('tools:enabled');
    let counter = 0;
    let scale = 0.2;
    let events = [];
    let cacheAssetLoading = { };
    let cacheShaderCompile = [];
    let cacheShaderCompileEvents = [];
    let cacheLightmapper = null;
    let cacheLightmapperEvent = null;
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    // canvas
    const canvas = document.createElement('canvas');
    canvas.classList.add('timeline');
    editor.call('tools:root').appendChild(canvas);

    // context
    const ctx = canvas.getContext('2d');

    // colors for different kinds of events
    const kindColors = {
        '': '#ff0',
        'asset': '#6f6',
        'shader': '#f60',
        'update': '#06f',
        'render': '#07f',
        'physics': '#0ff',
        'lightmap': '#f6f'
    };
    const kindColorsOverview = {
        '': '#ff0',
        'asset': '#6f6',
        'shader': '#f60',
        'update': '#06f',
        'render': '#07f',
        'physics': '#0ff',
        'lightmap': '#f6f'
    };

    const render = function () {
        let i;
        let x;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barMargin = 1;
        const barHeight = 8;
        const stack = [];
        const scaleMs = 1000 * scale;
        const now = editor.call('tools:time:now');
        const scrollTime = editor.call('tools:scroll:time');
        const timeHover = editor.call('tools:time:hover');
        ctx.textBaseline = 'alphabetic';

        // grid
        const secondsX = Math.floor(canvas.width * scale);
        ctx.strokeStyle = '#2c2c2c';
        ctx.fillStyle = '#989898';
        const offset = scaleMs - ((scrollTime * scale) % scaleMs) - scaleMs;
        for (x = 0; x <= secondsX; x++) {
            const barX = Math.floor(x * scaleMs + offset) + 0.5;
            if (x > 0) {
                ctx.beginPath();
                ctx.moveTo(barX, 0);
                ctx.lineTo(barX, canvas.height);
                ctx.stroke();
            }

            let s = Math.floor(x + (scrollTime / 1000));
            const m = Math.floor(s / 60);
            s %= 60;
            ctx.fillText(`${(m ? `${m}m ` : '') + s}s`, barX + 2.5, canvas.height - 2.5);
        }

        // events
        let e, x2 = 0, y;
        x = 0;
        for (i = 0; i < events.length; i++) {
            e = events[i];
            x = Math.floor((e.t - scrollTime) * scale);

            if (x > canvas.width) {
                break;
            }

            // time
            if (e.t2 !== null) {
                if (isNaN(e.t2)) {
                    console.log(e);
                    continue;
                }
                // range
                let t2 = e.t2 - scrollTime;
                if (e.t2 === -1) {
                    t2 = now - scrollTime;
                }


                x2 = Math.max(Math.floor(t2 * scale), x + 1);

                if (x2 < 0) {
                    continue;
                }

                y = 0;
                let foundY = false;
                for (let n = 0; n < stack.length; n++) {
                    if (stack[n] < e.t) {
                        stack[n] = t2 + scrollTime;
                        y = n * (barHeight + barMargin);
                        foundY = true;
                        break;
                    }
                }
                if (!foundY) {
                    y = stack.length * (barHeight + barMargin);
                    stack.push(t2 + scrollTime);
                }

                ctx.beginPath();
                ctx.rect(x + 0.5, y + 1, x2 - x + 0.5, barHeight);
                ctx.fillStyle = kindColors[e.k] || '#fff';
                ctx.fill();
            } else {
                if (x < 0) {
                    continue;
                }

                // single event
                ctx.beginPath();
                ctx.moveTo(x + 0.5, 1);
                ctx.lineTo(x + 0.5, canvas.height - 1);
                ctx.strokeStyle = kindColors[e.k] || '#fff';
                ctx.stroke();
            }
        }

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        for (i = 0; i < events.length; i++) {
            e = events[i];
            x = Math.floor((e.t - scrollTime) * scale);

            if (x > canvas.width) {
                break;
            }

            if (e.t2 !== null || x < 0) {
                continue;
            }

            // name
            if (e.n) {
                ctx.fillStyle = kindColors[e.k] || '#fff';
                ctx.strokeText(e.n, x + 2.5, canvas.height - 12.5);
                ctx.strokeText(`${(e.t / 1000).toFixed(2)}s`, x + 2.5, canvas.height - 2.5);
                ctx.fillText(e.n, x + 2.5, canvas.height - 12.5);
                ctx.fillText(`${(e.t / 1000).toFixed(2)}s`, x + 2.5, canvas.height - 2.5);
            }
        }
        ctx.lineWidth = 1;

        // now
        ctx.beginPath();
        ctx.moveTo(Math.floor((now - scrollTime) * scale) + 0.5, 0);
        ctx.lineTo(Math.floor((now - scrollTime) * scale) + 0.5, canvas.height);
        ctx.strokeStyle = '#989898';
        ctx.stroke();

        // hover
        if (timeHover > 0) {
            x = (timeHover - scrollTime) * scale;
            ctx.beginPath();
            ctx.moveTo(Math.floor(x) + 0.5, 0);
            ctx.lineTo(Math.floor(x) + 0.5, canvas.height);
            ctx.strokeStyle = '#989898';
            ctx.stroke();

            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000';
            ctx.fillStyle = '#fff';
            ctx.strokeText(`${(timeHover / 1000).toFixed(1)}s`, Math.floor(x) + 2.5, canvas.height - 22.5);
            ctx.fillText(`${(timeHover / 1000).toFixed(1)}s`, Math.floor(x) + 2.5, canvas.height - 22.5);
            ctx.lineWidth = 1;
        }
    };

    // resize
    editor.on('tools:resize', (width: number, height: number) => {
        canvas.width = width - 300 - 32;
        canvas.height = 275;
        scale = canvas.width / editor.call('tools:time:capacity');
        ctx.font = '10px Arial';
        render();
    });
    canvas.width = editor.call('tools:size:width') - 300 - 32;
    canvas.height = 275;
    ctx.font = '10px Arial';
    scale = canvas.width / editor.call('tools:time:capacity');

    editor.on('tools:clear', () => {
        events = [];
        cacheAssetLoading = { };
        cacheShaderCompile = [];
        cacheShaderCompileEvents = [];
    });

    editor.on('tools:state', (state) => {
        enabled = state;
    });

    editor.method('tools:timeline:color', (kind: string) => {
        return kindColorsOverview[kind] || '#fff';
    });

    // add event to history
    const addEvent = function (args: { time: number; time2?: number; name?: string; kind?: string }) {
        if (!enabled) {
            return;
        }

        const e = {
            i: ++counter,
            t: args.time,
            t2: args.time2 || null,
            n: args.name || '',
            k: args.kind || ''
        };
        events.push(e);
        editor.emit('tools:timeline:add', e);
        return e;
    };
    editor.method('tools:timeline:add', addEvent);

    editor.once('launcher:device:ready', () => {

        // subscribe to app reload start
        app.once('preload:start', () => {
            if (!enabled) {
                return;
            }

            addEvent({
                time: editor.call('tools:time:now'),
                name: 'preload'
            });
        });

        // subscribe to app start
        app.once('start', () => {
            if (!enabled) {
                return;
            }

            addEvent({
                time: editor.call('tools:time:now'),
                name: 'start'
            });
        });

        // subscribe to asset loading start
        app.assets.on('load:start', (asset) => {
            if (!enabled) {
                return;
            }

            cacheAssetLoading[asset.id] = addEvent({
                time: editor.call('tools:time:now'),
                time2: -1,
                kind: 'asset'
            });
        });

        // subscribe to asset loading end
        app.assets.on('load', (asset: pc.Asset) => {
            if (!enabled || !cacheAssetLoading[asset.id]) {
                return;
            }

            cacheAssetLoading[asset.id].t2 = editor.call('tools:time:now');
            editor.emit('tools:timeline:update', cacheAssetLoading[asset.id]);
            delete cacheAssetLoading[asset.id];
        });


        const onShaderStart = function (evt: { timestamp: number; target: unknown }) {
            if (!enabled) {
                return;
            }

            let time = evt.timestamp;
            if (editor.call('tools:epoc')) {
                time -= editor.call('tools:time:beginning');
            }

            const item = addEvent({
                time: time,
                time2: -1,
                kind: 'shader'
            });

            cacheShaderCompile.push(evt.target);
            cacheShaderCompileEvents[cacheShaderCompile.length - 1] = item;
        };

        const onShaderEnd = function (evt: { timestamp: number; target: unknown }) {
            if (!enabled) {
                return;
            }

            const ind = cacheShaderCompile.indexOf(evt.target);
            if (ind === -1) {
                return;
            }

            let time = evt.timestamp;
            if (editor.call('tools:epoc')) {
                time -= editor.call('tools:time:beginning');
            }

            cacheShaderCompileEvents[ind].t2 = time;
            editor.emit('tools:timeline:update', cacheShaderCompileEvents[ind]);
            cacheShaderCompile.splice(ind, 1);
            cacheShaderCompileEvents.splice(ind, 1);
        };

        const onLightmapperStart = function (evt: { timestamp: number; target: unknown }) {
            if (!enabled) {
                return;
            }

            let time = evt.timestamp;
            if (editor.call('tools:epoc')) {
                time -= editor.call('tools:time:beginning');
            }

            const item = addEvent({
                time: time,
                time2: -1,
                kind: 'lightmap'
            });

            cacheLightmapper = evt.target;
            cacheLightmapperEvent = item;
        };

        const onLightmapperEnd = function (evt: { timestamp: number; target: unknown }) {
            if (!enabled) {
                return;
            }

            if (cacheLightmapper !== evt.target) {
                return;
            }

            let time = evt.timestamp;
            if (editor.call('tools:epoc')) {
                time -= editor.call('tools:time:beginning');
            }

            cacheLightmapperEvent.t2 = time;
            editor.emit('tools:timeline:update', cacheLightmapperEvent);
            cacheLightmapper = null;
        };

        // subscribe to shader compile and linking
        app.graphicsDevice.on('shader:compile:start', onShaderStart);
        app.graphicsDevice.on('shader:link:start', onShaderStart);
        app.graphicsDevice.on('shader:compile:end', onShaderEnd);
        app.graphicsDevice.on('shader:link:end', onShaderEnd);

        // subscribe to lightmapper baking
        app.graphicsDevice.on('lightmapper:start', onLightmapperStart);
        app.graphicsDevice.on('lightmapper:end', onLightmapperEnd);

    });

    // add performance.timing events if available
    if (performance.timing) {
        // dom interactive
        addEvent({
            time: performance.timing.domInteractive - editor.call('tools:time:beginning'),
            name: 'dom'
        });
        // document load
        addEvent({
            time: performance.timing.loadEventEnd - editor.call('tools:time:beginning'),
            name: 'load'
        });
    }

    editor.on('tools:render', render);
});
