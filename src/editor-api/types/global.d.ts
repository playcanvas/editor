// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- must be an interface to merge with the global Array type
declare interface Array<T> {
    equals(array: T[]): boolean;
}
