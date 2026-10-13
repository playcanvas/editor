type Item = {
    sync?: { enabled: boolean };
    unset: (path: string) => unknown;
};

export const unsetLocal = (item: Item, path: string) => {
    const enabled = item.sync?.enabled;
    if (enabled) item.sync.enabled = false;
    item.unset(path);
    if (enabled) item.sync.enabled = true;
};
