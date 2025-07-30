editor.once('load', () => {
    const tooltips = document.createElement('div');
    tooltips.id = 'application-tooltips';
    document.body.appendChild(tooltips);

    const showTooltipMessage = (msg) => {
        const panel = document.createElement('div');
        panel.classList.add('tooltip');
        tooltips.appendChild(panel);

        // close button img
        const closeBtn = document.createElement('img');
        closeBtn.src = 'https://playcanvas.com/static-assets/images/icons/fa/16x16/remove.png';
        closeBtn.addEventListener('click', () => {
            panel.classList.add('hidden');
        });
        panel.appendChild(closeBtn);

        // message span
        const messageSpan = document.createElement('span');
        panel.appendChild(messageSpan);
        messageSpan.innerText = msg;
    };

    // display engine version popup
    const params = new URLSearchParams(location.search);
    if (params.get('use_local_engine') || params.get('tag') || params.get('version')) {
        showTooltipMessage(`You are currently using engine version: ${pc.version}`);
    }
    const deviceType = params.get('device');

    // display device type popup
    const app = editor.call('viewport:app');
    const nameMap = {
        [pc.DEVICETYPE_WEBGPU]: `WebGPU${editor.projectEngineV2 ? '' : ' (beta)'}`,
        [pc.DEVICETYPE_WEBGL2]: 'WebGL 2.0',
        [pc.DEVICETYPE_WEBGL1]: 'WebGL 1.0',
        [pc.DEVICETYPE_NULL]: 'Null'
    };
    const getDeviceType = (isWebGPU, isWebGL2, isWebGL1) => {
        if (isWebGPU) {
            return pc.DEVICETYPE_WEBGPU;
        }
        if (isWebGL2) {
            return pc.DEVICETYPE_WEBGL2;
        }
        if (isWebGL1) {
            return pc.DEVICETYPE_WEBGL1;
        }
        return pc.DEVICETYPE_NULL;
    };
    editor.once('launcher:device:ready', () => {
        const device = app.graphicsDevice;
        const { enableWebGpu, enableWebGl2 } = editor.call('settings:project').json();

        // migrate old device properties
        // FIXME: Remove at some point as old not official supported
        if (device.hasOwnProperty('webgl2')) {
            device.isWebGL2 = device.webgl2;
            device.isWebGL1 = !device.webgl2;
        }

        const projectDeviceType = getDeviceType(enableWebGpu, enableWebGl2, !editor.projectEngineV2);
        const paramDeviceType = Object.keys(nameMap).includes(deviceType) ? deviceType : pc.DEVICETYPE_NULL;
        const currentDeviceType = paramDeviceType === pc.DEVICETYPE_NULL ? projectDeviceType : paramDeviceType;
        const actualDeviceType = getDeviceType(device.isWebGPU, device.isWebGL2, device.isWebGL1);

        if (currentDeviceType !== actualDeviceType) {
            showTooltipMessage(`${nameMap[currentDeviceType]} graphics device not supported. You are currently using the graphics device: ${nameMap[actualDeviceType]}`);
        } else if (paramDeviceType !== pc.DEVICETYPE_NULL) {
            showTooltipMessage(`You are currently using the graphics device: ${nameMap[actualDeviceType]}`);
        }
    });

});
