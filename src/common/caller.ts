import { Events } from '@playcanvas/observer';

class Caller<T extends Record<string, (...args: any[]) => any>> extends Events {
    /**
     * The name of the Caller.
     */
    private _name: string;

    /**
     * The methods registered with the Caller.
     */
    methods: Map<keyof T, T[keyof T]> = new Map();

    /**
     * @param name - The name of the Caller.
     */
    constructor(name: string = 'Caller') {
        super();
        this._name = name;
    }

    /**
     * @param name - The name of the method to add.
     * @param fn - The function to call when the method is called.
     */
    method<K extends keyof T>(name: K, fn: T[K]) {
        if (this.methods.get(name)) {
            throw new Error(`${this._name} method '${String(name)}' already registered`);
        }
        this.methods.set(name, fn);
    }

    /**
     * @param name - The name of the method to remove.
     */
    methodRemove<K extends keyof T>(name: K) {
        this.methods.delete(name);
    }

    /**
     * @param name - The name of the method to call.
     * @param args - The arguments to pass to the method.
     * @returns The return value of the method.
     */
    call<K extends keyof T>(name: K, ...args: Parameters<T[K]>): ReturnType<T[K]> | null {
        const fn = this.methods.get(name);
        if (fn) {
            try {
                return fn(...args);
            } catch (error) {
                console.info('%c%s %c(editor.method error)', 'color: #06f', name, 'color: #f00');
                log.error(error);
            }
        }
        return null;
    }

    /**
     * @param name - The name of the method to call.
     * @param args - The arguments to pass to the method.
     * @returns The return value of the method.
     */
    invoke<K extends keyof T>(name: K, ...args: Parameters<T[K]>): ReturnType<T[K]> | null {
        const fn = this.methods.get(name);
        if (fn) {
            return fn(...args);
        }
        return null;
    }
}

export { Caller };
