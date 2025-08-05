// Editor Engine version
export const ENGINE_VERSION = typeof pc !== 'undefined' ? `${pc.version}` : '0.0.0';

// Gizmo size
export const GIZMO_SIZE = 1.2;

// Gizmo mask
export const GIZMO_MASK = 8;

// Layer ids
export const LAYERID_WORLD = 0;
export const LAYERID_DEPTH = 1;
export const LAYERID_SKYBOX = 2;
export const LAYERID_IMMEDIATE = 3;
export const LAYERID_UI = 4;

// Gamma correction modes
export const GAMMA_NONE = 0;
export const GAMMA_SRGB = 1;

// Tonemapping modes
export const TONEMAPPING = [
    'Linear',
    'Filmic',
    'Hejl',
    'ACES',
    'ACES2',
    'Neutral'
];

// Layout groups
export const ORIENTATION_HORIZONTAL = 0;
export const ORIENTATION_VERTICAL = 1;
export const FITTING_NONE = 0;
export const FITTING_STRETCH = 1;
export const FITTING_SHRINK = 2;
export const FITTING_BOTH = 3;

// Buttons
export const BUTTON_TRANSITION_MODE_TINT = 0;
export const BUTTON_TRANSITION_MODE_SPRITE_CHANGE = 1;

// Scroll Views
export const SCROLL_MODE_CLAMP = 0;
export const SCROLL_MODE_BOUNCE = 1;
export const SCROLL_MODE_INFINITE = 2;

export const SCROLLBAR_VISIBILITY_SHOW_ALWAYS = 0;
export const SCROLLBAR_VISIBILITY_SHOW_WHEN_REQUIRED = 1;


export const CURVE_LINEAR = 0;
export const CURVE_SMOOTHSTEP = 1;
export const CURVE_CATMULL = 2;
export const CURVE_CARDINAL = 3;
export const CURVE_SPLINE = 4;
export const CURVE_STEP = 5;

// Script Loading Type
export const LOAD_SCRIPT_AS_ASSET = 0;
export const LOAD_SCRIPT_BEFORE_ENGINE = 1;
export const LOAD_SCRIPT_AFTER_ENGINE = 2;

// Anim system constants
export const ANIM_INTERRUPTION_NONE = 'NONE';
export const ANIM_INTERRUPTION_PREV = 'PREV_STATE';
export const ANIM_INTERRUPTION_NEXT = 'NEXT_STATE';
export const ANIM_INTERRUPTION_PREV_NEXT = 'PREV_STATE_NEXT_STATE';
export const ANIM_INTERRUPTION_NEXT_PREV = 'NEXT_STATE_PREV_STATE';

export const ANIM_GREATER_THAN = 'GREATER_THAN';
export const ANIM_LESS_THAN = 'LESS_THAN';
export const ANIM_GREATER_THAN_EQUAL_TO = 'GREATER_THAN_EQUAL_TO';
export const ANIM_LESS_THAN_EQUAL_TO = 'LESS_THAN_EQUAL_TO';
export const ANIM_EQUAL_TO = 'EQUAL_TO';
export const ANIM_NOT_EQUAL_TO = 'NOT_EQUAL_TO';

export const ANIM_PARAMETER_INTEGER = 'INTEGER';
export const ANIM_PARAMETER_FLOAT = 'FLOAT';
export const ANIM_PARAMETER_BOOLEAN = 'BOOLEAN';
export const ANIM_PARAMETER_TRIGGER = 'TRIGGER';

// VERSION CONTROL
export const MERGE_STATUS_AUTO_STARTED = 'merge_auto_started';
export const MERGE_STATUS_AUTO_ENDED = 'merge_auto_ended';
export const MERGE_STATUS_APPLY_STARTED = 'merge_apply_started';
export const MERGE_STATUS_APPLY_ENDED = 'merge_apply_ended';
export const MERGE_STATUS_READY_FOR_REVIEW = 'merge_ready_for_review';

// LOGOS
export const COMPONENT_LOGOS = {
    'anim': 'E198',
    'animation': 'E198',
    'audiolistener': 'E196',
    'audiosource': 'E197',
    'sound': 'E197',
    'camera': 'E212',
    'collision': 'E187',
    'directional': 'E192',
    'point': 'E191',
    'spot': 'E193',
    'light': 'E194',
    'model': 'E188',
    'particlesystem': 'E199',
    'rigidbody': 'E189',
    'physics': 'E426',
    'capsule': 'E421',
    'cone': 'E422',
    'cylinder': 'E423',
    'plane': 'E424',
    'sphere': 'E425',
    'script': 'E236',
    'screen': 'E403',
    'sprite': 'E413',
    'animatedsprite': 'E414',
    'element': 'E378',
    'layoutgroup': 'E143',
    'layoutchild': 'E407',
    'scrollview': 'E408',
    'scrollbar': 'E409',
    'button': 'E405',
    'zone': 'E236',
    '2d-screen': 'E403',
    '3d-screen': 'E404',
    'text-element': 'E406',
    'image-element': 'E295',
    'group-element': 'E415',
    'userinterface': 'E402',
    'render': 'E190',
    'gsplat': 'E217'
};

// THEMES (monaco-themes and custom themes)
// Monaco Themes License: https://github.com/brijeshb42/monaco-themes/blob/master/LICENSE
export const THEMES = {
    'active4d': 'Active4D',
    'all-hallows-eve': 'All Hallows Eve',
    'amy': 'Amy',
    'ayu-dark': 'Ayu-Dark',
    'ayu-light': 'Ayu-Light',
    'ayu-mirage': 'Ayu-Mirage',
    'birds-of-paradise': 'Birds of Paradise',
    'blackboard': 'Blackboard',
    'brilliance-black': 'Brilliance Black',
    'brilliance-dull': 'Brilliance Dull',
    'chrome-devtools': 'Chrome DevTools',
    'clouds-midnight': 'Clouds Midnight',
    'clouds': 'Clouds',
    'cobalt': 'Cobalt',
    'dawn': 'Dawn',
    'dracula': 'Dracula',
    'dreamweaver': 'Dreamweaver',
    'eiffel': 'Eiffel',
    'espresso-libre': 'Espresso Libre',
    'github': 'GitHub',
    'iplastic': 'iPlastic',
    'idle': 'IDLE',
    'idlefingers': 'idleFingers',
    'katzenmilch': 'Katzenmilch',
    'krtheme': 'krTheme',
    'kuroir-theme': 'Kuroir Theme',
    'lazy': 'LAZY',
    'magicwb--amiga-': 'MagicWB (Amiga)',
    'merbivore-soft': 'Merbivore Soft',
    'merbivore': 'Merbivore',
    'monoindustrial': 'monoindustrial',
    'monokai-bright': 'Monokai Bright',
    'monokai': 'Monokai',
    'night-owl': 'Night Owl',
    'oceanic-next': 'Oceanic Next',
    'pastels-on-dark': 'Pastels on Dark',
    'playcanvas': 'PlayCanvas',
    'slush-and-poppies': 'Slush and Poppies',
    'solarized-dark': 'Solarized-dark',
    'solarized-light': 'Solarized-light',
    'spacecadet': 'SpaceCadet',
    'sunburst': 'Sunburst',
    'textmate--mac-classic-': 'Textmate (Mac Classic)',
    'tomorrow-night-blue': 'Tomorrow-Night-Blue',
    'tomorrow-night-bright': 'Tomorrow-Night-Bright',
    'tomorrow-night-eighties': 'Tomorrow-Night-Eighties',
    'tomorrow-night': 'Tomorrow-Night',
    'tomorrow': 'Tomorrow',
    'twilight': 'Twilight',
    'upstream-sunburst': 'Upstream Sunburst',
    'vibrant-ink': 'Vibrant Ink',
    'vs': 'VS Default',
    'vs-dark': 'VS Dark',
    'xcode-default': 'Xcode_default',
    'zenburnesque': 'Zenburnesque'
};
