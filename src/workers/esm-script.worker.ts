import { JSDocParser } from '@playcanvas/attribute-parser';

import { WorkerServer } from '../core/worker/worker-server.ts';

/**
 * @typedef {Object} SerializableParsingError
 * @property {string} message - The error message
 * @property {string} file - The source file
 * @property {string} name - The name of the error
 * @property {number} startLine - The start line number of the error
 * @property {number} startColumn - The start column number of the error
 * @property {number} endLine - The end line number of the error
 * @property {number} endColumn - The end column number of the error
 */

/**
 * Convert an error to a serializable error
 * @param {ParsingError} error - The error to convert
 * @returns {SerializableParsingError} The serializable error
 */
const toSerializableError = (error) => {
    const sourceFile = error.node.getSourceFile();
    const startPos = error.node.getStart();
    const endPos = error.node.getEnd() +  1;

    const startLineChar = sourceFile.getLineAndCharacterOfPosition(startPos);
    const endLineChar = sourceFile.getLineAndCharacterOfPosition(endPos);

    return {
        name: error.node.symbol.getEscapedName(),
        message: error.message,
        file: sourceFile.fileName,
        startLineNumber: startLineChar.line + 1,
        startColumn: startLineChar.character + 1,
        endLineNumber: endLineChar.line + 1,
        endColumn: endLineChar.character + 1
    };
};

const workerServer = new WorkerServer(self);
workerServer.once('init', async (frontendURL) => {
    const parser = await new JSDocParser().init(`${frontendURL}types/libs.d.ts`);

    workerServer.on('attributes:parse', async (guid, scriptContents, deletedFiles, url) => {
        try {
            parser.updateProgram(scriptContents, deletedFiles);
            const [attributes, errors] = await parser.parseAttributes(url);

            // Parse the results
            const scripts = Object.keys(attributes).reduce((acc, key) => {
                const script = attributes[key];
                const attributesOrder = Object.keys(script.attributes);
                acc[key] = {
                    attributesInvalid: script.errors.map(toSerializableError),
                    attributesOrder,
                    attributes: script.attributes,
                    name: key
                };
                return acc;
            }, {});


            workerServer.send('attributes:parse', guid, scripts, errors);

        } catch (error) {
            const errorMessage = error instanceof Error ?
                'The Attribute Parser failed unexpectedly.' :
                `Attribute parsing error: ${error.toString()}`;

            workerServer.send('attributes:parse', guid, {}, [errorMessage]);
        }
    });

    workerServer.on('attributes:get', (asn, uri, fileName, scriptContents, deletedFiles) => {
        parser.updateProgram(scriptContents, deletedFiles);
        const [attributes, errors] = parser.getAttributes(fileName);
        workerServer.send('attributes:get', asn, uri, attributes, errors);
    });

    workerServer.send('init');
});
