import { LegacyElement } from './element.ts';

class LegacyContainer extends LegacyElement {
    constructor() {
        super();
        this._innerElement = null;
        this._observerChanged = false;

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

    set innerElement(value) {
        if (this._innerElement) {
            this._observer.disconnect();
        }

        this._innerElement = value;
        this._observer.observe(this._innerElement, this._observerOptions);
    }

    get innerElement() {
        return this._innerElement;
    }

    set flexible(value) {
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

    set flex(value) {
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

    set flexDirection(value) {
        this._innerElement.style.flexDirection = value;
        this._innerElement.style.WebkitFlexDirection = value;
    }

    get flexDirection() {
        return this._innerElement.style.flexDirection;
    }

    set flexWrap(value) {
        this.flex = true;
        this._innerElement.style.flexWrap = value;
        this._innerElement.style.WebkitFlexWrap = value;
    }

    get flexWrap() {
        return this._innerElement.style.flexWrap;
    }

    set flexGrow(value) {
        if (value) {
            this.flex = true;
        }

        this._element.style.flexGrow = value ? 1 : 0;
        this._element.style.WebkitFlexGrow = value ? 1 : 0;
        this._innerElement.style.flexGrow = this._element.style.flexGrow;
        this._innerElement.style.WebkitFlexGrow = this._element.style.flexGrow;
    }

    get flexGrow() {
        return this._element.style.flexGrow === 1;
    }

    set flexShrink(value) {
        if (value) {
            this.flex = true;
        }

        this._element.style.flexShrink = value ? 1 : 0;
        this._element.style.WebkitFlexShrink = value ? 1 : 0;
        this._innerElement.style.flexShrink = this._element.style.flexShrink;
        this._innerElement.style.WebkitFlexShrink = this._element.style.flexShrink;
    }

    get flexShrink() {
        return this._element.style.flexShrink === 1;
    }

    set scroll(value) {
        this.class.add('scrollable');
    }

    get scroll() {
        return this.class.contains('scrollable');
    }

    append(element) {
        const html = (element instanceof HTMLElement);
        const node = html ? element : element.element;

        this._innerElement.appendChild(node);

        if (!html) {
            element.parent = this;
            this.emit('append', element);
        }
    }

    appendBefore(element, reference) {
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

    appendAfter(element, reference) {
        const html = (element instanceof HTMLElement);
        const node = html ? element : element.element;

        if (reference instanceof LegacyElement) {
            reference = reference.element;
        }

        reference = reference.nextSibling;

        if (reference) {
            this._innerElement.insertBefore(node, reference);
        } else {
            this._innerElement.appendChild(node);
        }

        if (!html) {
            element.parent = this;
            this.emit('append', element);
        }
    }

    prepend(element) {
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

    remove(element) {
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

LegacyContainer.prototype._observerOptions = {
    childList: true,
    attributes: true,
    characterData: false,
    subtree: true,
    attributeOldValue: false,
    characterDataOldValue: false
};

export { LegacyContainer };
