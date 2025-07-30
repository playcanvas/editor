editor.once('load', () => {
    const WHITELISTED_FOR_EVERYONE = {
        hasRecompressFlippedTextures: true,
        hasFixCorruptedTemplates: true
    };

    const NO_EXCEPTION_FOR_SUPERUSERS = {
        hasRecompressFlippedTextures: true
    };

    editor.method('users:hasOpenedEditor', () => {
        return (config.self && config.self.flags.openedEditor);
    });

    editor.method('users:isSuperUser', () => {
        return (config.self && config.self.flags.superUser);
    });

    editor.method('users:hasFlag', (flag) => {
        if (WHITELISTED_FOR_EVERYONE[flag]) {
            return true;
        }

        if (config.self) {
            if (config.self.flags[flag]) {
                return true;
            }

            if (config.self.flags.superUser && !NO_EXCEPTION_FOR_SUPERUSERS[flag]) {
                return true;
            }
        }

        return false;
    });
});
