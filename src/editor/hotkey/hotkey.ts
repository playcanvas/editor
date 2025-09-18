import { KeyboardEventKey } from 'keyboard-event-key-type';

import { LegacyList } from '../../common/ui/list.ts';

type HotkeyDefinition = {
    // The physical key i.e. https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
    key: KeyboardEventKey,
    ctrl: boolean,
    shift: boolean,
    alt: boolean,
    callback: (e: KeyboardEvent) => void,
    skipPreventDefault: boolean,
};

type PartialHotkeyDefinition = Partial<HotkeyDefinition> & Pick<HotkeyDefinition, 'key' | 'callback'>;

editor.once('load', () => {
    // State management
    const hotkeys = new Map();
    const modifierState = {
        ctrl: false,
        shift: false,
        alt: false
    };

    // Platform detection
    const isMac = /Mac/.test(navigator.platform);

    // Convert a hotkey registration into a consistent internal format
    function normalizeHotkeyDefinition(definition: PartialHotkeyDefinition): HotkeyDefinition {
        if (!definition.key) {
            throw new Error('Hotkey must specify physical key (KeyboardEvent.code)');
        }
        return {
            key: definition.key,
            ctrl: !!definition.ctrl,
            shift: !!definition.shift,
            alt: !!definition.alt,
            callback: definition.callback,
            skipPreventDefault: !!definition.skipPreventDefault
        };
    }

    // Generate a unique key for the hotkey combination
    function getHotkeyId(definition) {
        return [
            definition.ctrl ? 1 : 0,
            definition.alt ? 1 : 0,
            definition.shift ? 1 : 0,
            definition.key
        ].join('+');
    }

    // Register a new hotkey
    editor.method('hotkey:register', (name: string, definition: PartialHotkeyDefinition) => {
        const normalized = normalizeHotkeyDefinition(definition);
        const id = getHotkeyId(normalized);

        if (!hotkeys.has(id)) {
            hotkeys.set(id, new Map());
        }
        hotkeys.get(id).set(name, normalized);
    });

    // Unregister a hotkey
    editor.method('hotkey:unregister', (name) => {
        for (const [id, bindings] of hotkeys) {
            if (bindings.delete(name) && bindings.size === 0) {
                hotkeys.delete(id);
            }
        }
    });

    // Update modifier state and emit events
    function updateModifierState(evt) {
        const newState = {
            ctrl: evt.ctrlKey || (isMac && evt.metaKey),
            shift: evt.shiftKey,
            alt: evt.altKey
        };

        for (const [key, value] of Object.entries(newState)) {
            if (modifierState[key] !== value) {
                modifierState[key] = value;
                editor.emit(`hotkey:${key}`, value);
            }
        }
    }

    // Handle keydown events
    function handleKeydown(evt: KeyboardEvent) {
        // Ignore if target is input/textarea without hotkeys class
        if (evt.target instanceof HTMLElement) {
            if (
                /^(?:input|textarea)$/i.test(evt.target.tagName) &&
                !evt.target.classList.contains('hotkeys')
            ) {
                return;
            }
        }

        updateModifierState(evt);

        const id = getHotkeyId({
            // We use the physical key which is [`KeyboardEvent#code`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)
            // This prevents issues such as Ctrl+Y not working on German keyboard.
            key: evt.code,
            ctrl: modifierState.ctrl,
            shift: modifierState.shift,
            alt: modifierState.alt
        });

        const bindings = hotkeys.get(id);
        if (bindings) {
            let shouldPreventDefault = true;

            for (const [, hotkey] of bindings) {
                if (hotkey.skipPreventDefault) {
                    shouldPreventDefault = false;
                }
                hotkey.callback(evt);
            }

            if (shouldPreventDefault) {
                evt.preventDefault();
            }
        }
    }

    // Expose modifier state getters
    editor.method('hotkey:ctrl', () => modifierState.ctrl);
    editor.method('hotkey:shift', () => modifierState.shift);
    editor.method('hotkey:alt', () => modifierState.alt);
    editor.method('hotkey:ctrl:string', () => (isMac ? 'Cmd' : 'Ctrl'));

    // Event listeners
    window.addEventListener('keydown', handleKeydown, false);

    // Update modifier state on various events
    ['keyup', 'mousedown', 'mouseup', 'click'].forEach((eventName) => {
        window.addEventListener(eventName, updateModifierState, false);
    });

    // Legacy support
    LegacyList._ctrl = () => modifierState.ctrl;
    LegacyList._shift = () => modifierState.shift;
});
