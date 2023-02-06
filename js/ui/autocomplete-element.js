function AutoCompleteElement() {
    ui.Element.call(this);

    this.element = document.createElement('div');
    this._element.classList.add('ui-autocomplete', 'hidden');

    this._inputField = null;
    this._inputFieldPosition = null;

    this.innerElement = document.createElement('ul');
    this._element.appendChild(this.innerElement);

    // list of strings to show in the dropdown
    this._items = null;

    // child li elements
    this._childElements = null;

    // elements that are currently shown
    this._visibleElements = null;

    this._highlightedElement = null;

    this._filter = '';
}

AutoCompleteElement.prototype = Object.create(ui.Element.prototype);

// Get / Set list of strings to show in the dropdown
Object.defineProperty(AutoCompleteElement.prototype, 'items', {
    get: function () {
        return this._items;
    },

    set: function (value) {
        // delete existing elements
        if (this._childElements) {
            this._childElements.forEach(function (element) {
                element.parentElement.removeChild(element);
            });

            this._childElements = null;
            this._highlight(null);
        }

        this._items = value;

        if (value) {
            // sort items
            this._items.sort();

            // create new li elements for each string
            this._childElements = [];
            this._visibleElements = [];
            value.forEach(function (item) {
                var element = document.createElement('li');
                element.innerHTML = item;
                this._childElements.push(element);
                this._visibleElements.push(element);
                this.innerElement.appendChild(element);

                // click
                element.addEventListener('mousedown', function (e) {
                    e.preventDefault(); // prevent blur
                    this._select(element);
                }.bind(this), true);

                // hover
                element.addEventListener('mouseover', function () {
                    this._highlight(element, true);
                }.bind(this));

            }.bind(this));
        }
    }
});

// True if the autocomplete is visible and has a highlighted element
Object.defineProperty(AutoCompleteElement.prototype, 'isFocused', {
    get: function () {
        return !this.hidden && this._highlightedElement;
    }
});

// Attach the autocomplete element to an input field
AutoCompleteElement.prototype.attach = function (inputField) {
    this._inputField = inputField;

    // set 'relative' position
    this._inputFieldPosition = inputField.style.position;
    inputField.style.position = 'relative';
    inputField.element.appendChild(this.element);

    // fire 'change' on every keystroke
    inputField.keyChange = true;

    // add event handlers
    inputField.element.addEventListener('keydown', this.onInputKey.bind(this));
    inputField.element.addEventListener('blur', this.onInputBlur.bind(this));
    inputField.elementInput.addEventListener('blur', this.onInputBlur.bind(this));
    inputField.on('change', this.onInputChange.bind(this));
};

// Detach event handlers and clear the attached input field
AutoCompleteElement.prototype.detach = function () {
    if (!this._inputField) return;

    this._inputField.style.position = this._inputFieldPosition;
    this._inputField.element.removeChild(this.element);

    this._inputField.off('change', this.onInputChange.bind(this));
    this._inputField.element.removeEventListener('keydown', this.onInputKey.bind(this));
    this._inputField.elementInput.removeEventListener('blur', this.onInputBlur.bind(this));

    this._inputField = null;
};

AutoCompleteElement.prototype.onInputKey = function (e) {
    var index;

    // enter: select highlighted element
    if (e.keyCode === 13) {
        if (!this.hidden && this._highlightedElement) {
            this._select(this._highlightedElement);
        }
    } else if (e.keyCode === 38) {
        // up: show dropdown or move highlight up
        if (this.hidden) {
            this.filter(this._inputField.value);
        } else {
            if (this._highlightedElement) {
                index = this._visibleElements.indexOf(this._highlightedElement) - 1;
                if (index < 0) {
                    index = this._visibleElements.length - 1;
                }
            } else {
                index = this._visibleElements.length - 1;
            }

            this._highlight(this._visibleElements[index]);
        }
    } else if (e.keyCode === 40) {
        // down: show dropdown or move highlight down
        if (this.hidden) {
            this.filter(this._inputField.value);
        } else {
            if (this._highlightedElement) {
                index = this._visibleElements.indexOf(this._highlightedElement) + 1;
                if (index >= this._visibleElements.length) {
                    index = 0;
                }
            } else {
                index = 0;
            }

            this._highlight(this._visibleElements[index]);
        }
    }
};

AutoCompleteElement.prototype.onInputBlur = function () {
    // hide the dropdown in a timeout
    // to avoid conflicts with key handlers
    // setTimeout(function () {
    //     this.hidden = true;
    // }.bind(this), 50);
};

AutoCompleteElement.prototype.onInputChange = function (value) {
    // filter based on new input field value
    if (value !== this._filter) {
        this.filter(value);
    }
};

// Only show elements that start with the specified value
AutoCompleteElement.prototype.filter = function (value) {
    if (!this._childElements) return;

    this.hidden = false;

    this._filter = value;

    this._visibleElements = [];

    value = value.toLowerCase();

    this._childElements.forEach(function (element, i) {
        if (value && element.innerHTML.toLowerCase().indexOf(value) === 0) {
            element.classList.remove('hidden');
            this._visibleElements.push(element);
        } else {
            element.classList.add('hidden');
            if (element === this._highlightedElement)
                this._highlight(null);
        }
    }.bind(this));
};

// Highlight specified element
AutoCompleteElement.prototype._highlight = function (element, silent) {
    // unhighlight previous element
    if (this._highlightedElement === element) return;

    if (this._highlightedElement)
        this._highlightedElement.classList.remove('selected');

    this._highlightedElement = element;

    if (element) {
        element.classList.add('selected');

        if (!silent) {
            this.emit('highlight', element.innerHTML);
        }
    }
};

// Select specified element
AutoCompleteElement.prototype._select = function (element) {
    if (this._inputField) {
        this._inputField.value = element.innerHTML;
        this._inputField.elementInput.focus();
    }

    this.emit('select', element.innerHTML);

    // hide in a timeout to avoid conflicts with key handlers
    setTimeout(function () {
        this.hidden = true;
    }.bind(this));
};

window.ui.AutoCompleteElement = AutoCompleteElement;
