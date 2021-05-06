editor.once('load', function () {
    'use strict';

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
        tag.onload = function () {
            doneCallback();
        };
        tag.onerror = function () {
            throw new Error('failed to load ' + url);
        };
        tag.async = true;
        tag.src = url;
        document.head.appendChild(tag);
    }

    // load and initialize a wasm module
    function loadWasmModuleAsync(moduleName, jsUrl, binaryUrl, doneCallback) {
        loadScriptAsync(jsUrl, function () {
            var lib = window[moduleName];
            window[moduleName + 'Lib'] = lib;
            lib({ locateFile: function () { return binaryUrl; } } ).then( function (instance) {
                window[moduleName] = instance;
                doneCallback();
            });
        });
    }

    editor.method('editor:loadModules', function (modules, urlPrefix, doneCallback) {
        if (typeof modules === "undefined" || modules.length === 0) {
            // caller may depend on callback behaviour being async
            setTimeout(doneCallback);
        } else {
            var asyncCounter = modules.length;
            var asyncCallback = function () {
                asyncCounter--;
                if (asyncCounter === 0) {
                    doneCallback();
                }
            };

            var wasm = wasmSupported();
            modules.forEach(function (m) {
                if (!m.hasOwnProperty('preload') || m.preload) {
                    if (wasm) {
                        loadWasmModuleAsync(m.moduleName, urlPrefix + m.glueUrl, urlPrefix + m.wasmUrl, asyncCallback);
                    } else {
                        if (!m.fallbackUrl) {
                            throw new Error('wasm not supported and no fallback supplied for module ' + m.moduleName);
                        }
                        loadWasmModuleAsync(m.moduleName, urlPrefix + m.fallbackUrl, "", asyncCallback);
                    }
                } else {
                    asyncCallback();
                }
            });
        }
    });
});
