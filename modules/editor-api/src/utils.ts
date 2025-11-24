/**
 * Contains various utility methods
 *
 * @category Internal
 */
class utils {
    /**
     * Deep copy an object
     *
     * @param data - The data to copy
     * @returns A copy of the data
     */
    static deepCopy(data: Record<string, any>): Record<string, any> {
        if (data == null || typeof data !== 'object') {
            return data;
        }

        if (data instanceof Array) {
            const arr = [];
            for (let i = 0; i < data.length; i++) {
                arr[i] = this.deepCopy(data[i]);
            }
            return arr;
        }

        const obj: Record<string, any> = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                obj[key] = this.deepCopy(data[key]);
            }
        }
        return obj;
    }

    static expandPath(obj: any, path: string, fn: (obj: any, path: string) => void) {
        function forEachPathInData(pathParts: string[], pathSoFar: string, startIndex: number, data: any[], fn: (obj: object, path: string) => void) {
            if (!data) return;

            function process(item: any, key: string | number) {
                let current = item;
                let p = (pathSoFar ? `${pathSoFar}.` : '') + key;
                for (let i = startIndex; i < pathParts.length; i++) {
                    // if we found another star recurse
                    if (pathParts[i] === '*') {
                        forEachPathInData(pathParts, p, i + 1, current, fn);
                        return;
                    }

                    // keep getting deeper into the object as long as each path part exists
                    if (!current.hasOwnProperty(pathParts[i])) {
                        return;
                    }

                    current = current[pathParts[i]];

                    // if we found a null entry then stop unless this is the
                    // final path part which means we ended up at the end of the path
                    // which is fine
                    if (!current && i < pathParts.length - 1) {
                        return;
                    }

                    p += `.${pathParts[i]}`;
                }

                // call callback with the path we've found so far
                fn(obj, p);
            }

            if (Array.isArray(data)) {
                // if data is an array then process all of its array items
                data.forEach((item, index) => {
                    process(item, index);
                });
            } else {
                // if data is a JSON object then process all of its keys
                const keys = Object.keys(data);
                keys.forEach((key) => {
                    process(data[key], key);
                });
            }
        }

        // if this is a simple path without a star
        // then just early out
        if (!path.includes('*')) {
            if (obj.has(path)) {
                fn(obj, path);
            }

            return;
        }

        // paths with stars need to be broken up
        // and processed differently. When a star is encountered
        // we have to process all of the entries under the star
        const parts = path.split('.');
        if (parts[0] === '*') {
            // handle special case when first part of path is a star
            forEachPathInData(parts, '', 1, obj.json(), fn);
            return;
        }

        // find path until first star
        let firstPartialPath = parts[0];
        let i;
        for (i = 1; i < parts.length; i++) {
            if (parts[i] === '*') break;
            firstPartialPath += `.${parts[i]}`;
        }

        if (!obj.has(firstPartialPath)) return;

        // get json just before first star
        const json = obj.get(firstPartialPath);
        if (!json) return;

        // start breaking down each path
        forEachPathInData(parts, firstPartialPath, i + 1, json, fn);
    }
}

export { utils };
