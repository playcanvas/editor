editor.once('load', () => {
    editor.method('viewport:loadingScreen', () => {
        pc.script.createLoadingScreen((app: pc.AppBase) => {
            const createCss = () => {
                const css = `
                    body {
                        background-color: #283538;
                    }

                    #application-splash-wrapper {
                        position: absolute;
                        top: 0;
                        left: 0;
                        height: 100%;
                        width: 100%;
                        background-color: #283538;
                    }

                    #application-splash {
                        position: absolute;
                        top: calc(50% - 28px);
                        width: 264px;
                        left: calc(50% - 132px);
                    }

                    #application-splash img {
                        width: 100%;
                    }

                    #progress-bar-container {
                        margin: 20px auto 0 auto;
                        height: 2px;
                        width: 100%;
                        background-color: #1d292c;
                    }

                    #progress-bar {
                        width: 0%;
                        height: 100%;
                        background-color: #f60;
                    }

                    @media (max-width: 480px) {
                        #application-splash {
                            width: 170px;
                            left: calc(50% - 85px);
                        }
                    }
                `;

                const style = document.createElement('style');
                style.textContent = css;
                document.head.appendChild(style);
            };

            const showSplash = () => {
                const wrapper = document.createElement('div');
                wrapper.id = 'application-splash-wrapper';
                document.body.appendChild(wrapper);

                const splash = document.createElement('div');
                splash.id = 'application-splash';
                wrapper.appendChild(splash);
                splash.style.display = 'none';

                const logo = document.createElement('img');
                logo.src = 'https://playcanvas.com/static-assets/images/play_text_252_white.png';
                splash.appendChild(logo);
                logo.onload = () => {
                    splash.style.display = 'block';
                };

                const container = document.createElement('div');
                container.id = 'progress-bar-container';
                splash.appendChild(container);

                const bar = document.createElement('div');
                bar.id = 'progress-bar';
                container.appendChild(bar);
            };

            const setProgress = (value: number) => {
                const bar = document.getElementById('progress-bar');
                if (bar) {
                    value = Math.min(1, Math.max(0, value));
                    bar.style.width = `${value * 100}%`;
                }
            };

            const hideSplash = () => {
                document.getElementById('application-splash-wrapper').remove();
            };

            createCss();
            showSplash();

            app.on('preload:end', () => {
                app.off('preload:progress');
            });
            app.on('preload:progress', setProgress);
            app.on('start', hideSplash);
        });

    });
});
