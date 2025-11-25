before(async function() {
    // Increase the timeout because this is an asynchronous setup step
    this.timeout(10000); 
    
    // load the editor api module
    window.api = await import('../dist/index.js');

    // move chai methods to window
    for (const member in chai) {
        window[member] = chai[member];
    }

    // create pcui namespace
    window.pcui = {};

    // create pc namespace
    window.pc = {};
});