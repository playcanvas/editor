// extensions
import '../common/extensions';

// pcui
import '../common/pcui/pcui';

// general
import './editor';

// general (from main editor)
import '../editor/hotkey/hotkey';
import '../editor/messenger/messenger';
import '../editor/relay/relay';

// realtime
import './realtime/realtime';

// permissions
import './permissions/permissions';

// local storage (from main editor)
import '../editor/storage/localstorage';

// errors
import './errors/errors-realtime';

// layout
import './layout/layout';

// version control
import './merge/merge';

// assets (from main editor)
import '../editor/assets/assets-fs';
import '../editor/assets/assets-rename';

// assets
import './assets/assets';
import './assets/assets-messenger';
import './assets/assets-contents';
import './assets/assets-load';
import './assets/assets-delete';
import './assets/assets-create';
import './assets/assets-create-css';
import './assets/assets-create-folder';
import './assets/assets-create-html';
import './assets/assets-create-json';
import './assets/assets-create-script';
import './assets/assets-create-shader';
import './assets/assets-create-text';
import './assets/assets-script-parse';

// script parse (from main editor)
import '../editor/assets/handle-script-parse';

// users
import './users/users';
import './users/users-colors';

// settings
import '../editor/settings/settings';
import './settings/user-settings';
import './settings/project-settings';

// documents
import './documents/documents-load';

// files panel
import './files-panel/files-context-menu';
import './files-panel/files-panel';

// status panel
import './status-panel/status-panel';
import './status-panel/status-connection';

// monaco
import './monaco/languages/glsl';
import './monaco/monaco';
import './monaco/document';
import './monaco/copilot/autocomplete';
import './monaco/intellisense/attribute-autofill';
import './monaco/intellisense/path-completion';
import './monaco/intellisense/warnings';
import './monaco/intellisense/color-picker';
import './monaco/sharedb';
import './monaco/actions';
import './monaco/search';
import './monaco/merge';
import './monaco/diff';

// tab panel
import './tab-panel/tab-context-menu';
import './tab-panel/tab-panel';

// settings panel
import './settings-panel/settings-panel';

// picker confirm (from main editor)
import '../editor/pickers/picker-confirm';

// pickers
import './pickers/picker-script-create';
import './pickers/picker-search';
import './pickers/picker-fuzzy-search';

// search
import './search/search';

// menu panel
import './menu-panel/menu-panel';
import './menu-panel/file/menu';
import './menu-panel/file/create';
import './menu-panel/file/save';
import './menu-panel/file/revert';
import './menu-panel/file/rename';
import './menu-panel/file/download';
import './menu-panel/file/close';
import './menu-panel/file/delete';
import './menu-panel/edit/menu';
import './menu-panel/edit/undo-redo';
import './menu-panel/edit/find-replace';
import './menu-panel/edit/comment';
import './menu-panel/edit/preferences';
import './menu-panel/selection/menu';
import './menu-panel/selection/selectAll';
import './menu-panel/selection/expand-shrink';
import './menu-panel/selection/copy-move-lines';
import './menu-panel/selection/occurrences';
import './menu-panel/navigate/menu';
import './menu-panel/navigate/palette';
import './menu-panel/navigate/fuzzy';
import './menu-panel/navigate/tabs';
import './menu-panel/project/menu';
import './menu-panel/project/links';
import './menu-panel/project/launch';
import './menu-panel/help/menu';
import './menu-panel/help/links';

// whoisonline
import './whoisonline/whoisonline';
import './whoisonline/whoisonline-panel';

// menu panel readonly
import './menu-panel/menu-readonly';

// monaco integration
import './monaco/integration';

// urls
import './urls';

// version control pickers (from main editor)
import '../editor/pickers/version-control/picker-version-control-overlay-message';
import '../editor/pickers/version-control/picker-version-control-messenger';
import '../editor/pickers/version-control/picker-version-control-overlay-merge';
