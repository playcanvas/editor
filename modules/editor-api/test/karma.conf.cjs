module.exports = function (config) {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '..',

        client: {
            args: process.argv
        },

        // list of files / patterns to load in the browser
        files: [
            // libraries
            'node_modules/sinon/pkg/sinon.js',
            'node_modules/chai/chai.js',

            'test/lib/schema.js',
            'node_modules/@playcanvas/observer/dist/index.js',
            'dist/index.js',

            {
                pattern: 'test/setup.js',
                type: 'module',
                nocache: true
            },

            // test files - change this to a specific file in order to run a single suite
            'test/**/test-*.js'
        ],

        // list of files / patterns to exclude
        exclude: [],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['mocha'],

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['spec'],

        // web server port
        port: 9877,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // browserConsoleLogOptions: config.LOG_WARN,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['ChromeHeadless'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: process.argv.includes('--single-run'),

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: 1
    });
};
