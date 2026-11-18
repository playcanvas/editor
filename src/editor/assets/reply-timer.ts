/**
 * Fails requests whose replies stop arriving. One timer covers every pending request and restarts
 * on each reply, so requests queued behind a busy but responsive backend are not failed for
 * waiting their turn; they fail only after nothing has been answered for `ms`.
 *
 * @param ms - How long without any reply before the pending requests fail.
 * @returns A function that registers a pending request and returns the function to call on its reply.
 */
export const createReplyTimer = (ms: number) => {
    const pending = new Set<() => void>();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const expire = () => {
        timer = undefined;
        const failed = [...pending];
        pending.clear();
        failed.forEach((fail) => fail());
    };

    return (onTimeout: () => void) => {
        pending.add(onTimeout);
        timer ??= setTimeout(expire, ms);

        return () => {
            if (!pending.delete(onTimeout)) {
                return;
            }

            clearTimeout(timer);
            timer = pending.size ? setTimeout(expire, ms) : undefined;
        };
    };
};
