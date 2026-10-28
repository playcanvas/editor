// project settings sections by their `tab=` url value
const SECTIONS = new Map([
    ['settings', 'project-main'],
    ['scenes', 'scenes'],
    ['builds', 'builds-publish'],
    ['build', 'build-detail'],
    ['publish', 'publish-new'],
    ['download', 'publish-download'],
    ['team', 'team'],
    ['vc', 'version control'],
    ['log', 'dev-log']
]);
const SLUGS = new Map([...SECTIONS].map(([slug, name]) => [name, slug]));

/**
 * The panel-only sections a link may open; other panels without a menu stay closed to links.
 */
export const PANELS = ['build-detail', 'publish-new', 'publish-download'];

// while set, url changes replace the current history entry, e.g. while back/forward re-apply one
let replacing = false;

/**
 * The internal name of a section from its url value, or null when unknown.
 */
export const sectionName = (slug: string | null) => SECTIONS.get(slug) ?? null;

/**
 * The url value of a section from its internal name, or null when it has none.
 */
export const sectionSlug = (name: string | null) => SLUGS.get(name) ?? null;

/**
 * An href with the given params set (`true` for a bare flag) or removed (null, false or undefined),
 * keeping every other param exactly as written.
 */
export const withParams = (href: string, params: Record<string, string | number | boolean | null | undefined>) => {
    const url = new URL(href);
    const keep = url.search
        .slice(1)
        .split('&')
        .filter((p) => p && !Object.hasOwn(params, p.split('=')[0]));
    const own = Object.entries(params)
        .filter(([, value]) => value !== null && value !== undefined && value !== false)
        .map(([key, value]) => (value === true ? key : `${key}=${encodeURIComponent(value)}`));
    url.search = [...keep, ...own].join('&');
    return url.href;
};

/**
 * The picker state an href names: New project, its kit and whether Create opens the project in this
 * tab (`here`), the project and section of project settings (`open` when any section is named, known or
 * not) and the build whose details show.
 */
export const readUrl = (href: string) => {
    const params = new URL(href).searchParams;
    return {
        new: params.has('new'),
        kit: params.get('kit'),
        here: params.has('here'),
        project: parseInt(params.get('project'), 10) || null,
        section: sectionName(params.get('tab')),
        build: params.get('build'),
        open: params.has('tab')
    };
};

/**
 * Sets params in the page url, adding a history entry unless replace is set or a restore is
 * running; nothing is written when the url wouldn't change.
 */
export const setUrl = (params: Parameters<typeof withParams>[1], replace = replacing) => {
    const href = withParams(location.href, params);
    if (href !== location.href) {
        history[replace ? 'replaceState' : 'pushState'](history.state, '', href);
    }
};

/**
 * Runs fn with url changes replacing the current history entry instead of adding one.
 */
export const inPlace = (fn: () => void) => {
    const prev = replacing;
    replacing = true;
    fn();
    replacing = prev;
};
