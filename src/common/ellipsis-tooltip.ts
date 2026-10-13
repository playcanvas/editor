// Lightweight hover tooltip for ellipsis-truncated text. Shows the full value
// after a short, tunable delay — unlike the native `title` attribute, whose
// ~1s delay the browser hard-codes. Delegated, so it survives re-renders and
// needs no per-element setup: any titled element, or any truncated leaf text,
// becomes hoverable. See gh issue 2088.

const SHOW_DELAY = 400; // ms — snappier than native title, deliberate enough not to flicker on a quick pass
const GAP = 6;

let tipEl: HTMLDivElement = null;
let timer: ReturnType<typeof setTimeout> = null;
let active: HTMLElement = null;

const getTip = () => {
    if (!tipEl) {
        tipEl = document.createElement('div');
        tipEl.classList.add('ellipsis-tooltip');
        tipEl.hidden = true;
        document.body.appendChild(tipEl);
    }
    return tipEl;
};

const hide = () => {
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    if (tipEl) {
        tipEl.hidden = true;
    }
    active = null;
};

const place = (el: HTMLElement) => {
    const tip = getTip();
    const r = el.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const left = Math.max(GAP, Math.min(r.left + (r.width - t.width) / 2, window.innerWidth - t.width - GAP));
    let top = r.bottom + GAP;
    if (top + t.height > window.innerHeight - GAP) {
        top = r.top - t.height - GAP;
    }
    tip.style.left = `${left}px`;
    tip.style.top = `${Math.max(GAP, top)}px`;
};

export const installEllipsisTooltips = (root: HTMLElement) => {
    const onOver = (e: PointerEvent) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        let el = target.closest<HTMLElement>('[title], [data-ellipsis-tip]');
        let full: string;
        if (el && root.contains(el)) {
            // migrate the native title once so the slow browser tooltip never fires
            if (el.hasAttribute('title')) {
                el.dataset.ellipsisTip = el.getAttribute('title') ?? '';
                el.removeAttribute('title');
            }
            full = el.dataset.ellipsisTip ?? '';
        } else {
            // a truncated leaf text element shows its (clipped) full text
            el = target;
            full = el.children.length === 0 ? (el.textContent ?? '').trim() : '';
        }
        if (!el || !full || el === active) {
            return;
        }
        const truncated = el.scrollWidth > el.clientWidth + 1;
        // skip fully-visible text whose tooltip would just repeat it
        if (!truncated && full === (el.textContent ?? '').trim()) {
            return;
        }
        hide();
        active = el;
        timer = setTimeout(() => {
            timer = null;
            getTip().textContent = full;
            getTip().hidden = false;
            place(el);
        }, SHOW_DELAY);
    };

    const onOut = (e: PointerEvent) => {
        const to = e.relatedTarget;
        if (active && (!(to instanceof HTMLElement) || !active.contains(to))) {
            hide();
        }
    };

    root.addEventListener('pointerover', onOver);
    root.addEventListener('pointerout', onOut);
    // a moved or scrolled target leaves the tooltip mispositioned
    window.addEventListener('scroll', hide, true);

    return () => {
        root.removeEventListener('pointerover', onOver);
        root.removeEventListener('pointerout', onOut);
        window.removeEventListener('scroll', hide, true);
        hide();
    };
};
