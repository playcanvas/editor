import AREA_LIGHTS_LUTS from '@/common/viewport-area-lights-luts';

editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    if (app.setAreaLightLuts.length === 2) {
        app.setAreaLightLuts(AREA_LIGHTS_LUTS.LTC_MAT_1, AREA_LIGHTS_LUTS.LTC_MAT_2);
    }
});
