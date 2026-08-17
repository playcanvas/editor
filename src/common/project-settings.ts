import { DEVICETYPE_WEBGPU } from 'playcanvas';

type Settings = {
    enableGlslShaderTranspilation?: boolean;
    enableWebGpu?: boolean;
    deviceTypes?: string[];
};

export const migrateGlslShaderTranspilation = (settings: Settings) => {
    if (Object.prototype.hasOwnProperty.call(settings, 'enableGlslShaderTranspilation')) {
        return;
    }

    settings.enableGlslShaderTranspilation = Object.prototype.hasOwnProperty.call(settings, 'enableWebGpu')
        ? !!settings.enableWebGpu
        : settings.deviceTypes?.[0] === DEVICETYPE_WEBGPU;
    let pending = true;
    return (data: Settings) => {
        const value = pending && !Object.prototype.hasOwnProperty.call(data, 'enableGlslShaderTranspilation');
        pending = false;
        return value;
    };
};

export const useGlslShaderTranspilation = (enableWebGpu: boolean, enableGlslShaderTranspilation?: boolean) =>
    enableWebGpu && (enableGlslShaderTranspilation ?? enableWebGpu);
