import { Container, Element, Label } from '@playcanvas/pcui';

import { bytesToHuman } from '@/common/utils';
import { EXPORT_JOB_KEY, IMPORT_JOB_KEY } from '@/core/constants';

import { button } from './components/button';

const JOB_POLL_MS = 5000;
// the export bucket deletes files after a day, so an older export has nothing left to download
const EXPORT_TTL_MS = 24 * 60 * 60 * 1000;
const svg = (path: string) =>
    `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
const ICONS = {
    up: svg('M8 11V3M4.5 6.5 8 3l3.5 3.5M3 13h10'),
    down: svg('M8 3v8M4.5 7.5 8 11l3.5-3.5M3 13h10'),
    cog: svg('M2.5 5.5 8 2.5l5.5 3v5L8 13.5l-5.5-3zM8 8l5.5-2.5M8 8v5.5M8 8 2.5 5.5')
};

type CardArgs = {
    title: string;
    icon: keyof typeof ICONS;
    sub?: string;
    // null means the length is unknown
    pct?: number | null;
    note?: string;
};

type JobInfo = {
    status: string;
    created_at?: string;
    modified_at?: string;
    data?: { import_report?: { count: number }; project_id?: number; url?: string };
    messages?: string[];
};

type ImportJob = { id: number; name: string; org: boolean };
type ExportJob = { id: number; name: string; project: number };

// a card per upload, import and export, stacked bottom-right on the projects page and in the editor
editor.once('load', () => {
    const tray = new Container({ class: 'pm-progress-tray' });
    tray.dom.setAttribute('aria-live', 'polite');
    editor.call('layout.root').append(tray);

    const createCard = () => {
        // hidden until it has something to show
        const card = new Container({ class: 'pm-progress-card', hidden: true });
        tray.append(card);

        const head = new Container({ class: 'progress-head' });
        card.append(head);
        const icon = new Element({ class: 'progress-icon' });
        head.append(icon);
        const text = new Container({ class: 'progress-text' });
        head.append(text);
        const title = new Label({ class: 'progress-title' });
        text.append(title);
        const sub = new Label({ class: 'progress-sub' });
        text.append(sub);
        const pct = new Label({ class: 'progress-pct' });
        head.append(pct);

        const track = new Container({ class: 'progress-track' });
        track.dom.setAttribute('role', 'progressbar');
        track.dom.setAttribute('aria-valuemin', '0');
        track.dom.setAttribute('aria-valuemax', '100');
        card.append(track);
        const fill = new Element({ class: 'progress-fill' });
        track.append(fill);

        const note = new Label({ class: 'progress-note' });
        card.append(note);

        const actions = new Container({ class: 'progress-actions', hidden: true });
        card.append(actions);
        const dismiss = button({ kind: 'secondary', size: 'sm', text: 'Dismiss' });
        actions.append(dismiss);
        const download = button({ kind: 'primary', size: 'sm', text: 'Download' });
        actions.append(download);

        return {
            show: (args: CardArgs) => {
                const value = args.pct ?? null;
                icon.dom.innerHTML = ICONS[args.icon];
                title.text = args.title;
                sub.text = args.sub ?? '';
                pct.text = value === null ? '' : `${Math.round(value)}%`;
                track.class[value === null ? 'add' : 'remove']('indeterminate');
                track.dom.setAttribute('aria-valuenow', `${value === null ? '' : Math.round(value)}`);
                fill.dom.style.width = value === null ? '' : `${value}%`;
                note.text = args.note ?? '';
                note.hidden = !args.note;
                card.hidden = false;
            },

            // server jobs report no progress, so the card counts the time since `since`; returns a stop function
            clock: (since = Date.now()) => {
                const tick = () => {
                    const s = Math.max(0, Math.floor((Date.now() - since) / 1000));
                    const pad = (n: number) => `${n}`.padStart(2, '0');
                    const [h, m] = [Math.floor(s / 3600), Math.floor((s % 3600) / 60)];
                    pct.text = `${h ? `${h}:${pad(m)}` : m}:${pad(s % 60)}`;
                };
                tick();
                const id = setInterval(tick, 1000);
                return () => clearInterval(id);
            },

            // swaps the bar for Dismiss and, with a url, Download, then closes once one is clicked. the
            // download opens from the click itself, since a popup opened when a long job ends gets blocked
            offer: (url: string | null) =>
                new Promise<void>((resolve) => {
                    track.hidden = true;
                    pct.text = '';
                    download.hidden = !url;
                    actions.hidden = false;
                    download.on('click', () => {
                        window.open(url, '_blank');
                        card.destroy();
                        resolve();
                    });
                    dismiss.on('click', () => {
                        card.destroy();
                        resolve();
                    });
                }),

            // draws the eye to a card that's already showing
            flash: () => {
                card.dom.scrollIntoView({ block: 'nearest' });
                card.class.remove('flash');
                void card.dom.offsetWidth;
                card.class.add('flash');
            },

            remove: () => card.destroy()
        };
    };

    // running jobs are kept so a reload can show them again
    const saved = <T extends { id: number }>(key: string): T[] => {
        const list = editor.call('localStorage:get', key);
        return Array.isArray(list) ? list : [];
    };
    // a job already saved keeps its place, so cards come back in the order the jobs started
    const save = (key: string, job: { id: number }) => {
        const list = saved(key);
        if (!list.some((j) => j.id === job.id)) {
            editor.call('localStorage:set', key, [...list, job]);
        }
    };
    const unsave = (key: string, id: number) => {
        editor.call(
            'localStorage:set',
            key,
            saved(key).filter((j) => j.id !== id)
        );
    };

    // resolves once a job ends; the job update announces it, the poll covers one that was missed or came before we listened
    const waitForJob = (id: number) =>
        new Promise<JobInfo>((resolve) => {
            let poll = null;
            let jobEvent = null;
            const check = async () => {
                let info = null;
                try {
                    info = await editor.call('projects:getJobStatus', id);
                } catch {
                    // a failed read is retried on the next tick
                    return;
                }
                if (poll && (info.status === 'complete' || info.status === 'error')) {
                    clearInterval(poll);
                    poll = null;
                    jobEvent.unbind();
                    resolve(info);
                }
            };
            jobEvent = editor.on('messenger:job.update', (msg) => msg.job.id === id && check());
            poll = setInterval(check, JOB_POLL_MS);
            check();
        });

    // `since` is when the job started, so a resumed job's clock carries on
    const watchImport = async (card: ReturnType<typeof createCard>, job: ImportJob, since = Date.now()) => {
        save(IMPORT_JOB_KEY, job);
        card.show({
            title: `Importing ${job.name}`,
            icon: 'cog',
            sub: "Upload complete. The import continues on the server, so closing this tab won't cancel it."
        });
        const stop = card.clock(since);
        const info = await waitForJob(job.id);
        stop();
        unsave(IMPORT_JOB_KEY, job.id);

        if (info.status !== 'complete') {
            card.show({
                title: `Could not import ${job.name}`,
                icon: 'cog',
                sub: info.messages?.[0] || 'The import failed. Try again.'
            });
            await card.offer(null);
            return;
        }
        card.remove();
        const report = info.data.import_report?.count ? info.data.import_report : null;
        if (job.org) {
            // organization viewers have no access to the new project, so list it instead of opening it
            editor.emit('projects:changed');
            if (report) {
                editor.call('picker:project:newProjectConfirmation', null, report);
            }
        } else {
            editor.call('picker:project:newProjectConfirmation', info.data.project_id, report);
        }
    };

    // the card for each project being exported, so exporting one again brings its card up instead
    const exports = new Map<number, ReturnType<typeof createCard>>();

    const watchExport = async (card: ReturnType<typeof createCard>, job: ExportJob, since = Date.now()) => {
        exports.set(job.project, card);
        save(EXPORT_JOB_KEY, job);
        card.show({
            title: `Exporting ${job.name}`,
            icon: 'down',
            sub: "Preparing the download. Closing this tab won't cancel it."
        });
        const stop = card.clock(since);
        const info = await waitForJob(job.id);
        stop();

        const ok = info.status === 'complete';
        if (!ok || Date.now() - Date.parse(info.modified_at) <= EXPORT_TTL_MS) {
            card.show(
                ok
                    ? { title: `${job.name} is ready`, icon: 'down', sub: 'Your export has finished.' }
                    : {
                          title: `Could not export ${job.name}`,
                          icon: 'down',
                          sub: info.messages?.[0] || 'The export failed. Try again.'
                      }
            );
            // the card stays until you download or dismiss it, and a reload shows it again
            await card.offer(ok ? info.data.url : null);
        } else {
            card.remove();
        }
        unsave(EXPORT_JOB_KEY, job.id);
        exports.delete(job.project);
    };

    // uploads a project export and imports it, on a card of its own
    editor.method('progress:card:import', async (file: File, importer: { id: number; organization?: unknown }) => {
        const card = createCard();
        const size = bytesToHuman(file.size);
        const upload = (pct: number) =>
            card.show({
                title: `Uploading ${file.name}`,
                icon: 'up',
                sub: `${bytesToHuman((file.size * pct) / 100)} of ${size}`,
                pct,
                note: 'Keep this tab open until the upload finishes.'
            });
        upload(0);

        try {
            // progress returned by Ajax is in range 0-1
            const result = await editor.invoke('projects:uploadExport', file, (progress: number) =>
                upload(progress * 100)
            );
            const job = await editor.call('projects:importNew', result.s3Key, importer.id);
            await watchImport(card, {
                id: job.id,
                name: file.name.replace(/\.zip$/i, ''),
                org: !!importer.organization
            });
        } catch (error) {
            if (error) {
                console.error(error);
            }
            card.show({ title: `Could not import ${file.name}`, icon: 'up', sub: 'The upload failed. Try again.' });
            await card.offer(null);
        }
    });

    // exports a project on a card of its own, or brings up its card if it's already exporting
    editor.method('progress:card:export', (project: { id: number; name: string }, branchId?: string) => {
        const running = exports.get(project.id);
        if (running) {
            running.flash();
            return;
        }

        const card = createCard();
        exports.set(project.id, card);
        card.show({ title: `Exporting ${project.name}`, icon: 'down', sub: 'Preparing the download' });
        editor.call(
            'projects:export',
            project.id,
            branchId,
            (job: { id: number }) => watchExport(card, { id: job.id, name: project.name, project: project.id }),
            async (err: unknown) => {
                card.show({ title: `Could not export ${project.name}`, icon: 'down', sub: `${err}` });
                await card.offer(null);
                exports.delete(project.id);
            }
        );
    });

    // a reload loses the page, not the jobs: pick each saved one back up
    const resume = <T extends { id: number }>(
        key: string,
        watch: (card: ReturnType<typeof createCard>, job: T, since: number) => Promise<void>
    ) => {
        saved<T>(key).forEach(async (job) => {
            // made now, so the cards stack in the order the jobs started rather than the order their status loads
            const card = createCard();
            let info: JobInfo = null;
            try {
                info = await editor.call('projects:getJobStatus', job.id);
            } catch {
                // a job that can't be read is gone
                unsave(key, job.id);
                card.remove();
                return;
            }
            // the job's start keeps the clock right across the reload
            await watch(card, job, Date.parse(info.created_at) || Date.now());
        });
    };
    resume<ImportJob>(IMPORT_JOB_KEY, watchImport);
    resume<ExportJob>(EXPORT_JOB_KEY, watchExport);
});
