// extensions
import '@/common/extensions';

// pcui
import '@/common/pcui/pcui';

// general
import './editor';
import './permissions/permissions';
import './storage/localstorage';
import './storage/clipboard';
import './users/users-flags';
import './hotkey/hotkey';
import './layout/layout';
import './console/console';
import './messenger/messenger';
import './relay/relay';
import './history/history-hotkeys';
import './history/history-status-text';
import './drop/drop';
import './viewport/cursor/cursor';
import './search/search';
import './notify/notify';
import './refocus';

// realtime
import './realtime/realtime';

// users
import './users/users';
import './users/users-usage';
import './users/users-colors';

// project
import './project/project';
import './project/module';
import './project/engine-asset';

// store
import './store/store';

// observer lists
import './entities/entities';
import './assets/assets';

// settings
import './settings/settings';
import './settings/user-settings';
import './settings/project-user-settings';
import './settings/project-settings';
import './settings/project-private-settings';
import './settings/session-settings';

// settings attributes
import './settings/attributes/settings-attributes-physics';
import './settings/attributes/settings-attributes-scene';
import './settings/attributes/settings-attributes-scripts-priority';

// scene settings
import './scene-settings/scene-settings';

// selector
import './selector/selector';
import './selector/selector-sync';
import './selector/selector-history';

// repositories
import './repositories/repositories';

// sourcefiles
import './sourcefiles/sourcefiles';
import './sourcefiles/sourcefiles-skeleton';
import './sourcefiles/sourcefiles-attributes';

// schema
import './schema/schema';
import './schema/schema-scene';
import './schema/schema-asset';
import './schema/schema-settings';
import './schema/schema-components';
import './schema/schema-material';
import './schema/schema-anim-state-graph';

// components
import './components/scrollbar/components-scrollbar-defaults';

// entities
import './entities/entities-selection';
import './entities/entities-addComponent';
import './entities/entities-pasteComponent';
import './entities/entities-create';
import './entities/entities-delete';
import './entities/entities-duplicate';
import './entities/entities-copy';
import './entities/entities-paste';
import './entities/entities-reparent';
import './entities/entities-panel';
import './entities/entities-menu';
import './entities/entities-control';
import './entities/entities-fuzzy-search';
import './entities/entities-advanced-search-ui';
import './entities/entities-load';
import './entities/entities-layout-utils';
import './entities/entities-history';
import './entities/entities-sync';
import './entities/entities-migrations';
import './entities/entities-scripts';
import './entities/entities-hotkeys';
import './entities/entities-context-menu';
import './entities/entities-components-menu';
import './entities/entities-template-menu';
import './entities/entities-pick';
import './entities/entities-icons';

// gizmo
import './viewport/gizmo/gizmo';
import './viewport/gizmo/gizmo-layers';
import './viewport/gizmo/gizmo-point';
import './viewport/gizmo/gizmo-transform';
import './viewport/gizmo/gizmo-camera';
import './viewport/gizmo/gizmo-light';
import './viewport/gizmo/gizmo-collision';
import './viewport/gizmo/gizmo-particles';
import './viewport/gizmo/gizmo-skeleton';
import './viewport/gizmo/gizmo-bounding-box';
import './viewport/gizmo/gizmo-zone';
import './viewport/gizmo/gizmo-screen';
import './viewport/gizmo/gizmo-element';
import './viewport/gizmo/gizmo-element-anchor';
import './viewport/gizmo/gizmo-element-size';
import './viewport/gizmo/gizmo-button';

// assets
import './assets/assets-registry';
import './assets/assets-sync';
import './assets/assets-fs';
import './assets/assets-panel';
import './assets/assets-context-menu';
import './assets/assets-upload';
import './assets/assets-reimport';
import './assets/assets-drop';
import './assets/assets-delete';
import './assets/assets-duplicate';
import './assets/assets-copy';
import './assets/assets-paste';
import './assets/assets-edit';
import './assets/assets-download';
import './assets/assets-replace';
import './assets/assets-rename';
import './assets/assets-rename-select';
import './assets/assets-history';
import './assets/assets-migrate';
import './assets/assets-srgb';
import './assets/assets-create-folder';
import './assets/assets-cubemap-utils';
import './assets/assets-cubemap-prefiltering';
import './assets/assets-create-bundle';
import './assets/assets-create-material';
import './assets/assets-create-cubemap';
import './assets/assets-create-html';
import './assets/assets-create-css';
import './assets/assets-create-json';
import './assets/assets-create-text';
import './assets/assets-create-script';
import './assets/assets-create-shader';
import './assets/assets-create-sprite';
import './assets/assets-create-i18n';
import './assets/assets-create-template';
import './assets/assets-create-anim-state-graph';
import './assets/assets-unwrap';
import './assets/assets-used';
import './assets/assets-script-parse';
import './assets/handle-script-parse';
import './assets/assets-script-registry';
import './assets/assets-sprite-utils';
import './assets/assets-bundles';
import './assets/assets-move-to-store';
import './assets/assets-texture-convert';
import './assets/assets-mapping-removal';
import './assets/assets-thumbnail-regen';

// templates
import './templates/template-pipeline-tasks';
import './templates/new-template-data';
import './templates/remap-entity-ids';
import './templates/template-utils';
import './templates/deep-equal';
import './templates/template-node-traversal';
import './templates/find-template-conflicts';
import './templates/find-apply-candidates';
import './templates/revert-overrides';
import './templates/compute-overrides';
import './templates/compute-overrides-filter';
import './templates/filter-overrides/handle-children-conflict';
import './templates/filter-overrides/handle-script-order-conflict';
import './templates/filter-overrides/set-reparent-path';
import './templates/all-entity-paths';
import './templates/get-script-attributes';
import './templates/is-valid-template-conflict';
import './templates/is-template';
import './templates/unlink-template';

// version control
import './vc/graph/vc-graph';
import './vc/graph/vc-utils';
import './vc/graph/vc-colors';
import './vc/graph/vertical-consistency';
import './vc/graph/compact-branches';
import './vc/graph/place-vc-nodes';
import './vc/graph/split-node-description';
import './vc/graph/vc-node-menu';
import './vc/graph/make-hist-graph';
import './vc/graph/sync-hist-graph';

// images
import './images/images';

// userdata
import './userdata/userdata-realtime';
import './userdata/userdata';

// scenes
import './scenes/scenes';
import './scenes/scenes-load';

// camera
import './viewport/camera/camera';
import './viewport/camera/camera-history';
import './viewport/camera/camera-userdata';
import './viewport/camera/camera-depth';
import './viewport/camera/camera-user';
import './viewport/camera/camera-focus';
import './viewport/camera/camera-fly';
import './viewport/camera/camera-orbit';
import './viewport/camera/camera-zoom';
import './viewport/camera/camera-pan';
import './viewport/camera/camera-look-around';
import './viewport/camera/camera-preview';

// whoisonline
import './whoisonline/whoisonline';
import './whoisonline/whoisonline-scene';

// attributes panel
import './attributes/attributes-panel';
import './attributes/attributes-assets-list';
import './attributes/attributes-array';
import './attributes/attributes-history';

// attributes reference
import './attributes/reference/reference';
import './attributes/reference/settings';
import './attributes/reference/sprite-editor';
import './attributes/reference/entity';
import './attributes/reference/components/components';
import './attributes/reference/assets/asset';

// attributes entities (legacy)
import './attributes/attributes-entity';
import './attributes/attributes-components-script';

// pcui attribute inspectors
import './inspector/settings';
import './inspector/settings-panels/batchgroups-create';

// attributes assets
import './attributes/attributes-asset';

// clipboard
import './storage/clipboard-context-menu';

// chat
import './chat/chat-connection';
import './chat/chat-widget';
import './chat/chat-typing';
import './chat/chat-system';
import './chat/chat-notifications';

// toolbar
import './toolbar/toolbar-logo';
import './toolbar/toolbar-editor-settings';
import './toolbar/toolbar-controls';
import './toolbar/toolbar-github';
import './toolbar/toolbar-discord';
import './toolbar/toolbar-forum';
import './toolbar/toolbar-help';
import './toolbar/toolbar-gizmos';
import './toolbar/toolbar-history';
import './toolbar/toolbar-lightmapper';
import './toolbar/toolbar-publish';
import './toolbar/toolbar-code-editor';
import './toolbar/toolbar-scene';
import './toolbar/toolbar-launch';
import './toolbar/toolbar-cameras';
import './toolbar/toolbar-whois';
import './toolbar/toolbar-connection';
import './toolbar/toolbar-usage';
import './toolbar/toolbar-scene-limits';
import './toolbar/toolbar-render';
import './toolbar/toolbar-maintenance';


// pickers
import './pickers/picker';
import './pickers/picker-confirm';
import './pickers/picker-engine';
import './pickers/picker-color';
import './pickers/picker-asset';
import './pickers/picker-curve';
import './pickers/picker-entity';
import './pickers/picker-node';
import './pickers/picker-project';

// project management pickers
import './pickers/project-management/project-management';

import './pickers/picker-project-main';

// store
import './pickers/store/picker-store';
import './pickers/store/picker-storeitem';

// auditor
import './pickers/auditor/picker-auditor';

import './pickers/picker-message';

import './pickers/project-management/picker-cms';
import './pickers/project-management/picker-modal-new-project';
import './pickers/project-management/picker-modal-new-project-confirmation';
import './pickers/project-management/picker-modal-new-organization';
import './pickers/project-management/picker-modal-delete-organization';
import './pickers/project-management/picker-modal-delete-project-confirmation';
import './pickers/project-management/picker-modal-delete-self-confirmation';
import './pickers/project-management/picker-modal-visibility-confirmation';

import './pickers/picker-scene';
import './pickers/picker-script-create';

// version control pickers
import './pickers/version-control/picker-version-control-side-panel';
import './pickers/version-control/picker-version-control-progress';
import './pickers/version-control/picker-version-control-create-checkpoint';
import './pickers/version-control/picker-version-control-restore-checkpoint';
import './pickers/version-control/picker-version-control-hard-reset-checkpoint';
import './pickers/version-control/picker-version-control-create-branch';
import './pickers/version-control/picker-version-control-close-branch';
import './pickers/version-control/picker-version-control-delete-branch';
import './pickers/version-control/picker-version-control-merge-branches';
import './pickers/version-control/picker-version-control-checkpoints';
import './pickers/version-control/picker-version-control-diff-checkpoints';
import './pickers/version-control/picker-version-control';
import './pickers/version-control/picker-version-control-overlay-message';
import './pickers/version-control/picker-version-control-messenger';
import './pickers/version-control/picker-version-control-overlay-merge';

import './pickers/picker-builds-publish';
import './pickers/picker-publish-new';
import './pickers/picker-gradient';
import './pickers/picker-text-input';
import './pickers/picker-legacy-scripts';
import './pickers/picker-recompress-textures';
import './pickers/picker-release-notes';
import './pickers/picker-fix-corrupted-templates';

// team management picker
import './pickers/picker-team-management';

// conflict manager picker
import './pickers/conflict-manager/picker-conflict-manager-scene';
import './pickers/conflict-manager/picker-conflict-manager-settings';
import './pickers/conflict-manager/picker-conflict-manager-asset';
import './pickers/conflict-manager/picker-conflict-manager';


// sprites
import './pickers/sprite-editor/sprite-editor-atlas-panel';
import './pickers/sprite-editor/sprite-editor-frames-attributes-panel';
import './pickers/sprite-editor/sprite-editor-frames-related-sprites-panel';
import './pickers/sprite-editor/sprite-editor-preview-panel';
import './pickers/sprite-editor/sprite-editor-generate-frames-panel';
import './pickers/sprite-editor/sprite-editor-import-frames-panel';
import './pickers/sprite-editor/sprite-editor-sprite-panel';
import './pickers/sprite-editor/sprite-editor-sprite-assets-panel';
import './pickers/sprite-editor/sprite-editor';
import './pickers/sprite-editor/sprite-editor-frames-panel';
import './pickers/sprite-editor/sprite-editor-selection';
import './pickers/sprite-editor/sprite-editor-render-preview';
import './pickers/sprite-editor/sprite-editor-trim';
import './pickers/sprite-editor/sprite-editor-edit-frame';
import './pickers/sprite-editor/sprite-editor-delete';

// viewport
import './viewport/viewport';
import './viewport/viewport-grid';
import './viewport/viewport-resize';
import './viewport/viewport-expand';
import './viewport/viewport-entities-create';
import './viewport/viewport-entities-observer-binding';
import './viewport/viewport-entities-components-binding';
import './viewport/viewport-entities-elements';
import './viewport/viewport-layers';
import './viewport/viewport-scene-settings';
import './viewport/viewport-assets';
import './viewport/viewport-lightmapper';
import './viewport/viewport-lightmapper-auto';
import './viewport/viewport-drop-model';
import './viewport/viewport-drop-material';
import './viewport/viewport-drop-cubemap';
import './viewport/viewport-drop-sprite';
import './viewport/viewport-drop-template';
import './viewport/viewport-drop-gsplat';
import './viewport/viewport-engine-data';
import './viewport/viewport-userdata';
import './viewport/viewport-user-cameras';
import './viewport/viewport-tap';
import './viewport/viewport-pick';
import './viewport/viewport-cursor';
import './viewport/viewport-tooltips';
import './viewport/viewport-focus';
import './viewport/viewport-outline';
import './viewport/viewport-i18n';

// previews
import './assets/assets-preview-material-watch';
import './assets/assets-preview-model-watch';
import './assets/assets-preview-cubemap-watch';
import './assets/assets-preview-font-watch';
import './assets/assets-preview-sprite-watch';
import './assets/assets-preview-render-watch';
import './viewport/viewport-preview-particles';
import './viewport/viewport-preview-animation';

// help
import './help/controls';
import './help/howdoi';
import './help/howdoi-popup';
import './help/howdoi-load';
import './help/demo-project';

import './guides/guide-bubbles';
import './guides/guide-intro';

// Template migrations
import './templates/migrations/fix-corrupted-instances';

// plugins
import './plugins/plugins';
