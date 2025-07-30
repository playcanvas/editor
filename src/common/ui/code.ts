import { LegacyContainer } from './container.ts';

class LegacyCode extends LegacyContainer {
    constructor() {
        super();
        this.element = document.createElement('pre');
        this._element.classList.add('ui-code');
    }

    set text(value) {
        this._element.textContent = value;
    }

    get text() {
        return this._element.textContent;
    }
}

export { LegacyCode };
