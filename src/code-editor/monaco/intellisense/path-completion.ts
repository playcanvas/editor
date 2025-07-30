import { Trie } from '../../../core/trie.ts';

editor.on('assets:load', () => {
    // A regexp to check if this is a module path
    const MODULE_PATH_REGEXP = /(?<=import(?:\s*[\n\r\u2028\u2029]|[\t\v\f \xa0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]).*?["'])([./]*[a-z]*['"]*)*/g;

    // This is used to lookup module paths
    const moduleTrie = new Trie();

    // Create a map to store the asset path. This is used to retrieve the previous filename if the asset is renamed
    const assetPathMap = new Map();

    // Handle
    const onAssetAdded = (asset) => {
        if (editor.call('assets:isModule', asset)) {

            // If this asset has already been added, then remove it's old path
            if (assetPathMap.has(asset)) {
                moduleTrie.remove(assetPathMap.get(asset));
            }

            const path = editor.call('assets:virtualPath', asset);

            // Add the asset to the trie and update the asset path map
            assetPathMap.set(asset, path);
            moduleTrie.insert(path);

            // Listen for a change to the filename
            asset.once('file.filename:set', () => onAssetAdded(asset));

        } else if (editor.call('assets:isScript', asset)) {

            // If the asset is a script, but not an esm script, then the filename, may not have been set yet.
            // Listen for the first time the filename is set, then add the asset
            // asset.once('file.filename:set', name => onAssetAdded(asset));
            asset.once('file.filename:set', () => onAssetAdded(asset));
        }
    };

    // Listener for when an asset has been removed, remove the asset from the trie
    const onAssetRemoved = (asset) => {
        if (editor.call('assets:isModule', asset)) {
            const path = editor.call('assets:virtualPath', asset);
            moduleTrie.remove(path);
        }
    };

    // List for changes in the asset registry
    editor.on('assets:add', onAssetAdded);
    editor.on('assets:remove', onAssetRemoved);

    const assets = editor.call('assets:list');
    assets.forEach(onAssetAdded);

    // Implement a completion provider for file paths
    monaco.languages.registerCompletionItemProvider('javascript', {

        triggerCharacters: ['/', '.', '-', '_'],

        provideCompletionItems: (model, position) => {

            // Get the text until the current position
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            // Check if the current text contains a string that looks like a file path starting with './', '/', or '../'
            const relativePath = textUntilPosition.match(MODULE_PATH_REGEXP);

            // If no match is found, return an empty list of suggestions
            if (!relativePath) {
                return { suggestions: [] };
            }

            // Get the absolute path
            const absolutePath = new URL(relativePath[0], `file:${model.uri.path}`).pathname;
            const currentFileName = model.uri.path.split('/').filter(Boolean).pop();

            // Find all matching paths in the trie, exclude the current file name
            const matchingPaths = moduleTrie.search(absolutePath).filter(({ name }) => name !== currentFileName);

            const suggestions =  matchingPaths.map(({ isEndOfPath, name }) => {

                // If the node is the end of the path, then it is a file, otherwise it is a folder
                const kind = isEndOfPath ? monaco.languages.CompletionItemKind.File : monaco.languages.CompletionItemKind.Folder;

                // Calculate the offset to insert the suggestion
                const insertOffset = relativePath[0].length - relativePath[0].lastIndexOf('/') - 1;

                // Create the suggestion object
                const suggestion = {
                    label: name,
                    kind,
                    insertText: name,
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column - insertOffset, // Adjust start column to replace the entire matched string
                        endLineNumber: position.lineNumber,
                        endColumn: position.column
                    }
                };

                return suggestion;

            });

            return { suggestions, incomplete: true };

        }
    });
});
