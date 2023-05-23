import AREA_LIGHTS_LUTS from '../common/viewport-area-lights-luts.js';

editor.once('launcher:device:ready', function (app) {
    if (app.setAreaLightLuts.length === 2) {
        app.setAreaLightLuts(AREA_LIGHTS_LUTS.LTC_MAT_1, AREA_LIGHTS_LUTS.LTC_MAT_2);
    }
});
