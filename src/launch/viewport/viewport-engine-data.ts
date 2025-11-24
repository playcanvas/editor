import AREA_LIGHTS_LUTS from '@/common/viewport-area-lights-luts';

editor.once('launcher:device:ready', (app) => {
    if (app.setAreaLightLuts.length === 2) {
        app.setAreaLightLuts(AREA_LIGHTS_LUTS.LTC_MAT_1, AREA_LIGHTS_LUTS.LTC_MAT_2);
    }
});
