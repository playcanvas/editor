export const useGlslTranspilation = (enableWebGpu: boolean, enableGlslTranspilation?: boolean) =>
    enableWebGpu && (enableGlslTranspilation ?? enableWebGpu);
