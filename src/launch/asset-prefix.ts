import { config } from '@/launch/config';

/**
 * The same-origin path launch loads asset files under: the config's, or hosted's `/api/`, which the launch
 * host proxies. REST calls use `config.url.api`, on its own origin.
 */
export const ASSET_PREFIX = config.url.assetPrefix ?? '/api/';
