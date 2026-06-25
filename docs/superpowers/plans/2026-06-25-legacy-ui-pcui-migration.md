# Legacy UI to PCUI Migration Plan

> **For agentic workers:** Implement task-by-task. Keep checkboxes updated. This plan tracks [playcanvas/editor#1376](https://github.com/playcanvas/editor/issues/1376).

**Goal:** Remove runtime use of `@/common/ui/*` from the main Editor and delete the old Legacy UI implementation once no imports remain.

**Issue context:** `#1376` is open as "Convert Legacy UI to PCUI". The Code Editor is already PCUI-only; the main Editor still has old UI usage. The issue comments call out tooltip UX as important, so tooltips must keep the current snappy hover/placement behavior.

**Architecture:** Convert existing call sites to `@playcanvas/pcui` and existing editor PCUI extensions in `src/common/pcui/element/*`. Preserve Caller method names (`attributes:addField`, `picker:asset`, etc.) and feature behavior. Do not add a new compatibility layer named `Legacy*`; migrate in place or delete dead code.

**Tech Stack:** TypeScript, `@playcanvas/pcui`, editor-local PCUI elements (`Tooltip`, `ColorInput`, `CurveInput`, `GradientInput`, `AssetInput`, `AssetList`, `EntityInput`), SASS.

## Current Inventory

- `44` files under `src/editor` import `@/common/ui/*`.
- No `src/code-editor`, `src/launch`, or `src/common` consumer imports `@/common/ui/*` except the legacy implementation itself.
- `src/common/ui/menu.ts` and `src/common/ui/menu-item.ts` are dead: only referenced by each other.
- The widest live dependency is `LegacyTooltip` (`31` editor files).
- The largest migration island is `src/editor/attributes/attributes-panel.ts`, which still builds the dynamic inspector field system with Legacy UI widgets.

## Success Criteria

- `rg "@/common/ui/" src` returns nothing.
- `rg "Legacy(Button|Canvas|Checkbox|Code|ColorField|Container|CurveField|Element|ImageField|Label|List|ListItem|Menu|MenuItem|NumberField|Overlay|Panel|Progress|SelectField|Slider|TextAreaField|TextField|Tooltip)" src` returns nothing.
- `src/common/ui/` is deleted.
- `sass/ui/` and `sass/common/_ui-common.scss` are deleted, unless a remaining non-legacy selector is proven necessary.
- Main Editor smoke paths still work: toolbar tooltips, entity inspector, component add/remove, asset/entity/node pickers, color/curve/gradient pickers, asset-list fields, sprite related-assets list, texture compression controls.
- Verification passes: `npm run type:check`, `npm run lint`, `npm run build`.

## Global Constraints

- Do not edit `dist/`.
- Do not add dependencies.
- Keep the Caller API stable unless every caller is changed in the same task.
- Prefer deletion over migration for dead or unreachable legacy-script UI, but only after confirming the path is no longer required.
- Keep styles scoped to the migrated feature. Do not do a one-shot SASS rewrite.
- Each task ends with the listed `rg` check plus `npm run type:check`. Run full lint/build after every few tasks and at the end.

## Task 1: Remove Dead Legacy Menu Files

- [x] Complete
- Verification: `rg "LegacyMenu|common/ui/menu" src sass test test-suite` passed. `npm run type:check` still fails on pre-existing repo-wide TypeScript errors unrelated to this deletion.

**Files:**
- Delete: `src/common/ui/menu.ts`
- Delete: `src/common/ui/menu-item.ts`

These are not imported by editor runtime code. Delete them first to reduce the false inventory.

Verification:

```bash
rg "LegacyMenu|common/ui/menu" src sass test test-suite
npm run type:check
```

## Task 2: Migrate LegacyTooltip

- [x] Complete
- Verification: `rg "@/common/ui/tooltip|LegacyTooltip" src/editor` passed. Filtered typecheck found no `TooltipHandle` errors; `npm run type:check` still has unrelated baseline errors. `npm run lint` passed.

**Files:**
- Modify: all files importing `@/common/ui/tooltip`
- Modify if needed: `src/common/pcui/element/element-tooltip.ts`
- Reuse: `src/common/tooltips.ts`

Use the existing shared PCUI tooltip instance:

```ts
import { tooltip, tooltipSimpleItem } from '@/common/tooltips';
```

Representative simple tooltip change:

```diff
-import { LegacyTooltip } from '@/common/ui/tooltip';
+import { tooltip, tooltipSimpleItem } from '@/common/tooltips';

-LegacyTooltip.attach({
-    target: button.dom,
-    text: 'Undo',
-    align: 'left',
-    root
-});
+tooltip().attach({
+    container: tooltipSimpleItem({ text: 'Undo' }),
+    target: button,
+    align: 'left'
+});
```

Migration notes:

- Simple text tooltips become `tooltipSimpleItem`.
- Rich hoverable tooltips become a `Container` with `Label`/`Button` children.
- Prefer improving `src/common/pcui/element/element-tooltip.ts` once if UX parity is missing, rather than patching every caller.
- Preserve hoverable tooltip behavior in `toolbar-lightmapper.ts`.
- Convert manual `LegacyTooltip.create` call sites in `asset-panel.ts` and `attributes-inspector.ts` to the shared `tooltip()` API or a small PCUI-only local container.

Verification:

```bash
rg "@/common/ui/tooltip|LegacyTooltip" src/editor
npm run type:check
```

Manual checks:

- Hover every toolbar button.
- Hover lightmapper and confirm the Auto-Unwrap action stays clickable.
- Hover inspector copy/paste/reference controls.

## Task 3: Convert Simple Leaf Widgets

- [x] Complete
- Verification: converted `templates-override-panel.ts`, `sprite-editor-frames-related-sprites-panel.ts`, and `toolbar-lightmapper.ts`; targeted `rg` check passed for those files. Filtered typecheck found no new errors in those files. `npm run lint` passed. `hotkey.ts` cleanup is deferred until the remaining `LegacyList` consumers are gone.

**Files:**
- Modify: `src/editor/templates/templates-override-panel.ts`
- Modify: `src/editor/pickers/sprite-editor/sprite-editor-frames-related-sprites-panel.ts`
- Modify: `src/editor/toolbar/toolbar-lightmapper.ts`
- Modify: `src/editor/hotkey/hotkey.ts`

Use PCUI directly:

- `LegacyLabel` -> `Label`
- `LegacyButton` -> `Button`
- `LegacyList`/`LegacyListItem` in the sprite related-assets panel -> a `Container` with row `Button` or `Label` elements
- Remove `LegacyList._ctrl` / `_shift` hooks from `hotkey.ts` after the last `LegacyList` consumer is gone

Representative marker change:

```diff
-import { LegacyLabel } from '@/common/ui/label';
+import { Label } from '@playcanvas/pcui';

-const label = new LegacyLabel({ text });
+const label = new Label({ text });
```

Verification:

```bash
rg "@/common/ui/(button|label|list|list-item)" src/editor/templates src/editor/pickers/sprite-editor src/editor/toolbar/toolbar-lightmapper.ts src/editor/hotkey/hotkey.ts
npm run type:check
```

## Task 4: Convert Picker Overlays Without Rebuilding Their Flows

- [x] Complete
- Verification: `rg "@/common/ui/overlay|LegacyOverlay" src/editor/pickers/picker-asset.ts src/editor/pickers/picker-entity.ts src/editor/pickers/picker-node.ts` passed. Filtered typecheck found no errors in those files; remaining `LegacyOverlay` errors are in `picker-gradient.ts` for Task 5. `npm run lint` passed.

**Files:**
- Modify: `src/editor/pickers/picker-asset.ts`
- Modify: `src/editor/pickers/picker-entity.ts`
- Modify: `src/editor/pickers/picker-node.ts`

These pickers mostly use `LegacyOverlay` as a transparent modal guard while an existing panel is promoted. Replace only the overlay object with PCUI `Overlay` and keep the selection logic unchanged.

Representative change:

```diff
-import { LegacyOverlay } from '@/common/ui/overlay';
+import { Overlay } from '@playcanvas/pcui';

-const overlay = new LegacyOverlay();
-overlay.class.add('picker-asset');
-overlay.center = false;
-overlay.hidden = true;
+const overlay = new Overlay({
+    class: 'picker-asset',
+    clickable: false,
+    hidden: true
+});
```

If PCUI `Overlay` click behavior differs, set `clickable: false` and keep the current explicit Escape/close paths.

Verification:

```bash
rg "@/common/ui/overlay|LegacyOverlay" src/editor/pickers/picker-asset.ts src/editor/pickers/picker-entity.ts src/editor/pickers/picker-node.ts
npm run type:check
```

Manual checks:

- Pick a material/texture/script asset.
- Pick an entity field.
- Assign a model mesh node/material mapping.

## Task 5: Migrate Color, Curve, and Gradient Pickers

**Files:**
- Modify: `src/editor/pickers/picker-color.ts`
- Modify: `src/editor/pickers/picker-curve.ts`
- Modify: `src/editor/pickers/picker-gradient.ts`

Do not redesign these pickers. Keep their drawing/math/event behavior and swap the Legacy structural widgets for PCUI equivalents:

- `LegacyOverlay` -> `Overlay`
- `LegacyPanel` -> `Panel` or `Container`
- `LegacyCanvas` -> `Canvas`
- `LegacyButton` -> `Button`
- `LegacyLabel` -> `Label`
- `LegacyNumberField` -> `NumericInput`
- `LegacyTextField` -> `TextInput`
- `LegacyCheckbox` -> `BooleanInput`
- `LegacySelectField` -> `SelectInput`
- `LegacyTooltip` -> shared `tooltip()`

Representative field change:

```diff
-const fieldR = new LegacyNumberField({
+const fieldR = new NumericInput({
     precision: 1,
     step: 1,
     min: 0,
     max: 255
 });
-fieldR.renderChanges = false;
-fieldR.placeholder = 'r';
+fieldR.placeholder = 'r';
 fieldR.on('change', updateRects);
-panelFields.appendChild(fieldR.element);
+panelFields.appendChild(fieldR.dom);
```

Keep existing editor events:

- `picker:color`, `picker:color:start`, `picker:color:end`, `picker:color:rect`
- `picker:curve`, `picker:curve:close`
- `picker:gradient`, `picker:gradient:close`

Verification:

```bash
rg "@/common/ui/|Legacy(Button|Canvas|Checkbox|Label|NumberField|Overlay|Panel|SelectField|TextField|Tooltip)" src/editor/pickers/picker-color.ts src/editor/pickers/picker-curve.ts src/editor/pickers/picker-gradient.ts
npm run type:check
```

Manual checks:

- Edit material color fields.
- Edit particle/color gradient fields.
- Edit curve fields, including copy/paste/reset buttons.

## Task 6: Migrate Generic Attribute Fields

**Files:**
- Modify: `src/editor/attributes/attributes-panel.ts`
- Modify: `src/editor/attributes/attributes-array.ts`
- Modify: `src/editor/attributes/attributes-assets-list.ts`
- Modify: `src/editor/attributes/attributes-entity.ts`
- Modify: `src/editor/attributes/attributes-history.ts`
- Modify: `src/editor/attributes/reference/reference.ts`

This is the main island. Convert the dynamic `attributes:*` methods in place while preserving their Caller contracts.

Use:

- `Panel`, `Container`, `Label`, `LabelGroup`
- `Button`, `BooleanInput`, `NumericInput`, `TextInput`, `TextAreaInput`, `SelectInput`, `SliderInput`, `Progress`, `Code`
- `ColorInput`, `CurveInput`, `AssetInput`, `AssetList`, `EntityInput`, `GradientInput`

Representative method shape:

```diff
-const panel = new LegacyPanel(args.name || '');
+const panel = new Panel({
+    headerText: args.name || '',
+    collapsible: !!(args.foldable || args.folded),
+    collapsed: !!args.folded
+});
 (args.parent || root).append(panel);
```

Representative field-row shape:

```diff
-const label = new LegacyLabel({ text: args.name });
-panel.append(label);
-panel.append(field);
+const row = new LabelGroup({
+    text: args.name,
+    field
+});
+panel.append(row);
```

Important compatibility points:

- Where callers currently use `.element`, change them to `.dom` in the same task.
- Where callers use `.disabled`, switch to `.enabled = !disabled`.
- Where callers use `.class.add/remove`, PCUI supports the same class helper.
- Preserve `attributes:linkField` behavior and history combining.
- Keep `attributes:addField` return values usable by `attributes-array.ts` and `attributes-assets-list.ts`.

Verification:

```bash
rg "@/common/ui/" src/editor/attributes
npm run type:check
```

Manual checks:

- Select entity, asset, and settings panels.
- Add/remove/toggle components.
- Edit text, number, vector, color, curve, asset, entity, array, and asset-list fields.
- Undo/redo field edits.
- Inspect multi-selection mixed values.

## Task 7: Resolve Legacy Script UI

**Files:**
- Modify or delete: `src/editor/attributes/attributes-components-script.ts`
- Modify or delete: `src/editor/settings/attributes/settings-attributes-scripts-priority.ts`

Decision gate:

- If `useLegacyScripts` editing is still required, port these files to PCUI using the same attribute-field primitives from Task 6.
- If legacy script projects are read-only and this UI is unreachable, delete the UI registrations instead of porting them.

Porting representative change:

```diff
-const btnAddScript = new LegacyButton({ text: 'Add Script' });
+const btnAddScript = new Button({ text: 'Add Script' });
 btnAddScript.class.add('add-script');
 panel.append(btnAddScript);
```

Deletion representative shape:

```diff
-import './attributes/attributes-components-script';
-import './settings/attributes/settings-attributes-scripts-priority';
```

Only delete side-effect imports after confirming no required `useLegacyScripts` editor path depends on them.

Verification:

```bash
rg "@/common/ui/|Legacy(Button|Label|List|ListItem|Overlay|Panel)" src/editor/attributes/attributes-components-script.ts src/editor/settings/attributes/settings-attributes-scripts-priority.ts src/editor/index.ts
npm run type:check
```

Manual checks:

- Open a legacy-script project if one is available.
- Confirm read-only/deprecation messaging still appears.
- Confirm non-legacy projects have no script priority UI.

## Task 8: Delete Legacy UI Implementation and Styles

**Files:**
- Delete: `src/common/ui/`
- Delete if unused: `sass/ui/_ui.scss`
- Delete if unused: `sass/ui/_theme-dark.scss`
- Delete if unused: `sass/common/_ui-common.scss`
- Modify: `sass/editor.scss`
- Modify: `sass/editor/_editor-main.scss`
- Modify: `sass/code-editor.scss`
- Modify feature SASS files still matching `.ui-*`

Do this only after all source imports are gone.

Representative SASS cleanup:

```diff
-@import 'ui/ui';
-@import 'ui/theme-dark';
```

```diff
-@import '../common/ui-common';
```

Verification:

```bash
rg "@/common/ui/" src
rg "Legacy(Button|Canvas|Checkbox|Code|ColorField|Container|CurveField|Element|ImageField|Label|List|ListItem|Menu|MenuItem|NumberField|Overlay|Panel|Progress|SelectField|Slider|TextAreaField|TextField|Tooltip)" src
rg "\\.ui-" sass src
npm run type:check
npm run lint
npm run build
```

Manual checks:

- Full editor load.
- Code editor load, because `sass/code-editor.scss` currently imports `common/ui-common`.
- Main toolbar and inspector visual pass.

## Suggested Order

1. Dead files.
2. Tooltips.
3. Simple leaf widgets.
4. Picker overlays.
5. Color/curve/gradient pickers.
6. Generic attributes.
7. Legacy script decision and port/delete.
8. Final SASS and `src/common/ui` deletion.

This order removes the broadest easy dependency first, then tackles the only hard island (`attributes-panel.ts`) after smaller callers are already PCUI.
