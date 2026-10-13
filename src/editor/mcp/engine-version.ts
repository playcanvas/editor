type EngineVersions = Record<string, { version: string } | undefined>;
type LaunchState = { requested?: string; releaseCandidate?: boolean; sessionKey?: string };
type ResolvedEngine = {
    channel: string;
    version: string;
    source: 'explicit' | 'launch-option' | 'session-setting' | 'current';
};

// the channels the editor offers, in the order its UI lists them
const ENGINE_CHANNELS = ['current', 'previous', 'releaseCandidate'];

/**
 * The engine channels this project can launch with.
 *
 * @param versions - The channel map from config.
 * @returns The channels that have a version, current first.
 */
const engineChannels = (versions: EngineVersions) =>
    ENGINE_CHANNELS.filter((channel) => versions[channel]?.version).map((channel) => ({
        channel,
        version: versions[channel]!.version
    }));

/**
 * The engine a launch uses when no version is requested, mirroring the Launch button: the
 * release-candidate tick-box first, then the session setting, then current.
 *
 * @param versions - The channel map from config.
 * @param state - The Launch button's release-candidate tick-box and the session setting.
 * @returns The resolved engine.
 */
const defaultEngineVersion = (versions: EngineVersions, state: LaunchState = {}): ResolvedEngine => {
    const releaseCandidate = versions.releaseCandidate?.version;
    if (releaseCandidate && state.releaseCandidate) {
        return { channel: 'releaseCandidate', version: releaseCandidate, source: 'launch-option' };
    }
    const { sessionKey } = state;
    if (sessionKey && sessionKey !== 'current' && versions[sessionKey]?.version) {
        return { channel: sessionKey, version: versions[sessionKey]!.version, source: 'session-setting' };
    }
    return { channel: 'current', version: versions.current!.version, source: 'current' };
};

/**
 * Resolve the engine a launch should use: a requested channel key or exact version string,
 * otherwise the Launch button's default.
 *
 * @param versions - The channel map from config.
 * @param state - The requested version, the release-candidate tick-box and the session setting.
 * @returns The resolved engine, or an error when the request matches no known version.
 */
const resolveEngineVersion = (
    versions: EngineVersions,
    state: LaunchState = {}
): ResolvedEngine | { error: string } => {
    const { requested } = state;
    if (!requested) {
        return defaultEngineVersion(versions, state);
    }
    const channel =
        (ENGINE_CHANNELS.includes(requested) && versions[requested]?.version ? requested : null) ??
        Object.keys(versions).find((key) => versions[key]?.version === requested);
    if (!channel) {
        const available = engineChannels(versions)
            .map((item) => `${item.channel}=${item.version}`)
            .join(', ');
        return { error: `Unknown engine version: ${requested}. Available: ${available}.` };
    }
    return { channel, version: versions[channel]!.version, source: 'explicit' };
};

export { engineChannels, defaultEngineVersion, resolveEngineVersion };
