// the projects home page (/editor): projects are managed here and each opens in its own editor tab

// sentry
import '@/common/sentry';

// extensions
import '@/common/extensions';

// home shell: an editor instance with only the rest and messenger apis, and a full-page root
import './editor';
import './layout';
import '@/editor/messenger/messenger';
import '@/editor/drop/drop';

// storage (the MCP button saves its connected flag and port here)
import '@/editor/storage/localstorage';
import '@/editor/search/search';

// users
import '@/editor/users/users';

// project
import '@/editor/project/project';

// images
import '@/editor/images/images';

// pickers
import '@/editor/pickers/picker';
import '@/editor/pickers/picker-project';

// project management pickers
import '@/editor/pickers/project-management/project-management';
import '@/editor/pickers/project-management/progress-card';
import '@/editor/pickers/picker-project-main';
import '@/editor/pickers/picker-project-dev-log';
import '@/editor/pickers/project-management/picker-project-home';
import '@/editor/pickers/project-management/picker-cms';
import '@/editor/pickers/project-management/picker-modal-new-project';
import '@/editor/pickers/project-management/picker-modal-new-project-kits';
import '@/editor/pickers/project-management/picker-modal-new-project-confirmation';
import '@/editor/pickers/project-management/picker-modal-new-organization';
import '@/editor/pickers/project-management/picker-modal-delete-organization';
import '@/editor/pickers/project-management/picker-modal-delete-self-confirmation';
import '@/editor/pickers/project-management/picker-modal-delete-project-confirmation';
import '@/editor/pickers/project-management/picker-modal-transfer-project';
import '@/editor/pickers/project-management/picker-modal-visibility-confirmation';

// team management picker
import '@/editor/pickers/picker-team-management';

// mcp (project tools only; the scene driver needs an open project)
import './mcp';
