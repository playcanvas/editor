self.pc = {
    script: {
        attributes: [],
        name: '',

        // allows users to define attributes like so: pc.script.attribute(name, type, defaultValue [, options]);
        attribute: function (name: string, type: string, defaultValue: unknown, options?: Record<string, unknown>) {
            this.attributes.push({
                name: name,
                type: type,
                defaultValue: defaultValue,
                options: options
            });
        },

        create: function (...args: unknown[]) {
            this.name = args[0];
        }
    },

    // mock methods that might appear outside of script definitions
    extend: function (obj: Record<string, unknown>, other: Record<string, unknown>) {
        return obj;
    },

    inherits: function (obj: Record<string, unknown>, parent: new (...args: unknown[]) => unknown) {
        return obj;
    },

    posteffect: {
        PostEffect: function () {
            /* mock constructor */
        }
    }
};

// runs the script text it is posted and replies with the attributes it declared; it runs inside the
// opaque-origin sandbox, so it never fetches anything itself
onmessage = (event: MessageEvent) => {
    const { script } = event.data ?? {};
    if (typeof script !== 'string') {
        return;
    }

    try {
        new Function(script)();
        postMessage({
            name: pc.script.name,
            values: pc.script.attributes
        });
    } catch (e) {
        postMessage({
            error: `${e}`
        });
    }

    close();
};
