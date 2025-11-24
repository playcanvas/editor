// move chai methods to window
for (const member in chai) {
    window[member] = chai[member];
}

// create pcui namespace
window.pcui = {};

// create pc namespace
window.pc = {};
