import { Container, Element, Label } from '@playcanvas/pcui';

import { config } from '@/editor/config';
import type { EditorBlankConfig } from '@/editor-api';

import { button } from './components/button';

const KIT_SKELETON_COUNT = 8;

// the projects the built-in kits fork on this environment; a kit is left out where its id is 0 or missing
const KIT_PROJECTS = (window.config as EditorBlankConfig).starterKits ?? { blank: 0, modelViewer: 0, vr: 0 };

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
    const blankProject = {
        name: 'Blank Project',
        description: 'A scene with a skybox, a cube and a plane to start from.',
        image: `${config.url.frontend}static/img/blank-project-kit.webp`,
        tags: ['games'],

        // the blank template playcanvas.com forks, so new projects start with its scene and settings
        fork_from: KIT_PROJECTS.blank
    };
    const modelViewer = {
        name: 'Model Viewer',
        description: 'A simple viewer application for any 3D model. Just drop the 3D model into the scene to upload.',
        image: `${config.url.frontend}static/img/model-viewer-kit.webp`,
        tags: ['products'],
        fork_from: KIT_PROJECTS.modelViewer
    };
    const vr = {
        name: 'VR Kit',
        description: 'An application to get you started quickly creating VR applications in PlayCanvas.',
        image: `${config.url.frontend}static/img/vr-kit.webp`,
        tags: ['immersive'],
        fork_from: KIT_PROJECTS.vr
    };
    // picked when the grid opens: blank, or empty where there's no blank template
    const DEFAULT_KIT = KIT_PROJECTS.blank ? 'blank' : 'empty';
    const defaultProject = KIT_PROJECTS.blank ? blankProject : emptyProject;
    const defaultValues = () => ({
        name: defaultProject.name,
        description: defaultProject.description,
        private: false,
        fork_from: defaultProject.fork_from
    });

    // the grid's kits by key, in order: empty and blank first, then the starter kits; empty needs no project
    const builtInKits: [string, typeof blankProject][] = (
        [
            ['empty', emptyProject],
            ['blank', blankProject],
            [String(KIT_PROJECTS.modelViewer), modelViewer],
            [String(KIT_PROJECTS.vr), vr]
        ] as [string, typeof blankProject][]
    ).filter(([key, kit]) => key === 'empty' || kit.fork_from);
    let starterKits = new Map(builtInKits);

    // kits are cached for the session, like the builds list: reopening shows them instantly
    // and refreshes in the background, rebuilding only when the server list changed
    let renderedKits = null; // signature of the kits in the grid
    let selectedKitElement = null;
    let selectedKey = DEFAULT_KIT;
    const kitElements = new Map(); // kit key -> kit card

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
            editor.call(
                'picker:project:new:select',
                {
                    name: starterkit.name,
                    description: starterkit.description,
                    private: false,
                    fork_from: starterkit.fork_from
                },
                { ...starterkit }
            );
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
                    image: raw.thumbnails.m,
                    tags: raw.tags,
                    fork_from: raw.project_id
                });
            });

            const signature = JSON.stringify([...kits]);
            if (signature === renderedKits) {
                return;
            }
            renderedKits = signature;
            starterKits = kits;

            // a background refresh keeps the kit the user already picked, or falls back to the default if it's gone
            kitElements.clear();
            kitsContainer.clear();
            if (!starterKits.has(selectedKey)) {
                selectedKey = DEFAULT_KIT;
                editor.call('picker:project:new:select', defaultValues(), { ...defaultProject });
            }
            for (const [key, starterkit] of starterKits) {
                createStarterKitUI(starterkit, key);
            }
        });
    };

    // displays the new project modal, starting from the default kit
    editor.method('picker:project:newProject', () => {
        if (renderedKits) {
            // cached grid: back to the default kit, matching the form reset below
            selectedKitElement?.class.remove('selected');
            selectedKey = DEFAULT_KIT;
            selectedKitElement = kitElements.get(DEFAULT_KIT);
            selectedKitElement?.class.add('selected');
            mainView.dom.scrollTop = 0;
        } else {
            renderKitSkeleton();
        }
        loadStarterKits();

        // the page may still be loading you, so load (or reuse) your user first, like fork does
        editor.call('users:loadOne', config.self.id, (self) => {
            editor.call('picker:project:new:open', {
                rootUser: self,
                owner: editor.call('picker:project:cms:currentUser') ?? self,
                values: defaultValues(),
                data: { ...defaultProject }
            });
        });
    });
});
