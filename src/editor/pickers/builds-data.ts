export const diffBuilds = <T extends { id: string | number }>(before: T[], after: T[]) => {
    const prev = new Map(before.map((app) => [app.id, JSON.stringify(app)]));
    return {
        changed: new Set(after.filter((app) => prev.get(app.id) !== JSON.stringify(app)).map((app) => app.id)),
        ids: new Set(after.map((app) => app.id))
    };
};
