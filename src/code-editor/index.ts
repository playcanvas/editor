// extensions
import '../common/extensions.ts';

// pcui
import '../common/pcui/pcui.ts';

// general
import './editor.ts';

// general (from main editor)
import '../editor/hotkey/hotkey.ts';
import '../editor/messenger/messenger.ts';
import '../editor/relay/relay.ts';

// realtime
import './realtime/realtime.ts';

// permissions
import './permissions/permissions.ts';

// local storage (from main editor)
import '../editor/storage/localstorage.ts';

// errors
import './errors/errors-realtime.ts';

// layout
import './layout/layout.ts';

// version control
import './merge/merge.ts';

// assets (from main editor)
import '../editor/assets/assets-fs.ts';
import '../editor/assets/assets-rename.ts';

// assets
import './assets/assets.ts';
import './assets/assets-messenger.ts';
import './assets/assets-contents.ts';
import './assets/assets-load.ts';
import './assets/assets-delete.ts';
import './assets/assets-create.ts';
import './assets/assets-create-css.ts';
import './assets/assets-create-folder.ts';
import './assets/assets-create-html.ts';
import './assets/assets-create-json.ts';
import './assets/assets-create-script.ts';
import './assets/assets-create-shader.ts';
import './assets/assets-create-text.ts';
import './assets/assets-script-parse.ts';

// script parse (from main editor)
import '../editor/assets/handle-script-parse.ts';

// users
import './users/users.ts';
import './users/users-colors.ts';

// settings
import '../editor/settings/settings.ts';
import './settings/user-settings.ts';
import './settings/project-settings.ts';

// documents
import './documents/documents-load.ts';

// files panel
import './files-panel/files-context-menu.ts';
import './files-panel/files-panel.ts';

// status panel
import './status-panel/status-panel.ts';
import './status-panel/status-connection.ts';

// monaco
import './monaco/languages/glsl.ts';
import './monaco/monaco.ts';
import './monaco/document.ts';
import './monaco/copilot/autocomplete.ts';
import './monaco/intellisense/attribute-autofill.ts';
import './monaco/intellisense/path-completion.ts';
import './monaco/intellisense/warnings.ts';
import './monaco/intellisense/color-picker.ts';
import './monaco/sharedb.ts';
import './monaco/actions.ts';
import './monaco/search.ts';
import './monaco/merge.ts';
import './monaco/diff.ts';

// tab panel
import './tab-panel/tab-context-menu.ts';
import './tab-panel/tab-panel.ts';

// settings panel
import './settings-panel/settings-panel.ts';

// picker confirm (from main editor)
import '../editor/pickers/picker-confirm.ts';

// pickers
import './pickers/picker-script-create.ts';
import './pickers/picker-search.ts';
import './pickers/picker-fuzzy-search.ts';

// search
import './search/search.ts';

// menu panel
import './menu-panel/menu-panel.ts';
import './menu-panel/file/menu.ts';
import './menu-panel/file/create.ts';
import './menu-panel/file/save.ts';
import './menu-panel/file/revert.ts';
import './menu-panel/file/rename.ts';
import './menu-panel/file/download.ts';
import './menu-panel/file/close.ts';
import './menu-panel/file/delete.ts';
import './menu-panel/edit/menu.ts';
import './menu-panel/edit/undo-redo.ts';
import './menu-panel/edit/find-replace.ts';
import './menu-panel/edit/comment.ts';
import './menu-panel/edit/preferences.ts';
import './menu-panel/selection/menu.ts';
import './menu-panel/selection/selectAll.ts';
import './menu-panel/selection/expand-shrink.ts';
import './menu-panel/selection/copy-move-lines.ts';
import './menu-panel/selection/occurrences.ts';
import './menu-panel/navigate/menu.ts';
import './menu-panel/navigate/pallette.ts';
import './menu-panel/navigate/fuzzy.ts';
import './menu-panel/navigate/tabs.ts';
import './menu-panel/project/menu.ts';
import './menu-panel/project/links.ts';
import './menu-panel/project/launch.ts';
import './menu-panel/help/menu.ts';
import './menu-panel/help/links.ts';

// whoisonline
import './whoisonline/whoisonline.ts';
import './whoisonline/whoisonline-panel.ts';

// menu panel readonly
import './menu-panel/menu-readonly.ts';

// monaco integration
import './monaco/integration.ts';

// urls
import './urls.ts';

// version control pickers (from main editor)
import '../editor/pickers/version-control/picker-version-control-svg.ts';
import '../editor/pickers/version-control/picker-version-control-overlay-message.ts';
import '../editor/pickers/version-control/picker-version-control-messenger.ts';
import '../editor/pickers/version-control/picker-version-control-overlay-merge.ts';
