describe('utils tests', function () {
    it('expandPath is called for paths with no stars', function () {
        const obj = new observer.Observer({
            position: [1, 2, 3],
            components: {
                test: {
                    field: 1,
                    field2: null
                },
                arr: [{
                    data: {
                        field: 1
                    }
                }]
            }
        });
        const called = [];
        api.utils.expandPath(obj, 'position', (obj, path) => {
            called.push([obj, path]);
        });
        api.utils.expandPath(obj, 'components.test.field', (obj, path) => {
            called.push([obj, path]);
        });
        api.utils.expandPath(obj, 'components.test.field2', (obj, path) => {
            called.push([obj, path]);
        });
        api.utils.expandPath(obj, 'components.arr.0.data.field', (obj, path) => {
            called.push([obj, path]);
        });

        expect(called).to.deep.equal([
            [obj, 'position'],
            [obj, 'components.test.field'],
            [obj, 'components.test.field2'],
            [obj, 'components.arr.0.data.field']
        ]);
    });

    it('expandPath is called for paths with stars', function () {
        const obj = new observer.Observer({
            components: {
                test: {
                    field: 1,
                    field2: null
                },
                arr: [{
                    data: {
                        field: 1
                    },
                    data2: {
                        field: 1
                    }
                }, {
                    data: {
                        field: null
                    },
                    data2: {
                        field: null
                    }
                }]
            }
        });
        const called = [];
        api.utils.expandPath(obj, '*', (obj, path) => {
            called.push([obj, path]);
        });
        api.utils.expandPath(obj, 'components.test.*', (obj, path) => {
            called.push([obj, path]);
        });
        api.utils.expandPath(obj, 'components.arr.*', (obj, path) => {
            called.push([obj, path]);
        });
        api.utils.expandPath(obj, 'components.arr.*.data.field', (obj, path) => {
            called.push([obj, path]);
        });
        api.utils.expandPath(obj, 'components.arr.*.*.field', (obj, path) => {
            called.push([obj, path]);
        });

        expect(called).to.deep.equal([
            [obj, 'components'],

            [obj, 'components.test.field'],
            [obj, 'components.test.field2'],

            [obj, 'components.arr.0'],
            [obj, 'components.arr.1'],

            [obj, 'components.arr.0.data.field'],
            [obj, 'components.arr.1.data.field'],

            [obj, 'components.arr.0.data.field'],
            [obj, 'components.arr.0.data2.field'],
            [obj, 'components.arr.1.data.field'],
            [obj, 'components.arr.1.data2.field']
        ]);
    });

    it('expandPath is only called for paths that exist', function () {
        const obj = new observer.Observer({
            components: {
                test: {
                    field: 1,
                    field2: null
                },
                arr: [{
                    data: {
                        field: 1
                    },
                    data2: {
                        field2: 1
                    }
                }, {
                    data: {
                        field: null
                    },
                    data2: {
                        field2: null
                    }
                }]
            }
        });
        const called = [];
        api.utils.expandPath(obj, 'components.*.field', (obj, path) => {
            called.push(path);
        });
        api.utils.expandPath(obj, 'components.arr.2', (obj, path) => {
            called.push(path);
        });
        api.utils.expandPath(obj, 'components.arr.2.data.field', (obj, path) => {
            called.push(path);
        });
        api.utils.expandPath(obj, 'components.arr.*.*.field2', (obj, path) => {
            called.push(path);
        });

        expect(called).to.deep.equal([
            'components.test.field',
            'components.arr.0.data2.field2',
            'components.arr.1.data2.field2'
        ]);
    });
});
