// extensions
import '../common/extensions.ts';

// pcui
import '../common/pcui/pcui.ts';

// general
import './editor.ts';
import './permissions/permissions.ts';
import './storage/localstorage.ts';
import './storage/clipboard.ts';
import './users/users-flags.ts';
import './hotkey/hotkey.ts';
import './layout/layout.ts';
import './console/console.ts';
import './messenger/messenger.ts';
import './relay/relay.ts';
import './history/history-hotkeys.ts';
import './history/history-status-text.ts';
import './drop/drop.ts';
import './viewport/cursor/cursor.ts';
import './search/search.ts';
import './notify/notify.ts';
import './refocus.ts';

// realtime
import './realtime/realtime.ts';

// users
import './users/users.ts';
import './users/users-usage.ts';
import './users/users-colors.ts';

// project
import './project/project.ts';
import './project/module.ts';
import './project/engine-asset.ts';

// store
import './store/store.ts';

// observer lists
import './entities/entities.ts';
import './assets/assets.ts';

// settings
import './settings/settings.ts';
import './settings/user-settings.ts';
import './settings/project-user-settings.ts';
import './settings/project-settings.ts';
import './settings/project-private-settings.ts';
import './settings/session-settings.ts';

// settings attributes
import './settings/attributes/settings-attributes-physics.ts';
import './settings/attributes/settings-attributes-scene.ts';
import './settings/attributes/settings-attributes-scripts-priority.ts';

// scene settings
import './scene-settings/scene-settings.ts';

// selector
import './selector/selector.ts';
import './selector/selector-sync.ts';
import './selector/selector-history.ts';

// repositories
import './repositories/repositories.ts';

// sourcefiles
import './sourcefiles/sourcefiles.ts';
import './sourcefiles/sourcefiles-skeleton.ts';
import './sourcefiles/sourcefiles-attributes.ts';

// schema
import './schema/schema.ts';
import './schema/schema-scene.ts';
import './schema/schema-asset.ts';
import './schema/schema-settings.ts';
import './schema/schema-components.ts';
import './schema/schema-material.ts';
import './schema/schema-anim-state-graph.ts';

// components
import './components/scrollbar/components-scrollbar-defaults.ts';

// entities
import './entities/entities-selection.ts';
import './entities/entities-addComponent.ts';
import './entities/entities-pasteComponent.ts';
import './entities/entities-create.ts';
import './entities/entities-delete.ts';
import './entities/entities-duplicate.ts';
import './entities/entities-copy.ts';
import './entities/entities-paste.ts';
import './entities/entities-reparent.ts';
import './entities/entities-panel.ts';
import './entities/entities-menu.ts';
import './entities/entities-control.ts';
import './entities/entities-fuzzy-search.ts';
import './entities/entities-advanced-search-ui.ts';
import './entities/entities-load.ts';
import './entities/entities-layout-utils.ts';
import './entities/entities-history.ts';
import './entities/entities-sync.ts';
import './entities/entities-migrations.ts';
import './entities/entities-scripts.ts';
import './entities/entities-hotkeys.ts';
import './entities/entities-context-menu.ts';
import './entities/entities-components-menu.ts';
import './entities/entities-template-menu.ts';
import './entities/entities-pick.ts';
import './entities/entities-icons.ts';

// gizmo
import './viewport/gizmo/gizmo.ts';
import './viewport/gizmo/gizmo-layers.ts';
import './viewport/gizmo/gizmo-point.ts';
import './viewport/gizmo/gizmo-transform.ts';
import './viewport/gizmo/gizmo-camera.ts';
import './viewport/gizmo/gizmo-light.ts';
import './viewport/gizmo/gizmo-collision.ts';
import './viewport/gizmo/gizmo-particles.ts';
import './viewport/gizmo/gizmo-skeleton.ts';
import './viewport/gizmo/gizmo-bounding-box.ts';
import './viewport/gizmo/gizmo-zone.ts';
import './viewport/gizmo/gizmo-screen.ts';
import './viewport/gizmo/gizmo-element.ts';
import './viewport/gizmo/gizmo-element-anchor.ts';
import './viewport/gizmo/gizmo-element-size.ts';
import './viewport/gizmo/gizmo-button.ts';

// assets
import './assets/assets-registry.ts';
import './assets/assets-sync.ts';
import './assets/assets-fs.ts';
import './assets/assets-panel.ts';
import './assets/assets-context-menu.ts';
import './assets/assets-upload.ts';
import './assets/assets-reimport.ts';
import './assets/assets-drop.ts';
import './assets/assets-delete.ts';
import './assets/assets-duplicate.ts';
import './assets/assets-copy.ts';
import './assets/assets-paste.ts';
import './assets/assets-edit.ts';
import './assets/assets-replace.ts';
import './assets/assets-rename.ts';
import './assets/assets-rename-select.ts';
import './assets/assets-history.ts';
import './assets/assets-migrate.ts';
import './assets/assets-srgb.ts';
import './assets/assets-create-folder.ts';
import './assets/assets-cubemap-utils.ts';
import './assets/assets-cubemap-prefiltering.ts';
import './assets/assets-create-bundle.ts';
import './assets/assets-create-material.ts';
import './assets/assets-create-cubemap.ts';
import './assets/assets-create-html.ts';
import './assets/assets-create-css.ts';
import './assets/assets-create-json.ts';
import './assets/assets-create-text.ts';
import './assets/assets-create-script.ts';
import './assets/assets-create-shader.ts';
import './assets/assets-create-sprite.ts';
import './assets/assets-create-i18n.ts';
import './assets/assets-create-template.ts';
import './assets/assets-create-anim-state-graph.ts';
import './assets/assets-unwrap.ts';
import './assets/assets-used.ts';
import './assets/assets-script-parse.ts';
import './assets/handle-script-parse.ts';
import './assets/assets-script-registry.ts';
import './assets/assets-sprite-utils.ts';
import './assets/assets-bundles.ts';
import './assets/assets-move-to-store.ts';
import './assets/assets-texture-convert.ts';
import './assets/assets-mapping-removal.ts';
import './assets/assets-thumbnail-regen.ts';

// templates
import './templates/template-pipeline-tasks.ts';
import './templates/new-template-data.ts';
import './templates/remap-entity-ids.ts';
import './templates/template-utils.ts';
import './templates/deep-equal.ts';
import './templates/template-node-traversal.ts';
import './templates/find-template-conflicts.ts';
import './templates/find-apply-candidates.ts';
import './templates/revert-overrides.ts';
import './templates/compute-overrides.ts';
import './templates/compute-overrides-filter.ts';
import './templates/filter-overrides/handle-children-conflict.ts';
import './templates/filter-overrides/handle-script-order-conflict.ts';
import './templates/filter-overrides/set-reparent-path.ts';
import './templates/all-entity-paths.ts';
import './templates/get-script-attributes.ts';
import './templates/is-valid-template-conflict.ts';
import './templates/is-template.ts';
import './templates/unlink-template.ts';

// version control
import './vc/graph/vc-graph.ts';
import './vc/graph/vc-utils.ts';
import './vc/graph/vc-colors.ts';
import './vc/graph/vertical-consistency.ts';
import './vc/graph/compact-branches.ts';
import './vc/graph/place-vc-nodes.ts';
import './vc/graph/split-node-description.ts';
import './vc/graph/vc-node-menu.ts';
import './vc/graph/make-hist-graph.ts';
import './vc/graph/sync-hist-graph.ts';

// images
import './images/images.ts';

// userdata
import './userdata/userdata-realtime.ts';
import './userdata/userdata.ts';

// scenes
import './scenes/scenes.ts';
import './scenes/scenes-load.ts';

// camera
import './viewport/camera/camera.ts';
import './viewport/camera/camera-history.ts';
import './viewport/camera/camera-userdata.ts';
import './viewport/camera/camera-depth.ts';
import './viewport/camera/camera-user.ts';
import './viewport/camera/camera-focus.ts';
import './viewport/camera/camera-fly.ts';
import './viewport/camera/camera-orbit.ts';
import './viewport/camera/camera-zoom.ts';
import './viewport/camera/camera-pan.ts';
import './viewport/camera/camera-look-around.ts';
import './viewport/camera/camera-preview.ts';

// whoisonline
import './whoisonline/whoisonline.ts';
import './whoisonline/whoisonline-scene.ts';

// attributes panel
import './attributes/attributes-panel.ts';
import './attributes/attributes-assets-list.ts';
import './attributes/attributes-array.ts';
import './attributes/attributes-history.ts';

// attributes reference
import './attributes/reference/reference.ts';
import './attributes/reference/settings.ts';
import './attributes/reference/sprite-editor.ts';
import './attributes/reference/entity.ts';
import './attributes/reference/components/components.ts';
import './attributes/reference/assets/asset.ts';

// attributes entities (legacy)
import './attributes/attributes-entity.ts';
import './attributes/attributes-components-script.ts';

// pcui attribute inspectors
import './inspector/settings.ts';
import './inspector/settings-panels/batchgroups-create.ts';

// attributes assets
import './attributes/attributes-asset.ts';

// clipboard
import './storage/clipboard-context-menu.ts';

// chat
import './chat/chat-connection.ts';
import './chat/chat-widget.ts';
import './chat/chat-typing.ts';
import './chat/chat-system.ts';
import './chat/chat-notifications.ts';

// toolbar
import './toolbar/toolbar-logo.ts';
import './toolbar/toolbar-editor-settings.ts';
import './toolbar/toolbar-controls.ts';
import './toolbar/toolbar-github.ts';
import './toolbar/toolbar-discord.ts';
import './toolbar/toolbar-forum.ts';
import './toolbar/toolbar-help.ts';
import './toolbar/toolbar-gizmos.ts';
import './toolbar/toolbar-history.ts';
import './toolbar/toolbar-lightmapper.ts';
import './toolbar/toolbar-publish.ts';
import './toolbar/toolbar-code-editor.ts';
import './toolbar/toolbar-scene.ts';
import './toolbar/toolbar-launch.ts';
import './toolbar/toolbar-cameras.ts';
import './toolbar/toolbar-whois.ts';
import './toolbar/toolbar-connection.ts';
import './toolbar/toolbar-usage.ts';
import './toolbar/toolbar-scene-limits.ts';
import './toolbar/toolbar-render.ts';


// pickers
import './pickers/picker.ts';
import './pickers/picker-confirm.ts';
import './pickers/picker-engine.ts';
import './pickers/picker-color.ts';
import './pickers/picker-asset.ts';
import './pickers/picker-curve.ts';
import './pickers/picker-entity.ts';
import './pickers/picker-node.ts';
import './pickers/picker-project.ts';

// project management pickers
import './pickers/project-management/project-management.ts';

import './pickers/picker-project-main.ts';

// store
import './pickers/store/picker-store.ts';
import './pickers/store/picker-storeitem.ts';

// auditor
import './pickers/auditor/picker-auditor.ts';

import './pickers/picker-message.ts';

import './pickers/project-management/picker-cms.ts';
import './pickers/project-management/picker-modal-new-project.ts';
import './pickers/project-management/picker-modal-new-project-confirmation.ts';
import './pickers/project-management/picker-modal-new-organization.ts';
import './pickers/project-management/picker-modal-delete-organization.ts';
import './pickers/project-management/picker-modal-delete-project-confirmation.ts';
import './pickers/project-management/picker-modal-delete-self-confirmation.ts';
import './pickers/project-management/picker-modal-visibility-confirmation.ts';

import './pickers/picker-scene.ts';
import './pickers/picker-script-create.ts';

// version control pickers
import './pickers/version-control/picker-version-control-side-panel.ts';
import './pickers/version-control/picker-version-control-progress.ts';
import './pickers/version-control/picker-version-control-create-checkpoint.ts';
import './pickers/version-control/picker-version-control-restore-checkpoint.ts';
import './pickers/version-control/picker-version-control-hard-reset-checkpoint.ts';
import './pickers/version-control/picker-version-control-create-branch.ts';
import './pickers/version-control/picker-version-control-close-branch.ts';
import './pickers/version-control/picker-version-control-delete-branch.ts';
import './pickers/version-control/picker-version-control-merge-branches.ts';
import './pickers/version-control/picker-version-control-checkpoints.ts';
import './pickers/version-control/picker-version-control-diff-checkpoints.ts';
import './pickers/version-control/picker-version-control.ts';
import './pickers/version-control/picker-version-control-overlay-message.ts';
import './pickers/version-control/picker-version-control-messenger.ts';
import './pickers/version-control/picker-version-control-overlay-merge.ts';

import './pickers/picker-builds-publish.ts';
import './pickers/picker-publish-new.ts';
import './pickers/picker-gradient.ts';
import './pickers/picker-text-input.ts';
import './pickers/picker-legacy-scripts.ts';
import './pickers/picker-recompress-textures.ts';
import './pickers/picker-release-notes.ts';
import './pickers/picker-fix-corrupted-templates.ts';

// team management picker
import './pickers/picker-team-management.ts';

// conflict manager picker
import './pickers/conflict-manager/picker-conflict-manager-scene.ts';
import './pickers/conflict-manager/picker-conflict-manager-settings.ts';
import './pickers/conflict-manager/picker-conflict-manager-asset.ts';
import './pickers/conflict-manager/picker-conflict-manager.ts';


// sprites
import './pickers/sprite-editor/sprite-editor-atlas-panel.ts';
import './pickers/sprite-editor/sprite-editor-frames-attributes-panel.ts';
import './pickers/sprite-editor/sprite-editor-frames-related-sprites-panel.ts';
import './pickers/sprite-editor/sprite-editor-preview-panel.ts';
import './pickers/sprite-editor/sprite-editor-generate-frames-panel.ts';
import './pickers/sprite-editor/sprite-editor-import-frames-panel.ts';
import './pickers/sprite-editor/sprite-editor-sprite-panel.ts';
import './pickers/sprite-editor/sprite-editor-sprite-assets-panel.ts';
import './pickers/sprite-editor/sprite-editor.ts';
import './pickers/sprite-editor/sprite-editor-frames-panel.ts';
import './pickers/sprite-editor/sprite-editor-selection.ts';
import './pickers/sprite-editor/sprite-editor-render-preview.ts';
import './pickers/sprite-editor/sprite-editor-trim.ts';
import './pickers/sprite-editor/sprite-editor-edit-frame.ts';
import './pickers/sprite-editor/sprite-editor-delete.ts';

// viewport
import './viewport/viewport.ts';
import './viewport/viewport-grid.ts';
import './viewport/viewport-resize.ts';
import './viewport/viewport-expand.ts';
import './viewport/viewport-entities-create.ts';
import './viewport/viewport-entities-observer-binding.ts';
import './viewport/viewport-entities-components-binding.ts';
import './viewport/viewport-entities-elements.ts';
import './viewport/viewport-layers.ts';
import './viewport/viewport-scene-settings.ts';
import './viewport/viewport-assets.ts';
import './viewport/viewport-lightmapper.ts';
import './viewport/viewport-lightmapper-auto.ts';
import './viewport/viewport-drop-model.ts';
import './viewport/viewport-drop-material.ts';
import './viewport/viewport-drop-cubemap.ts';
import './viewport/viewport-drop-sprite.ts';
import './viewport/viewport-drop-template.ts';
import './viewport/viewport-drop-gsplat.ts';
import './viewport/viewport-engine-data.ts';
import './viewport/viewport-userdata.ts';
import './viewport/viewport-user-cameras.ts';
import './viewport/viewport-tap.ts';
import './viewport/viewport-pick.ts';
import './viewport/viewport-cursor.ts';
import './viewport/viewport-tooltips.ts';
import './viewport/viewport-focus.ts';
import './viewport/viewport-outline.ts';
import './viewport/viewport-i18n.ts';

// previews
import './assets/assets-preview-material-watch.ts';
import './assets/assets-preview-model-watch.ts';
import './assets/assets-preview-cubemap-watch.ts';
import './assets/assets-preview-font-watch.ts';
import './assets/assets-preview-sprite-watch.ts';
import './assets/assets-preview-render-watch.ts';
import './viewport/viewport-preview-particles.ts';
import './viewport/viewport-preview-animation.ts';

// help
import './help/controls.ts';
import './help/howdoi.ts';
import './help/howdoi-popup.ts';
import './help/howdoi-load.ts';
import './help/demo-project.ts';

import './guides/guide-bubbles.ts';
import './guides/guide-intro.ts';

// Template migrations
import './templates/migrations/fix-corrupted-instances.ts';

// plugins
import './plugins/plugins.ts';
