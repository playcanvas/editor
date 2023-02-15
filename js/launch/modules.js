editor.once('load', function () {
    editor.method('editor:loadModules', function (modules, urlPrefix, doneCallback) {
        if (typeof modules === "undefined" || modules.length === 0) {
            // caller may depend on callback behavior being async
            setTimeout(doneCallback);
        } else {
            let remaining = modules.length;
            const moduleLoaded = () => {
                if (--remaining === 0) {
                    doneCallback();
                }
            };

            modules.forEach(function (m) {
                pc.WasmModule.setConfig(m.moduleName, {
                    glueUrl: urlPrefix + m.glueUrl,
                    wasmUrl: urlPrefix + m.wasmUrl,
                    fallbackUrl: urlPrefix + m.fallbackUrl
                });

                if (!m.hasOwnProperty('preload') || m.preload) {
                    pc.WasmModule.getInstance(m.moduleName, () => { moduleLoaded(); });
                } else {
                    moduleLoaded();
                }
            });
        }
    });
});
