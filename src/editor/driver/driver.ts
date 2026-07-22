import { Caller } from '@/common/caller';

const driver = new Caller<Record<string, (...args: any[]) => any>>('Editor Driver');

export { driver };
