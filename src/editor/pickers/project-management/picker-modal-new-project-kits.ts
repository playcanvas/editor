import { Container, Element, Label } from '@playcanvas/pcui';

import { config } from '@/editor/config';

import { button } from './components/button';

const KIT_SKELETON_COUNT = 8;

// New project on the projects page: the starter kit grid beside the shared project form
editor.once('load', () => {
    const blankProject = {
        name: 'Blank Project',
        description: 'A new blank project.',
        image: `${config.url.frontend}static/img/blank-project-kit.webp`,
        tags: ['games'],

        // the blank template playcanvas.com forks, so new projects start with its scene and settings
        fork_from: 1162945
    };
    const modelViewer = {
        name: 'Model Viewer',
        description: 'A simple viewer application for any 3D model. Just drop the 3D model into the scene to upload.',
        image: `${config.url.frontend}static/img/model-viewer-kit.webp`,
        tags: ['products'],
        fork_from: 446385
    };
    const vr = {
        name: 'VR Kit',
        description: 'An application to get you started quickly creating VR applications in PlayCanvas.',
        image: `${config.url.frontend}static/img/vr-kit.webp`,
        tags: ['immersive'],
        fork_from: 435780
    };
    const blankValues = () => ({
        name: blankProject.name,
        description: blankProject.description,
        private: false,
        fork_from: blankProject.fork_from
    });

    const builtInKits = { 0: blankProject, 446385: modelViewer, 435780: vr };
    let starterKits = { ...builtInKits };

    // kits are cached for the session, like the builds list: reopening shows them instantly
    // and refreshes in the background, rebuilding only when the server list changed
    let renderedKits = null; // signature of the kits in the grid
    let selectedKitElement = null;
    let blankKitElement = null;
    const kitElements = new Map(); // fork id -> kit card

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

    const createStarterKitUI = (starterkit, fork) => {
        const starterKit = new Container({ class: 'starter-kit' });
        kitsContainer.append(starterKit);
        kitElements.set(String(fork), starterKit);
        // Blank project selected by default
        if (starterkit.name === 'Blank Project') {
            blankKitElement = starterKit;
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
            selectedKitElement.class.add('selected');
            editor.call('picker:project:new:select', {
                name: starterKits[fork].name,
                description: starterKits[fork].description,
                private: false,
                fork_from: starterKits[fork].fork_from
            });
        });

        const thumbnail = new Container({ class: 'thumbnail' });
        starterKit.append(thumbnail);
        const image = new Element({ dom: 'img' });
        (image.dom as HTMLImageElement).src = starterkit.image;
        thumbnail.append(image);

        const thumbnailOverlay = new Container({ class: 'overlay' });
        thumbnail.append(thumbnailOverlay);
        const previewButton = button({ kind: 'icon', label: `Preview ${starterkit.name}`, class: 'preview-button' });
        thumbnailOverlay.append(previewButton);
        previewButton.on('click', () => previewProject(starterkit.fork_from));

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
            const kits = { ...builtInKits };
            rawKits.forEach((raw) => {
                kits[raw.project_id] = {
                    name: raw.name,
                    description: raw.description,
                    image: raw.thumbnails.m,
                    tags: raw.tags,
                    fork_from: raw.project_id
                };
            });

            const signature = JSON.stringify(kits);
            if (signature === renderedKits) {
                return;
            }
            renderedKits = signature;
            starterKits = kits;

            // a background refresh keeps a kit the user already picked
            const kept =
                selectedKitElement && selectedKitElement !== blankKitElement
                    ? String(editor.call('picker:project:new:values').fork_from)
                    : null;
            kitElements.clear();
            kitsContainer.clear();
            for (const [fork, starterkit] of Object.entries(starterKits)) {
                createStarterKitUI(starterkit, fork);
            }
            const keptElement = kept && kitElements.get(kept);
            if (keptElement) {
                selectedKitElement.class.remove('selected');
                selectedKitElement = keptElement;
                selectedKitElement.class.add('selected');
            } else if (kept) {
                // the picked kit is gone: fall back to blank, like a fresh open
                editor.call('picker:project:new:select', blankValues());
            }
        });
    };

    // displays the new project modal, starting from the blank kit
    editor.method('picker:project:newProject', () => {
        if (renderedKits) {
            // cached grid: back to the blank kit, matching the form reset below
            selectedKitElement?.class.remove('selected');
            selectedKitElement = blankKitElement;
            selectedKitElement?.class.add('selected');
            mainView.dom.scrollTop = 0;
        } else {
            renderKitSkeleton();
        }
        loadStarterKits();

        editor.call('picker:project:new:open', {
            rootUser: editor.call('picker:project:cms:rootUser'),
            owner: editor.call('picker:project:cms:currentUser'),
            values: blankValues(),
            data: { ...blankProject }
        });
    });
});
