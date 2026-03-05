import { LegacyElement } from './element';

const OBSERVER_OPTIONS = {
    childList: true,
    attributes: true,
    characterData: false,
    subtree: true,
    attributeOldValue: false,
    characterDataOldValue: false
};

type FlexStyle = CSSStyleDeclaration & {
    WebkitFlexDirection: string;
    WebkitFlexWrap: string;
    WebkitFlexGrow: string;
    WebkitFlexShrink: string;
};

class LegacyContainer extends LegacyElement {
    protected _observer: MutationObserver;

    protected _observerChanged: boolean;

    protected _observerOptions: Record<string, boolean>;

    constructor() {
        super();
        this._innerElement = null;
        this._observerChanged = false;
        this._observerOptions = OBSERVER_OPTIONS;

        const observerTimeout = () => {
            this._observerChanged = false;
            this.emit('nodesChanged');
        };

        this._observer = new MutationObserver(() => {
            if (this._observerChanged) {
                return;
            }

            this._observerChanged = true;
            setTimeout(observerTimeout, 0);
        });
    }

    set innerElement(value: HTMLElement & { ui: unknown }) {
        if (this._innerElement) {
            this._observer.disconnect();
        }

        this._innerElement = value;
        this._observer.observe(this._innerElement, this._observerOptions);
    }

    get innerElement() {
        return this._innerElement;
    }

    set flexible(value: boolean) {
        if (this._element.classList.contains('flexible') === !!value) {
            return;
        }

        if (value) {
            this._element.classList.add('flexible');
        } else {
            this._element.classList.remove('flexible');
        }
    }

    get flexible() {
        return this._element.classList.contains('flexible');
    }

    set flex(value: boolean) {
        if (this._element.classList.contains('flex') === !!value) {
            return;
        }

        if (value) {
            this._element.classList.add('flex');
        } else {
            this._element.classList.remove('flex');
        }
    }

    get flex() {
        return this._element.classList.contains('flex');
    }

    set flexDirection(value: string) {
        this._innerElement.style.flexDirection = value;
        (this._innerElement.style as FlexStyle).WebkitFlexDirection = value;
    }

    get flexDirection() {
        return this._innerElement.style.flexDirection;
    }

    set flexWrap(value: string) {
        this.flex = true;
        this._innerElement.style.flexWrap = value;
        (this._innerElement.style as FlexStyle).WebkitFlexWrap = value;
    }

    get flexWrap() {
        return this._innerElement.style.flexWrap;
    }

    set flexGrow(value: boolean | number | string) {
        if (value) {
            this.flex = true;
        }

        this._element.style.flexGrow = value ? '1' : '0';
        (this._element.style as FlexStyle).WebkitFlexGrow = value ? '1' : '0';
        this._innerElement.style.flexGrow = this._element.style.flexGrow;
        (this._innerElement.style as FlexStyle).WebkitFlexGrow = this._element.style.flexGrow;
    }

    get flexGrow() {
        return (this._element.style.flexGrow as unknown) === 1;
    }

    set flexShrink(value: boolean | number | string) {
        if (value) {
            this.flex = true;
        }

        this._element.style.flexShrink = value ? '1' : '0';
        (this._element.style as FlexStyle).WebkitFlexShrink = value ? '1' : '0';
        this._innerElement.style.flexShrink = this._element.style.flexShrink;
        (this._innerElement.style as FlexStyle).WebkitFlexShrink = this._element.style.flexShrink;
    }

    get flexShrink() {
        return (this._element.style.flexShrink as unknown) === 1;
    }

    set scroll(value: boolean) {
        this.class.add('scrollable');
    }

    get scroll() {
        return this.class.contains('scrollable');
    }

    append(element: HTMLElement | LegacyElement) {
        const html = (element instanceof HTMLElement);
        const node = html ? element : element.element;

        this._innerElement.appendChild(node);

        if (!html) {
            element.parent = this;
            this.emit('append', element);
        }
    }

    appendBefore(element: HTMLElement | LegacyElement, reference: HTMLElement | LegacyElement) {
        const html = (element instanceof HTMLElement);
        const node = html ? element : element.element;

        if (reference instanceof LegacyElement) {
            reference = reference.element;
        }

        this._innerElement.insertBefore(node, reference);

        if (!html) {
            element.parent = this;
            this.emit('append', element);
        }
    }

    appendAfter(element: HTMLElement | LegacyElement, reference: HTMLElement | LegacyElement) {
        const html = (element instanceof HTMLElement);
        const node = html ? element : element.element;

        if (reference instanceof LegacyElement) {
            reference = reference.element;
        }

        const next = reference.nextSibling;

        if (next) {
            this._innerElement.insertBefore(node, next);
        } else {
            this._innerElement.appendChild(node);
        }

        if (!html) {
            element.parent = this;
            this.emit('append', element);
        }
    }

    prepend(element: HTMLElement | LegacyElement) {
        const first = this._innerElement.firstChild;
        const html = (element instanceof HTMLElement);
        const node = html ? element : element.element;

        if (first) {
            this._innerElement.insertBefore(node, first);
        } else {
            this._innerElement.appendChild(node);
        }

        if (!html) {
            element.parent = this;
            this.emit('append', element);
        }
    }

    remove(element: HTMLElement | LegacyElement) {
        const html = (element instanceof HTMLElement);
        const node = html ? element : element.element;

        if (!node.parentNode || node.parentNode !== this._innerElement) {
            return;
        }

        this._innerElement.removeChild(node);

        if (!html) {
            element.parent = null;
            this.emit('remove', element);
        }
    }

    clear() {
        let i, node;

        this._observer.disconnect();

        i = this._innerElement.childNodes.length;
        while (i--) {
            node = this._innerElement.childNodes[i];

            if (!node.ui) {
                continue;
            }

            node.ui.destroy();
        }
        this._innerElement.innerHTML = '';

        this._observer.observe(this._innerElement, this._observerOptions);
    }
}

export { LegacyContainer };
