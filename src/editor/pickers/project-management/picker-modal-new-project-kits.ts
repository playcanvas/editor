import { Container, Element, Label } from '@playcanvas/pcui';

import { config } from '@/editor/config';

import { setUrl } from '../picker-url';

import { button } from './components/button';

const KIT_SKELETON_COUNT = 8;

// the key of the one kit that isn't a project
const EMPTY_KIT = 'empty';

// New project on the projects page: the starter kit grid beside the shared project form
editor.once('load', () => {
    // a project with nothing in it: no fork, just a new project
    const emptyProject = {
        name: 'Empty Project',
        description: 'A project with nothing in it.',
        image: `${config.url.frontend}static/img/blank-project.webp`,
        tags: ['games'],
        fork_from: null
    };
    const kitValues = (kit: typeof emptyProject) => ({
        name: kit.name,
        description: kit.description,
        private: false,
        fork_from: kit.fork_from
    });

    // the grid's kits by key: empty first, then the starter kits keyed by project id, in the server's order
    const builtInKits: [string, typeof emptyProject][] = [[EMPTY_KIT, emptyProject]];
    let starterKits = new Map(builtInKits);

    // kits are cached for the session, like the builds list: reopening shows them instantly
    // and refreshes in the background, rebuilding only when the server list changed
    let renderedKits = null; // signature of the kits in the grid
    let selectedKitElement = null;
    let selectedKey = EMPTY_KIT;
    const kitElements = new Map(); // kit key -> kit card
    let open = false; // New project is up; the fork dialog shares its frame, so this can't ask the picker
    let linkedKit: string | null = null; // a kit a link asks for, picked once the kits are listed
    let here = false; // `?new&here`: Create opens the new project in this tab, with no confirmation

    // the default kit: the first starter kit, as the server orders them, or empty when there are none
    const firstKit = () => [...starterKits.keys()][1] ?? EMPTY_KIT;

    const selectKit = (key: string) => {
        const kit = starterKits.get(key) ?? emptyProject;
        editor.call('picker:project:new:select', kitValues(kit), { ...kit });
    };

    // a kit in the url: the project it forks, or `empty`
    const kitParam = (key: string) => `${starterKits.get(key)?.fork_from ?? 'empty'}`;

    // picks the linked kit once the kits are listed; when it isn't one, the default stays and leaves the url
    const pickLinked = () => {
        if (!linkedKit || !renderedKits) {
            return;
        }
        const key = [...starterKits.keys()].find((k) => kitParam(k) === linkedKit);
        linkedKit = null;
        if (key) {
            kitElements.get(key)?.dom.click();
        } else {
            setUrl({ kit: null }, true);
        }
    };

    const mainView = editor.call('picker:project:new:mainView');
    mainView.append(new Label({ class: 'modal-new-project-heading', text: 'Start from a kit' }));
    const kitsContainer = new Container({ class: 'modal-new-project-kits-container' });
    mainView.append(kitsContainer);

    // opens the kit's published app, or its project page when it has none (like the blank template)
    const previewProject = (projectId) => {
        editor.call(
            'projects:getOne',
            projectId,
            (response) => {
                window.open(response.primary_app_url ?? `${config.url.home}/project/${projectId}`, '_blank');
            },
            (err) => {
                editor.call('picker:project:buildAlert', mainView, err);
            }
        );
    };

    const createStarterKitUI = (starterkit, key: string) => {
        const starterKit = new Container({ class: 'starter-kit' });
        kitsContainer.append(starterKit);
        kitElements.set(key, starterKit);
        // the picked kit, the default one on first open
        if (key === selectedKey) {
            selectedKitElement = starterKit;
            selectedKitElement.class.add('selected');
        }

        // a focusable choice: Enter or Space picks it like a click
        starterKit.dom.tabIndex = 0;
        starterKit.dom.setAttribute('role', 'button');
        starterKit.dom.setAttribute('aria-label', starterkit.name);
        starterKit.dom.addEventListener('keydown', (e) => {
            if (e.target === starterKit.dom && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                starterKit.dom.click();
            }
        });

        starterKit.dom.addEventListener('click', () => {
            selectedKitElement?.class.remove('selected');
            selectedKitElement = starterKit;
            selectedKey = key;
            selectedKitElement.class.add('selected');
            setUrl({ kit: kitParam(key) }, true);
            selectKit(key);
        });

        const thumbnail = new Container({ class: 'thumbnail' });
        starterKit.append(thumbnail);
        const image = new Element({ dom: 'img' });
        (image.dom as HTMLImageElement).src = starterkit.image;
        thumbnail.append(image);

        const thumbnailOverlay = new Container({ class: 'overlay' });
        thumbnail.append(thumbnailOverlay);
        // an empty project has nothing to preview
        if (starterkit.fork_from) {
            const previewButton = button({
                kind: 'icon',
                label: `Preview ${starterkit.name}`,
                class: 'preview-button'
            });
            thumbnailOverlay.append(previewButton);
            previewButton.on('click', () => previewProject(starterkit.fork_from));
        }

        const title = new Element({ dom: 'h4' });
        title.dom.textContent = starterkit.name;
        starterKit.append(title);
        starterKit.append(new Label({ class: 'kit-desc', text: starterkit.description }));
    };

    // pulsing placeholders until the first kit list arrives
    const renderKitSkeleton = () => {
        kitsContainer.clear();
        for (let i = 0; i < KIT_SKELETON_COUNT; i++) {
            const card = new Container({ class: ['starter-kit', 'skeleton'] });
            for (const cls of ['thumb', 'title', 'line']) {
                card.append(new Element({ class: ['kit-bone', cls] }));
            }
            kitsContainer.append(card);
        }
    };

    const loadStarterKits = () => {
        editor.call('projects:listStarterKits', (rawKits) => {
            const kits = new Map(builtInKits);
            rawKits.forEach((raw) => {
                kits.set(String(raw.project_id), {
                    name: raw.name,
                    description: raw.description,
                    image: raw.thumbnails?.m ?? `${config.url.frontend}static/img/blank-project-kit.webp`,
                    tags: raw.tags,
                    fork_from: raw.project_id
                });
            });

            const signature = JSON.stringify([...kits]);
            if (signature !== renderedKits) {
                const keep = !!renderedKits && kits.has(selectedKey);
                renderedKits = signature;
                starterKits = kits;

                // the first list starts on the default kit; a background refresh keeps the kit the user
                // already picked, or falls back to the default if it's gone
                kitElements.clear();
                kitsContainer.clear();
                const next = keep ? selectedKey : firstKit();
                if (next !== selectedKey) {
                    selectedKey = next;

                    // the form isn't up yet: opening it fills it from the selected kit
                    if (open) {
                        selectKit(next);
                    }
                }
                for (const [key, starterkit] of starterKits) {
                    createStarterKitUI(starterkit, key);
                }
            }
            if (open) {
                pickLinked();
            }
        });
    };

    editor.method('picker:project:new:here', () => here);

    // displays the new project modal, starting from the default kit or a linked one
    editor.method('picker:project:newProject', (kit: string | null = null, inTab = false) => {
        linkedKit = kit;
        here = inTab;
        setUrl({ new: true, kit, here });
        if (renderedKits) {
            // cached grid: back to the default kit, matching the form reset below
            selectedKitElement?.class.remove('selected');
            selectedKey = firstKit();
            selectedKitElement = kitElements.get(selectedKey);
            selectedKitElement?.class.add('selected');
            mainView.dom.scrollTop = 0;
        } else {
            renderKitSkeleton();
        }
        loadStarterKits();

        // the page may still be loading you, so load (or reuse) your user first, like fork does
        editor.call('users:loadOne', config.self.id, (self) => {
            const kit = starterKits.get(selectedKey) ?? emptyProject;
            editor.call('picker:project:new:open', {
                rootUser: self,
                owner: editor.call('picker:project:cms:currentUser') ?? self,
                values: kitValues(kit),
                data: { ...kit }
            });
            open = true;
            pickLinked();
        });
    });

    editor.on('picker:close', (name: string) => {
        if (open && name === 'dialog:picker-project-new') {
            open = false;
            linkedKit = null;
            here = false;
            setUrl({ new: null, kit: null, here: null });
        }
    });

    // the url's New project: open it on its kit, or close it
    editor.on('picker:url', ({ new: create, kit, here: inTab }) => {
        if (create && !open) {
            editor.call('picker:project:newProject', kit, inTab);
        } else if (!create && open) {
            editor.call('picker:project:new:close');
        }
    });
});
