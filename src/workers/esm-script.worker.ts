import { JSDocParser } from '@playcanvas/attribute-parser';

import { WorkerServer } from '../core/worker/worker-server.ts';

const workerServer = new WorkerServer(self);
workerServer.once('init', async (frontendURL) => {
    const parser = await new JSDocParser().init(`${frontendURL}types/libs.d.ts`);

    workerServer.on('attributes:parse', async (guid, scriptContents, deletedFiles, url) => {
        parser.updateProgram(scriptContents, deletedFiles);
        const [attributes, errors] = await parser.parseAttributes(url);

        // Parse the results
        const scripts = Object.keys(attributes).reduce((acc, key) => {
            const script = attributes[key];
            const attributesOrder = Object.keys(script.attributes);
            acc[key] = {
                attributesInvalid: [],
                attributesOrder,
                attributes: script.attributes
            };
            return acc;
        }, {});

        const scriptsInvalid = errors.map((error) => {
            if (!error.file) {
                return error.message;
            }
            return `${error.file} (${error.line + 1},${error.column + 1}) [JavaScript]: ${error.message}`;
        });

        workerServer.send('attributes:parse', guid, scripts, scriptsInvalid);
    });

    workerServer.on('attributes:get', (asn, uri, fileName, scriptContents, deletedFiles) => {
        parser.updateProgram(scriptContents, deletedFiles);
        const [attributes, errors] = parser.getAttributes(fileName);
        workerServer.send('attributes:get', asn, uri, attributes, errors);
    });

    workerServer.send('init');
});
