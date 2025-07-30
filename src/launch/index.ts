// extensions
import '../common/extensions.ts';

// general
import './editor.ts';
import './messenger/messenger.ts';
import './wasm/wasm.ts';

// realtime
import './realtime/realtime.ts';

// settings (from main editor)
import '../editor/settings/settings.ts';
import '../editor/settings/project-settings.ts';
import '../editor/settings/project-user-settings.ts';

// scene settings
import './scene-settings/scene-settings.ts';

// viewport preload
import './viewport/viewport-loading.ts';
import './viewport/viewport.ts';
import './viewport/viewport-error-console.ts';
import './viewport/viewport-tooltip.ts';

// tools
import './tools/tools.ts';
import './tools/tools-overview.ts';
import './tools/tools-timeline.ts';
import './tools/tools-frame.ts';
import './tools/tools-toolbar.ts';

// entities
import './entities/entities.ts';
import './entities/entities-sync.ts';

// schema (from main editor)
import '../editor/schema/schema.ts';
import '../editor/schema/schema-components.ts';
import '../editor/assets/assets-bundles.ts';

// viewport onload
import './viewport/viewport-engine-data.ts';
import './viewport/viewport-binding-entities.ts';
import './viewport/viewport-binding-components.ts';
import './viewport/viewport-binding-assets.ts';
import './viewport/viewport-binding-scene.ts';
import './viewport/viewport-scene-handler.ts';
import './viewport/viewport-connection.ts';

// assets
import './assets/assets.ts';
import './assets/assets-sync.ts';
import './assets/assets-mapping.ts';
import './assets/assets-messenger.ts';

// source files
import './sourcefiles/sourcefiles.ts';

// scene loading
import './scene-loading/scene-loading.ts';
