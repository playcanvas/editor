export const mergeToolbarOrder = (value: unknown, defaults: string[]) => {
    const order = Array.isArray(value)
        ? value.filter((id): id is string => typeof id === 'string' && defaults.includes(id))
        : [];
    return [...new Set(order), ...defaults.filter((id) => !order.includes(id))];
};

export const moveToolbarItem = (order: string[], id: string, target: string, after: boolean) => {
    if (id === target) {
        return order;
    }
    const next = order.filter((item) => item !== id);
    next.splice(next.indexOf(target) + Number(after), 0, id);
    return next;
};
