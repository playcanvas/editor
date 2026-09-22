import { DEVICETYPE_WEBGPU } from 'playcanvas';

type Settings = {
    enableGlslTranspilation?: boolean;
    enableWebGpu?: boolean;
    deviceTypes?: string[];
};

export const migrateGlslTranspilation = (settings: Settings) => {
    if (Object.prototype.hasOwnProperty.call(settings, 'enableGlslTranspilation')) {
        return;
    }

    settings.enableGlslTranspilation = Object.prototype.hasOwnProperty.call(settings, 'enableWebGpu')
        ? !!settings.enableWebGpu
        : settings.deviceTypes?.[0] === DEVICETYPE_WEBGPU;
    let pending = true;
    return (data: Settings) => {
        const value = pending && !Object.prototype.hasOwnProperty.call(data, 'enableGlslTranspilation');
        pending = false;
        return value;
    };
};

export const useGlslTranspilation = (enableWebGpu: boolean, enableGlslTranspilation?: boolean) =>
    enableWebGpu && (enableGlslTranspilation ?? enableWebGpu);
