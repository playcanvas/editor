var loadModules = function (MODULES, urlPrefix, doneCallback) {

    // check for wasm module support
    function wasmSupported() {
        try {
            if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
                const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
                if (module instanceof WebAssembly.Module)
                    return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
            }
        } catch (e) { }
        return false;
    }

    // load a script
    function loadScriptAsync(url, doneCallback) {
        var tag = document.createElement('script');
        tag.onload = () => {
            doneCallback();
        };
        tag.onerror = () => {
            throw new Error('failed to load ' + url);
        };
        tag.async = true;
        tag.src = urlPrefix + url;
        document.head.appendChild(tag);
    }

    // load and initialize a wasm module
    function loadWasmModuleAsync(moduleName, jsUrl, binaryUrl, doneCallback) {
        loadScriptAsync(jsUrl, function () {
            window[moduleName + 'Lib'] = window[moduleName];
            window[moduleName]({ locateFile: () => binaryUrl }).then( function () {
                doneCallback();
            });
        });
    }

    // load and initialize an asm.js module
    function loadAsmModuleAsync(moduleName, jsUrl, doneCallback) {
        return loadScriptAsync(jsUrl, function () {
            window[moduleName] = window[moduleName]();
            doneCallback();
        });
    }

    if (typeof MODULES === "undefined" || MODULES.length === 0) {
        doneCallback();
    } else {
        var asyncCounter = MODULES.length;
        var asyncCallback = function () {
            asyncCounter--;
            if (asyncCounter === 0) {
                doneCallback();
            }
        };

        var wasm = wasmSupported();
        MODULES.forEach(function (m) {
            if (wasm) {
                loadWasmModuleAsync(m.moduleName, m.glueUrl, m.wasmUrl, asyncCallback);
            } else {
                loadAsmModuleAsync(m.moduleName, m.fallbackUrl, asyncCallback);
            }
        });
    }
};
