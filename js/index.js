// editor styling
import '../sass/editor/_editor.scss';

// utils
import './utils.js';

// externals
import './external/observer.js';
import './messenger/messenger.js';
import './external/editor-api.js';
import './external/pcui.js';
import './external/pcui-graph.js';

// relay server client
import './relay/client.js';

// core
import './constants.js';
import './array.js';
import './color.js';
import './ajax.js';
import './observer-sync.js';

// legacy ui
import './ui/ui.js';
import './ui/element.js';
import './ui/container-element.js';
import './ui/button.js';
import './ui/checkbox.js';
import './ui/code.js';
import './ui/label.js';
import './ui/number-field.js';
import './ui/overlay.js';
import './ui/panel.js';
import './ui/select-field.js';
import './ui/text-field.js';
import './ui/textarea-field.js';
import './ui/color-field.js';
import './ui/image-field.js';
import './ui/slider.js';
import './ui/progress.js';
import './ui/list.js';
import './ui/list-item.js';
import './ui/grid.js';
import './ui/grid-item.js';
import './ui/tree.js';
import './ui/tree-item.js';
import './ui/tooltip.js';
import './ui/menu.js';
import './ui/menu-item.js';
import './ui/canvas.js';
import './ui/curve-field.js';
import './ui/autocomplete-element.js';
import './ui/bubble.js';
import './ui/radiobutton.js';

// pcui
import './pcui/element/element-color-input.js';
import './pcui/element/element-gradient-input.js';
import './pcui/element/element-curve-input.js';
import './pcui/asset-thumbnail-renderers/thumbnail-renderer-utils.js';
import './pcui/asset-thumbnail-renderers/cubemap-thumbnail-renderer.js';
import './pcui/asset-thumbnail-renderers/cubemap-3d-thumbnail-renderer.js';
import './pcui/asset-thumbnail-renderers/material-thumbnail-renderer.js';
import './pcui/asset-thumbnail-renderers/font-thumbnail-renderer.js';
import './pcui/asset-thumbnail-renderers/model-thumbnail-renderer.js';
import './pcui/asset-thumbnail-renderers/sprite-thumbnail-renderer.js';
import './pcui/asset-thumbnail-renderers/render-thumbnail-renderer.js';
import './pcui/element/element-asset-thumbnail.js';
import './pcui/element/element-asset-input.js';
import './pcui/element/element-entity-input.js';
import './pcui/element/element-asset-list.js';
import './pcui/element/element-batchgroup-input.js';
import './pcui/element/element-bundles-input.js';
import './pcui/element/element-layers-input.js';
import './pcui/element/element-drop-manager.js';
import './pcui/element/element-drop-target.js';
import './pcui/element/element-tooltip.js';
import './pcui/element/element-tooltip-group.js';
import './pcui/element/element-table-cell.js';
import './pcui/element/element-table-row.js';
import './pcui/element/element-table.js';

// general
import './editor/editor.js';
import './editor/first-load.js';
import './api/setup.js';
import './editor/storage/localstorage.js';
import './editor/storage/clipboard.js';
import './editor/users/users-flags.js';
import './editor/hotkeys.js';
import './editor/layout.js';
import './editor/messenger.js';
import './editor/relay.js';
import './editor/history/history.js';
import './editor/history/history-hotkeys.js';
import './editor/history/history-status-text.js';
import './editor/status.js';
import './editor/permissions.js';
import './editor/error.js';
import './editor/drop.js';
import './editor/cursor.js';
import './editor/datetime.js';
import './editor/search.js';
import './editor/notifications.js';
import './editor/refocus.js';


// realtime
import './realtime/share.uncompressed.js';
import './editor/realtime.js';

// users
import './editor/users/users.js';
import './editor/users/users-usage.js';
import './editor/users/users-colors.js';

// project
import './editor/project/project.js';
import './editor/project/module.js';
import './editor/project/engine-asset.js';

// observer lists
import './editor/entities/entities.js';
import './editor/assets/assets.js';

// settings
import './editor/settings/settings.js';
import './editor/settings/user-settings.js';
import './editor/settings/project-user-settings.js';
import './editor/settings/project-settings.js';
import './editor/settings/project-private-settings.js';
import './editor/settings/scene-settings.js';
import './editor/settings/scene-settings-sync.js';
import './editor/settings/session-settings.js';

// settings attributes
import './editor/settings/settings-attributes-physics.js';
import './editor/settings/settings-attributes-scene.js';
import './editor/settings/settings-attributes-scripts-priority.js';

// selector
import './editor/selector/selector.js';
import './editor/selector/selector-sync.js';
import './editor/selector/selector-history.js';

// repositories
import './editor/repositories/repositories.js';

// sourcefiles
import './editor/sourcefiles/sourcefiles.js';
import './editor/sourcefiles/sourcefiles-skeleton.js';
import './editor/sourcefiles/sourcefiles-attributes-scan.js';

// schema
import './editor/schema/schema.js';
import './editor/schema/schema-scene.js';
import './editor/schema/schema-asset.js';
import './editor/schema/schema-settings.js';
import './editor/schema/schema-components.js';
import './editor/schema/schema-material.js';
import './editor/schema/schema-anim-state-graph.js';

// components
import './editor/components/components-logos.js';
import './editor/components/scrollbar/components-scrollbar-defaults.js';

// entities
import './editor/entities/entities-selection.js';
import './editor/entities/entities-addComponent.js';
import './editor/entities/entities-pasteComponent.js';
import './editor/entities/entities-create.js';
import './editor/entities/entities-delete.js';
import './editor/entities/entities-duplicate.js';
import './editor/entities/entities-copy.js';
import './editor/entities/entities-paste.js';
import './editor/entities/entities-reparent.js';
import './editor/entities/entities-panel.js';
import './editor/entities/entities-treeview.js';
import './editor/entities/entities-menu.js';
import './editor/entities/entities-control.js';
import './editor/entities/entities-fuzzy-search.js';
import './editor/entities/entities-advanced-search-ui.js';
import './editor/entities/entities-load.js';
import './editor/entities/entities-layout-utils.js';
import './editor/entities/entities-history.js';
import './editor/entities/entities-sync.js';
import './editor/entities/entities-migrations.js';
import './editor/entities/entities-scripts.js';
import './editor/entities/entities-hotkeys.js';
import './editor/entities/entities-context-menu.js';
import './editor/entities/entities-components-menu.js';
import './editor/entities/entities-template-menu.js';
import './editor/entities/entities-pick.js';
import './editor/entities/entities-icons.js';
import './editor/entities/entities-gizmo-translate.js';
import './editor/entities/entities-gizmo-scale.js';
import './editor/entities/entities-gizmo-rotate.js';

// gizmo
import './editor/gizmo/gizmo.js';
import './editor/gizmo/gizmo-layers.js';
import './editor/gizmo/gizmo-point.js';
import './editor/gizmo/gizmo-translate.js';
import './editor/gizmo/gizmo-scale.js';
import './editor/gizmo/gizmo-rotate.js';
import './editor/gizmo/gizmo-camera.js';
import './editor/gizmo/gizmo-light.js';
import './editor/gizmo/gizmo-collision.js';
import './editor/gizmo/gizmo-particles.js';
import './editor/gizmo/gizmo-skeleton.js';
import './editor/gizmo/gizmo-bounding-box.js';
import './editor/gizmo/gizmo-zone.js';
import './editor/gizmo/gizmo-screen.js';
import './editor/gizmo/gizmo-element.js';
import './editor/gizmo/gizmo-element-anchor.js';
import './editor/gizmo/gizmo-element-size.js';
import './editor/gizmo/gizmo-button.js';

// assets
import './editor/assets/assets-registry.js';
import './editor/assets/assets-sync.js';
import './editor/assets/assets-fs.js';
import './editor/assets/asset-panel.js';
import './editor/assets/assets-panel.js';
import './editor/assets/assets-context-menu.js';
import './editor/assets/assets-upload.js';
import './editor/assets/assets-reimport.js';
import './editor/assets/assets-drop.js';
import './editor/assets/assets-delete.js';
import './editor/assets/assets-duplicate.js';
import './editor/assets/assets-copy.js';
import './editor/assets/assets-paste.js';
import './editor/assets/assets-edit.js';
import './editor/assets/assets-replace.js';
import './editor/assets/assets-rename.js';
import './editor/assets/assets-rename-select.js';
import './editor/assets/assets-history.js';
import './editor/assets/assets-migrate.js';
import './editor/assets/assets-create-folder.js';
import './editor/assets/assets-cubemap-prefiltering.js';
import './editor/assets/assets-create-bundle.js';
import './editor/assets/assets-create-material.js';
import './editor/assets/assets-create-cubemap.js';
import './editor/assets/assets-create-html.js';
import './editor/assets/assets-create-css.js';
import './editor/assets/assets-create-json.js';
import './editor/assets/assets-create-text.js';
import './editor/assets/assets-create-script.js';
import './editor/assets/assets-create-shader.js';
import './editor/assets/assets-create-sprite.js';
import './editor/assets/assets-create-i18n.js';
import './editor/assets/assets-create-template.js';
import './editor/assets/assets-create-anim-state-graph.js';
import './editor/assets/assets-unwrap.js';
import './editor/assets/assets-used.js';
import './editor/assets/assets-script-parse.js';
import './editor/assets/handle-script-parse.js';
import './editor/assets/assets-script-registry.js';
import './editor/assets/assets-sprite-utils.js';
import './editor/assets/assets-bundles.js';
import './editor/assets/assets-move-to-store.js';
import './editor/assets/assets-textures-compress.js';

// templates
import './editor/templates/template-pipeline-tasks.js';
import './editor/templates/new-template-data.js';
import './editor/templates/remap-entity-ids.js';
import './editor/templates/template-utils.js';
import './editor/templates/deep-equal.js';
import './editor/templates/template-node-traversal.js';
import './editor/templates/find-template-conflicts.js';
import './editor/templates/find-apply-candidates.js';
import './editor/templates/revert-overrides.js';
import './editor/templates/compute-overrides.js';
import './editor/templates/compute-overrides-filter.js';
import './editor/templates/filter-overrides/handle-children-conflict.js';
import './editor/templates/filter-overrides/handle-script-order-conflict.js';
import './editor/templates/filter-overrides/set-reparent-path.js';
import './editor/templates/all-entity-paths.js';
import './editor/templates/get-script-attributes.js';
import './editor/templates/is-valid-template-conflict.js';
import './editor/templates/is-template.js';
import './editor/templates/unlink-template.js';

// vc graph
import './editor/vc-graph/vc-graph.js';
import './editor/vc-graph/vc-utils.js';
import './editor/vc-graph/vc-colors.js';
import './editor/vc-graph/vertical-consistency.js';
import './editor/vc-graph/compact-branches.js';
import './editor/vc-graph/place-vc-nodes.js';
import './editor/vc-graph/split-node-description.js';
import './editor/vc-graph/vc-node-menu.js';
import './editor/vc-graph/make-hist-graph.js';
import './editor/vc-graph/sync-hist-graph.js';

// images
import './editor/images/images-upload.js';

// userdata
import './editor/userdata/userdata-realtime.js';
import './editor/userdata/userdata.js';

// scenes
import './editor/scenes/scenes.js';
import './editor/scenes/scenes-load.js';

// checkpoint
import './editor/checkpoints/checkpoints.js';

// branches
import './editor/branches/branches.js';

// diff
import './editor/diff/diff.js';

// camera
import './editor/camera/camera.js';
import './editor/camera/camera-history.js';
import './editor/camera/camera-userdata.js';
import './editor/camera/camera-depth.js';
import './editor/camera/camera-user.js';
import './editor/camera/camera-focus.js';
import './editor/camera/camera-fly.js';
import './editor/camera/camera-orbit.js';
import './editor/camera/camera-zoom.js';
import './editor/camera/camera-pan.js';
import './editor/camera/camera-look-around.js';
import './editor/camera/camera-preview.js';


// apps
import './editor/apps/apps.js';

// whoisonline
import './editor/whoisonline/whoisonline.js';
import './editor/whoisonline/whoisonline-scene.js';

// attributes panel
import './editor/attributes/attributes-panel.js';
import './editor/attributes/attributes-assets-list.js';
import './editor/attributes/attributes-array.js';
import './editor/attributes/attributes-history.js';

// attributes reference
import './editor/attributes/attributes-reference.js';

import './editor/attributes/reference/attributes-settings-reference.js';
import './editor/attributes/reference/attributes-sprite-editor-reference.js';

import './editor/attributes/reference/attributes-entity-reference.js';
import './editor/attributes/reference/attributes-components-anim-reference.js';
import './editor/attributes/reference/attributes-components-animation-reference.js';
import './editor/attributes/reference/attributes-components-audiolistener-reference.js';
import './editor/attributes/reference/attributes-components-audiosource-reference.js';
import './editor/attributes/reference/attributes-components-sound-reference.js';
import './editor/attributes/reference/attributes-components-soundslot-reference.js';
import './editor/attributes/reference/attributes-components-camera-reference.js';
import './editor/attributes/reference/attributes-components-collision-reference.js';
import './editor/attributes/reference/attributes-components-light-reference.js';
import './editor/attributes/reference/attributes-components-model-reference.js';
import './editor/attributes/reference/attributes-components-render-reference.js';
import './editor/attributes/reference/attributes-components-particlesystem-reference.js';
import './editor/attributes/reference/attributes-components-rigidbody-reference.js';
import './editor/attributes/reference/attributes-components-script-reference.js';
import './editor/attributes/reference/attributes-components-screen-reference.js';
import './editor/attributes/reference/attributes-components-element-reference.js';
import './editor/attributes/reference/attributes-components-button-reference.js';
import './editor/attributes/reference/attributes-components-scroll-view-reference.js';
import './editor/attributes/reference/attributes-components-scrollbar-reference.js';
import './editor/attributes/reference/attributes-components-sprite-reference.js';
import './editor/attributes/reference/attributes-components-sprite-animation-clip-reference.js';
import './editor/attributes/reference/attributes-components-layoutgroup-reference.js';
import './editor/attributes/reference/attributes-components-layoutchild-reference.js';
import './editor/attributes/reference/attributes-components-zone-reference.js';

import './editor/attributes/reference/attributes-asset-reference.js';
import './editor/attributes/reference/attributes-asset-audio-reference.js';
import './editor/attributes/reference/attributes-asset-anim-reference.js';
import './editor/attributes/reference/attributes-asset-animation-reference.js';
import './editor/attributes/reference/attributes-asset-css-reference.js';
import './editor/attributes/reference/attributes-asset-cubemap-reference.js';
import './editor/attributes/reference/attributes-asset-html-reference.js';
import './editor/attributes/reference/attributes-asset-json-reference.js';
import './editor/attributes/reference/attributes-asset-material-reference.js';
import './editor/attributes/reference/attributes-asset-model-reference.js';
import './editor/attributes/reference/attributes-asset-script-reference.js';
import './editor/attributes/reference/attributes-asset-text-reference.js';
import './editor/attributes/reference/attributes-asset-texture-reference.js';
import './editor/attributes/reference/attributes-asset-render-reference.js';
import './editor/attributes/reference/attributes-asset-shader-reference.js';
import './editor/attributes/reference/attributes-asset-font-reference.js';
import './editor/attributes/reference/attributes-asset-sprite-reference.js';

// attributes entities (legacy)
import './editor/attributes/attributes-entity.js';
import './editor/attributes/components/attributes-components-script.js';

// templates
import './editor/templates/templates-override-panel.js';
import './editor/templates/templates-override-tooltip.js';
import './editor/templates/templates-override-inspector.js';
import './editor/templates/templates-entity-inspector.js';

// pcui attribute inspectors
import './editor/inspector/tooltip-reference.js';
import './editor/inspector/attributes.js';
import './editor/inspector/components/component.js';
import './editor/inspector/components/animation.js';
import './editor/inspector/components/anim.js';
import './editor/inspector/components/audiolistener.js';
import './editor/inspector/components/audiosource.js';
import './editor/inspector/components/button.js';
import './editor/inspector/components/camera.js';
import './editor/inspector/components/collision.js';
import './editor/inspector/components/element.js';
import './editor/inspector/components/model.js';
import './editor/inspector/components/layoutchild.js';
import './editor/inspector/components/layoutgroup.js';
import './editor/inspector/components/light.js';
import './editor/inspector/components/particlesystem.js';
import './editor/inspector/components/render.js';
import './editor/inspector/components/rigidbody.js';
import './editor/inspector/components/screen.js';
import './editor/inspector/components/script.js';
import './editor/inspector/components/scrollbar.js';
import './editor/inspector/components/scrollview.js';
import './editor/inspector/components/sound.js';
import './editor/inspector/components/sprite.js';
import './editor/inspector/components/zone.js';
import './editor/inspector/entity.js';
import './editor/inspector/asset.js';
import './editor/inspector/assets/asset-preview-base.js';
import './editor/inspector/assets/anim-viewer.js';
import './editor/inspector/assets/animation.js';
import './editor/inspector/assets/animation-preview.js';
import './editor/inspector/assets/animstategraph-view.js';
import './editor/inspector/assets/animstategraph-anim-component.js';
import './editor/inspector/assets/animstategraph-layers.js';
import './editor/inspector/assets/animstategraph-parameters.js';
import './editor/inspector/assets/animstategraph-state.js';
import './editor/inspector/assets/animstategraph-transitions.js';
import './editor/inspector/assets/animstategraph-condition.js';
import './editor/inspector/assets/animstategraph.js';
import './editor/inspector/assets/audio.js';
import './editor/inspector/assets/model.js';
import './editor/inspector/assets/model-mesh-instances.js';
import './editor/inspector/assets/model-preview.js';
import './editor/inspector/assets/material.js';
import './editor/inspector/assets/material-preview.js';
import './editor/inspector/assets/texture.js';
import './editor/inspector/assets/texture-preview.js';
import './editor/inspector/assets/code-block.js';
import './editor/inspector/assets/css.js';
import './editor/inspector/assets/html.js';
import './editor/inspector/assets/json.js';
import './editor/inspector/assets/shader.js';
import './editor/inspector/assets/text.js';
import './editor/inspector/assets/cubemap.js';
import './editor/inspector/assets/cubemap-face.js';
import './editor/inspector/assets/cubemap-preview.js';
import './editor/inspector/assets/bundle.js';
import './editor/inspector/assets/sprite.js';
import './editor/inspector/assets/sprite-preview.js';
import './editor/inspector/assets/script.js';
import './editor/inspector/assets/related-assets.js';
import './editor/inspector/assets/scene-source.js';
import './editor/inspector/assets/texture-source.js';
import './editor/inspector/assets/font-source.js';
import './editor/inspector/assets/font.js';
import './editor/inspector/assets/font-preview.js';
import './editor/inspector/assets/textureatlas.js';
import './editor/inspector/assets/textureatlas-preview.js';
import './editor/inspector/assets/wasm.js';
import './editor/inspector/assets/render.js';
import './editor/inspector/assets/render-preview.js';
import './editor/inspector/assets/container.js';
import './editor/inspector/settings.js';
import './editor/inspector/settings-panels/base.js';
import './editor/inspector/settings-panels/editor.js';
import './editor/inspector/settings-panels/physics.js';
import './editor/inspector/settings-panels/rendering.js';
import './editor/inspector/settings-panels/layers.js';
import './editor/inspector/settings-panels/layers-layer-panel.js';
import './editor/inspector/settings-panels/layers-render-order.js';
import './editor/inspector/settings-panels/layers-render-order-list.js';
import './editor/inspector/settings-panels/lightmapping.js';
import './editor/inspector/settings-panels/batchgroups.js';
import './editor/inspector/settings-panels/batchgroups-item.js';
import './editor/inspector/settings-panels/loading-screen.js';
import './editor/inspector/settings-panels/external-scripts.js';
import './editor/inspector/settings-panels/input.js';
import './editor/inspector/settings-panels/localization.js';
import './editor/inspector/settings-panels/network.js';
import './editor/inspector/settings-panels/asset-tasks.js';
import './editor/inspector/settings-panels/audio.js';
import './editor/inspector/settings-panels/scripts.js';
import './editor/inspector/settings-panels/settings-history.js';

// attributes assets
import './editor/attributes/attributes-asset.js';

// chat
import './editor/chat/chat-connection.js';
import './editor/chat/chat-widget.js';
import './editor/chat/chat-typing.js';
import './editor/chat/chat-system.js';
import './editor/chat/chat-notifications.js';

// toolbar
import './editor/toolbar/toolbar-logo.js';
import './editor/toolbar/toolbar-editor-settings.js';
import './editor/toolbar/toolbar-contact.js';
import './editor/toolbar/toolbar-controls.js';
import './editor/toolbar/toolbar-help.js';
import './editor/toolbar/toolbar-gizmos.js';
import './editor/toolbar/toolbar-history.js';
import './editor/toolbar/toolbar-lightmapper.js';
import './editor/toolbar/toolbar-publish.js';
import './editor/toolbar/toolbar-code-editor.js';
import './editor/toolbar/toolbar-scene.js';
import './editor/toolbar/toolbar-launch.js';
import './editor/toolbar/toolbar-cameras.js';
import './editor/toolbar/toolbar-whois.js';
import './editor/toolbar/toolbar-connection.js';
import './editor/toolbar/toolbar-usage.js';

// pickers
import './editor/pickers/picker.js';
import './editor/pickers/picker-confirm.js';
import './editor/pickers/picker-color.js';
import './editor/pickers/picker-asset.js';
import './editor/pickers/picker-curve.js';
import './editor/pickers/picker-entity.js';
import './editor/pickers/picker-node.js';
import './editor/pickers/picker-project.js';

// project management pickers
import './editor/pickers/project-management/project-management.js';

import './editor/pickers/picker-project-main.js';

import './editor/pickers/project-management/picker-cms.js';
import './editor/pickers/project-management/picker-modal-new-project.js';
import './editor/pickers/project-management/picker-modal-new-project-confirmation.js';
import './editor/pickers/project-management/picker-modal-new-organization.js';
import './editor/pickers/project-management/picker-modal-delete-organization.js';
import './editor/pickers/project-management/picker-modal-delete-project-confirmation.js';
import './editor/pickers/project-management/picker-modal-delete-self-confirmation.js';
import './editor/pickers/project-management/picker-modal-visibility-confirmation.js';

import './editor/pickers/picker-scene.js';
import './editor/pickers/picker-script-create.js';

// version control pickers
import './editor/pickers/version-control/picker-version-control-svg.js';
import './editor/pickers/version-control/picker-version-control-common.js';
import './editor/pickers/version-control/picker-version-control-side-panel.js';
import './editor/pickers/version-control/picker-version-control-progress.js';
import './editor/pickers/version-control/picker-version-control-create-checkpoint.js';
import './editor/pickers/version-control/picker-version-control-restore-checkpoint.js';
import './editor/pickers/version-control/picker-version-control-hard-reset-checkpoint.js';
import './editor/pickers/version-control/picker-version-control-create-branch.js';
import './editor/pickers/version-control/picker-version-control-close-branch.js';
import './editor/pickers/version-control/picker-version-control-delete-branch.js';
import './editor/pickers/version-control/picker-version-control-merge-branches.js';
import './editor/pickers/version-control/picker-version-control-checkpoints.js';
import './editor/pickers/version-control/picker-version-control-diff-checkpoints.js';
import './editor/pickers/version-control/picker-version-control.js';
import './editor/pickers/version-control/picker-version-control-overlay-message.js';
import './editor/pickers/version-control/picker-version-control-messenger.js';
import './editor/pickers/version-control/picker-version-control-overlay-merge.js';

import './editor/pickers/picker-builds-publish.js';
import './editor/pickers/picker-publish-new.js';
import './editor/pickers/picker-gradient.js';
import './editor/pickers/picker-text-input.js';
import './editor/pickers/picker-legacy-scripts.js';
import './editor/pickers/picker-recompress-textures.js';
import './editor/pickers/picker-release-notes.js';
import './editor/pickers/picker-fix-corrupted-templates.js';

// team management picker
import './editor/pickers/picker-team-management.js';

// conflict manager
import './editor/pickers/conflict-manager/picker-conflict-manager-section-field.js';
import './editor/pickers/conflict-manager/picker-conflict-manager-section-row.js';
import './editor/pickers/conflict-manager/picker-conflict-manager-section.js';
import './editor/pickers/conflict-manager/picker-conflict-manager-resolver.js';
import './editor/pickers/conflict-manager/picker-conflict-manager-text-resolver.js';
import './editor/pickers/conflict-manager/picker-conflict-manager-scene.js';
import './editor/pickers/conflict-manager/picker-conflict-manager-settings.js';
import './editor/pickers/conflict-manager/picker-conflict-manager-asset.js';
import './editor/pickers/conflict-manager/picker-conflict-manager.js';


// sprites
import './editor/pickers/sprite-editor/sprite-editor-atlas-panel.js';
import './editor/pickers/sprite-editor/sprite-editor-frames-attributes-panel.js';
import './editor/pickers/sprite-editor/sprite-editor-frames-related-sprites-panel.js';
import './editor/pickers/sprite-editor/sprite-editor-preview-panel.js';
import './editor/pickers/sprite-editor/sprite-editor-generate-frames-panel.js';
import './editor/pickers/sprite-editor/sprite-editor-import-frames-panel.js';
import './editor/pickers/sprite-editor/sprite-editor-sprite-panel.js';
import './editor/pickers/sprite-editor/sprite-editor-sprite-assets-panel.js';
import './editor/pickers/sprite-editor/sprite-editor.js';
import './editor/pickers/sprite-editor/sprite-editor-frames-panel.js';
import './editor/pickers/sprite-editor/sprite-editor-selection.js';
import './editor/pickers/sprite-editor/sprite-editor-render-preview.js';
import './editor/pickers/sprite-editor/sprite-editor-trim.js';
import './editor/pickers/sprite-editor/sprite-editor-edit-frame.js';
import './editor/pickers/sprite-editor/sprite-editor-delete.js';

// viewport
import './editor/viewport/viewport-application.js';
import "./editor/viewport/viewport-grid.js";
import './editor/viewport/viewport.js';
import './editor/viewport/viewport-resize.js';
import './editor/viewport/viewport-expand.js';
import './editor/viewport/viewport-entities-create.js';
import './editor/viewport/viewport-entities-observer-binding.js';
import './editor/viewport/viewport-entities-components-binding.js';
import './editor/viewport/viewport-entities-elements.js';
import './editor/viewport/viewport-layers.js';
import './editor/viewport/viewport-scene-settings.js';
import './editor/viewport/viewport-assets.js';
import './editor/viewport/viewport-lightmapper.js';
import './editor/viewport/viewport-lightmapper-auto.js';
import './editor/viewport/viewport-drop-model.js';
import './editor/viewport/viewport-drop-material.js';
import './editor/viewport/viewport-drop-cubemap.js';
import './editor/viewport/viewport-drop-sprite.js';
import './editor/viewport/viewport-drop-template.js';
import './editor/viewport/viewport-engine-data.js';
import './editor/viewport/viewport-userdata.js';
import './editor/viewport/viewport-user-cameras.js';
import './editor/viewport/viewport-tap.js';
import './editor/viewport/viewport-pick.js';
import './editor/viewport/viewport-cursor.js';
import './editor/viewport/viewport-tooltips.js';
import './editor/viewport/viewport-focus.js';
import './editor/viewport/viewport-outline.js';
import './editor/viewport/viewport-i18n.js';

// previews
import './editor/assets/assets-preview-material-watch.js';
import './editor/assets/assets-preview-model-watch.js';
import './editor/assets/assets-preview-cubemap-watch.js';
import './editor/assets/assets-preview-font-watch.js';
import './editor/assets/assets-preview-sprite-watch.js';
import './editor/assets/assets-preview-render-watch.js';
import './editor/viewport/viewport-preview-particles.js';
import './editor/viewport/viewport-preview-animation.js';

// help
import './editor/help/controls.js';
import './editor/help/howdoi.js';
import './editor/help/howdoi-popup.js';
import './editor/help/howdoi-load.js';
import './editor/demo_project.js';

import './editor/guides/guide-bubbles.js';
import './editor/guides/guide-intro.js';

// Template migrations
import './editor/templates/migrations/fix-corrupted-instances.js';

// plugins
import './editor/plugins.js';
