type AppendTarget<T> = {
    appendChild: (child: T) => T;
};

type ResolveDetail<T> = AppendTarget<T> & {
    parentElement: AppendTarget<T> | null;
};

const appendResolveFooter = <T>(detail: ResolveDetail<T>, footer: T) => {
    (detail.parentElement ?? detail).appendChild(footer);
};

export { appendResolveFooter };
