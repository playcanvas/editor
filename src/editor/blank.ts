// the projects home page (/editor): projects are managed here and each opens in its own editor tab

// sentry
import '@/common/sentry';

// extensions
import '@/common/extensions';

// home shell: an editor instance with only the rest and messenger apis, and a full-page root
import './home/editor';
import './home/layout';
import './messenger/messenger';
import './drop/drop';

// storage (the MCP button saves its connected flag and port here)
import './storage/localstorage';
import './search/search';

// users
import './users/users';

// project
import './project/project';

// images
import './images/images';

// pickers
import './pickers/picker';
import './pickers/picker-project';

// project management pickers
import './pickers/project-management/project-management';
import './pickers/project-management/progress-card';
import './pickers/picker-project-main';
import './pickers/picker-project-dev-log';
import './pickers/project-management/picker-project-home';
import './pickers/project-management/picker-cms';
import './pickers/project-management/picker-modal-new-project';
import './pickers/project-management/picker-modal-new-project-kits';
import './pickers/project-management/picker-modal-new-project-confirmation';
import './pickers/project-management/picker-modal-new-organization';
import './pickers/project-management/picker-modal-delete-organization';
import './pickers/project-management/picker-modal-delete-self-confirmation';
import './pickers/project-management/picker-modal-delete-project-confirmation';
import './pickers/project-management/picker-modal-transfer-project';
import './pickers/project-management/picker-modal-visibility-confirmation';

// team management picker
import './pickers/picker-team-management';

// mcp (project tools only; the scene driver needs an open project)
import './mcp/blank';
