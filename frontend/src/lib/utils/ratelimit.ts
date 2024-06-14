const isRunning = new Map<string, number>();

export const ratelimit = (key: string, delaySeconds: number, fn: () => Promise<any>) => {
    if (isRunning.has(key)) {
        const blockedUntil = isRunning.get(key);
        if (blockedUntil && blockedUntil > Date.now()) {
            return;
        }
    }

    console.log('ratelimit', key, delaySeconds);

    isRunning.set(key, Date.now() + delaySeconds * 1000);
    fn().catch(err => {
        throw err
    }).finally(() => {
        isRunning.delete(key);
    })
}