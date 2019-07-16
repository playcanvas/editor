var loadModules = function (MODULES, urlPrefix) {
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

    // asynchronously load a script. returns a promise.
    function loadScriptAsync(url) {
        return new Promise((resolve, reject) => {
            var tag = document.createElement('script');
            tag.onload = () => {
                resolve();
            };
            tag.onerror = () => {
                throw new Error('failed to load ' + url);
            };
            tag.async = true;
            tag.src = urlPrefix + url;
            document.head.appendChild(tag);
        });
    }

    // asynchronously load and initialize a wasm module. returns a promise.
    function loadWasmModuleAsync(moduleName, jsUrl, binaryUrl) {
        return new Promise((resolve, reject) => {

            var loadJs = loadScriptAsync(jsUrl);

            var loadWasm = fetch(urlPrefix + binaryUrl)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('failed to fetch ' + binaryUrl + ' (' + response.statusText + ')');
                }
                return response.arrayBuffer();
            });

            Promise.all([loadJs, loadWasm])
            .then(function (responses) {
                // instantiate the wasm module
                window[moduleName]({ wasmBinary: responses[1] })  // <-- arguments to the wasm module construction here
                .then(function (module) {
                    window[moduleName] = module;
                    resolve();
                });
            })
            .catch(error => { reject(error); });
        });
    }

    // asynchronously load and initialize an asm.js module. returns a promise.
    function loadAsmModuleAsync(moduleName, jsUrl) {
        return loadScriptAsync(jsUrl)
        .then(function () {
            window[moduleName] = window[moduleName]();
        });
    }

    if (typeof MODULES === "undefined" || MODULES.length === 0) {
        return Promise.resolve();
    }

    // only check for wasm support if preload modules have been specified
    var wasm = wasmSupported();
    return Promise.all(MODULES.map(m => wasm ? loadWasmModuleAsync(m.moduleName, m.glueUrl, m.wasmUrl) : loadAsmModuleAsync(m.moduleName, m.fallbackUrl)))
    .then( () => { console.log("finished loading modules"); })
    .catch(error => { console.log(error); });
};
