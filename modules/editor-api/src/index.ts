/**
 * The Editor module provides a comprehensive API for automating and extending
 * the functionality of the PlayCanvas Editor. It allows developers to programmatically
 * interact with the Editor, facilitating tasks such as scene manipulation, asset
 * management, and custom tool integration. This module is essential for developers
 * looking to streamline their workflow, create custom editing tools, or integrate
 * external data and systems into the PlayCanvas Editor environment.
 *
 * @module Editor
 */
// types
export type * from '../external/types/config';
export type * from '../external/types/asset';
export type * from '../external/types/entity';
export type * from '../external/types/scene-settings';

// core
export * from './polyfills';
export * from './globals';
export * from './utils';
export * from './guid';
export * from './entities';
export * from './entity';
export * from './assets';
export * from './asset';
export * from './settings';
export * from './settings/scene';
export * from './history';
export * from './selection';
export * from './schema';
export * from './schema/assets';
export * from './schema/components';
export * from './schema/scene';
export * from './schema/settings';
export * from './realtime/connection';
export * from './realtime/scene';
export * from './realtime/scenes';
export * from './realtime/asset';
export * from './realtime/assets';
export * from './realtime';
export * from './messenger';
export * from './jobs';
export * from './localstorage';
export * from './clipboard';
export * from './rest';

/**
 * The version of the Editor API library. This is a string in semantic version format of `major.minor.patch`.
 */
export const version = 'PACKAGE_VERSION';

/**
 * The git revision of the Editor API library. This is a string of the git commit hash.
 */
export const revision = 'PACKAGE_REVISION';
