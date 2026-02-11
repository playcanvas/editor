// playcanvas engine (exposes window.pc for plugins)
import './expose';

// extensions
import '@/common/extensions';

// pcui
import '@/common/pcui/pcui';

// general
import './editor';
import './layout/layout';
import './messenger/messenger';
import './drop/drop';
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
import './pickers/picker-project-main';
import './pickers/project-management/picker-cms';
import './pickers/project-management/picker-modal-new-project';
import './pickers/project-management/picker-modal-new-project-confirmation';
import './pickers/project-management/picker-modal-new-organization';
import './pickers/project-management/picker-modal-delete-organization';
import './pickers/project-management/picker-modal-delete-self-confirmation';
import './pickers/project-management/picker-modal-delete-project-confirmation';
import './pickers/project-management/picker-modal-visibility-confirmation';

import './pickers/picker-scene';

// team management picker
import './pickers/picker-team-management';
