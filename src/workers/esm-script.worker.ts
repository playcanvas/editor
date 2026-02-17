import { JSDocParser } from '@playcanvas/attribute-parser';

import { WorkerServer } from '@/core/worker/worker-server';

import { type Fix } from '../code-editor/monaco/intellisense/attribute-autofill';

const PLAYCANVAS_ATTRIBUTE_DOCS_URL = {
    target: 'https://developer.playcanvas.com/user-manual/scripting/fundamentals/script-attributes/esm/#attribute-types',
    value: 'Attribute Type Docs'
};

export type SerializableParsingError = {
    name: string;
    message: string;
    file: string;
    fileName: string;
    type: string;
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    severity: 8 | 4;
    code: { target: string; value: string } | string | null;
    fix: Fix | null;
};

/** Parsing error from the JSDoc attribute parser */
interface ParsingErrorLike {
    node?: {
        getSourceFile(): { fileName: string; getLineAndCharacterOfPosition(pos: number): { line: number; character: number } };
        getStart(): number;
        getEnd(): number;
        getText(): string;
        comment?: string;
    };
    attributeName: string;
    type: string;
    message: string;
    fix: Fix | null;
}

/**
 * Convert an error to a serializable error
 * @param error - The error to convert
 * @returns The serializable error
 */
const toSerializableError = (error: ParsingErrorLike): SerializableParsingError | null => {
    if (!error.node) {
        return null;
    }

    const sourceFile = error.node.getSourceFile();
    let startPos = error.node.getStart();
    let endPos = error.node.getEnd() + 1;

    // If the node has a comment field, the range is not correct, so we need to adjust it to cover just the comment content
    if (error.node.comment) {
        const fullText = error.node.getText();
        const commentText = error.node.comment.split('\n')[0]?.trim() || '';

        // Find the start of the comment content within the full text
        const commentStart = fullText.lastIndexOf(commentText);
        if (commentStart !== -1) {
            startPos = error.node.getStart() + commentStart;
            endPos = startPos + commentText.length;
        }
    }

    const startLineChar = sourceFile.getLineAndCharacterOfPosition(startPos);
    const endLineChar = sourceFile.getLineAndCharacterOfPosition(endPos);

    // Some errors are limited to specific tags like '@range' or '@precision'
    // These can be classified as warnings as the attribute is still functionally valid.
    const severity = error.type.startsWith('Invalid Tag') ? 4 : 8;

    // If the error is an Invalid Type, then we can also provide a link to the docs
    const code = error.type.startsWith('Invalid Type') ? PLAYCANVAS_ATTRIBUTE_DOCS_URL : null;

    return {
        name: error.attributeName,
        type: error.type,
        message: error.message,
        fix: error.fix,
        file: sourceFile.fileName,
        fileName: sourceFile.fileName.split('/').pop() || sourceFile.fileName, // Extract just the filename
        startLineNumber: startLineChar.line + 1,
        startColumn: startLineChar.character + 1,
        endLineNumber: endLineChar.line + 1,
        endColumn: endLineChar.character + 1,
        severity,
        code
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
                    attributesInvalid: script.errors.map(toSerializableError).filter(Boolean),
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
        const serializedErrors = errors.map(toSerializableError).filter(Boolean);
        workerServer.send('attributes:get', asn, uri, attributes, serializedErrors);
    });

    workerServer.send('init');
});
