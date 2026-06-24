# Version Control Graph Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the Version Control graph nodes and menu so they match the current version-control picker theme while keeping the existing `pcui-graph` renderer, SVG scaling, graph geometry, and menu behavior.

**Architecture:** Keep `@playcanvas/pcui-graph` and JointJS as the graph renderer. Use the existing per-node SVG `foreignObject > .graph-node-div` as the render target for richer node content, while the SVG rect remains the scalable node shell. Do not edit `node_modules`, do not replace the graph layout algorithm, and do not add tests.

**Tech Stack:** TypeScript, PCUI, `@playcanvas/pcui-graph`, JointJS SVG nodes, SASS.

---

## Branch

Current branch for this work:

```bash
feat/vc-graph-modernization
```

It was cut from:

```bash
feat/merge-picker-github-desktop
```

## Visual Reference

Use the existing mock as the target reference:

```text
docs/mockups/vc-graph-modernization.html
```

The important proposal details are:

- dark graph node shell with branch-colored accent stroke
- PlayCanvas version-control icon inside each node using `\uE431`
- title line
- username line, ellipsized
- date line, using a readable format such as `22 Jun 2026`
- hash chip
- branch label
- PCUI-styled node menu
- existing `pcui-graph` geometry, edge anchors, panning, zooming, and menu positioning retained

## Files

- Modify: `src/editor/vc/graph/vc-utils.ts`
  - Update node schema dimensions and colors.
  - Keep existing graph layout and branch color assignment.
  - Render HTML content into each node's existing `foreignObject`.
  - Keep menu coordinate calculations in sync with the new node size.

- Modify: `sass/editor/_editor-version-control-graph.scss`
  - Add scoped styles for `.vc-graph-node`.
  - Hide the old SVG text label for VC graph nodes.
  - Modernize `.pcui-menu.vc-node-menu` to match the picker theme.

- Reference only: `docs/mockups/vc-graph-modernization.html`
  - Do not rely on this file at runtime.
  - Keep it as the visual comparison until implementation is approved.

## Success Criteria

- VC graph nodes render with the modern card layout from the mock.
- Nodes still pan and zoom correctly because content lives inside the node `foreignObject`.
- Node click opens the existing node menu in the correct position.
- Branch colors remain visible as node accent colors and edge colors.
- Long usernames do not widen nodes; they ellipsize.
- The date is on a separate line from the username.
- Existing graph expand, compare, restore, hard reset, copy data, and close behaviors are unchanged.
- No automated tests are added.

---

### Task 1: Update VC Graph Node Schema

**Files:**
- Modify: `src/editor/vc/graph/vc-utils.ts`
- Test: none added, by user request

- [ ] **Step 1: Add node presentation constants near the existing graph constants**

Use constants instead of hardcoded repeated values.

```diff
 const COORD_COEFS = { x: 265, y: 110 };

+const VC_GRAPH_NODE_ICON = '\uE431';
+const VC_GRAPH_NODE_FILL = '#2a3437';
+const VC_GRAPH_NODE_TEXT = 'transparent';
+const VC_GRAPH_NODE_WIDTH = 226;
+const VC_GRAPH_NODE_HEIGHT = 86;
+const VC_GRAPH_NODE_LINE_HEIGHT = 13;
+const VC_GRAPH_NODE_SELECTED_STROKE = '#f60';
+const VC_GRAPH_FALLBACK_ACCENT = '#f60';
+const VC_GRAPH_DATE_FORMAT = {
+    day: 'numeric',
+    month: 'short',
+    year: 'numeric'
+} as const;
+
 const GRAPH_DEFAULTS = {
```

- [ ] **Step 2: Update `NODE_DEFAULTS` to reserve the modern node size**

Keep `includeIcon: false` because the icon will be rendered in the `foreignObject`, not by `pcui-graph`'s default SVG text icon.

```diff
 const NODE_DEFAULTS = {
-    textColor: '#20292b',
-    baseHeight: 72,
-    baseWidth: 190,
-    lineHeight: 15,
-    textAlignMiddle: true,
+    textColor: VC_GRAPH_NODE_TEXT,
+    baseHeight: VC_GRAPH_NODE_HEIGHT,
+    baseWidth: VC_GRAPH_NODE_WIDTH,
+    lineHeight: VC_GRAPH_NODE_LINE_HEIGHT,
+    textAlignMiddle: false,
     includeIcon: false
 };
```

- [ ] **Step 3: Modernize non-marker node schema**

Preserve the selected marker schema for type `0`. Modernize regular branch nodes only.

```diff
 vcNodeSchema: function (fill: string, stroke: string, i: number) {
+    if (!i) {
+        return Object.assign({
+            fill: fill,
+            stroke: stroke,
+            strokeSelected: stroke,
+            strokeHover: stroke
+        }, SELECTED_MARK.defaults);
+    }
+
     const h = {
-        fill: fill,
+        fill: VC_GRAPH_NODE_FILL,
         stroke: stroke,
-        strokeSelected: stroke,
-        strokeHover: stroke
+        fillSecondary: VC_GRAPH_NODE_FILL,
+        strokeSelected: VC_GRAPH_NODE_SELECTED_STROKE,
+        strokeHover: VC_GRAPH_NODE_SELECTED_STROKE
     };

-    const def = i ? NODE_DEFAULTS : SELECTED_MARK.defaults;
-
-    return Object.assign(h, def);
+    return Object.assign(h, NODE_DEFAULTS);
 },
```

- [ ] **Step 4: Run static verification for this task**

Run:

```bash
npm run type:check
```

Expected:

```text
exit code 0
```

If the full command is too slow during implementation, run it before the final handoff even if skipped during this task.

---

### Task 2: Render Modern Content Inside Node `foreignObject`

**Files:**
- Modify: `src/editor/vc/graph/vc-utils.ts`
- Test: none added, by user request

- [ ] **Step 1: Keep graph node creation synchronous and populate content after `createNode`**

Use an empty SVG label because the visible content comes from `foreignObject`.

```diff
 renderNewNode: function (h: Record<string, unknown>, data: VcGraphData) {
     data.graph.createNode({
         id: h.id,
-        name: VcUtils.vcNodeText(h, data),
+        name: '',
         nodeType: VcUtils.nodeToColorType(h, data),
         posX: VcUtils.transformCoord(h, 'x'),
         posY: VcUtils.transformCoord(h, 'y'),
         marker: h.isExpandable
     });

+    VcUtils.renderNodeContent(h, data);
+
     h.isNodeRendered = true;
 },
```

- [ ] **Step 2: Refresh content for already-rendered nodes**

This keeps existing nodes correct after graph history expansion and branch data merging.

```diff
 renderVcNode: function (h: Record<string, unknown>, data: VcGraphData) {
     if (h.isNodeRendered) {
         VcUtils.updateRenderedPosition(h, data);
+        VcUtils.renderNodeContent(h, data);
     } else {
         VcUtils.renderNewNode(h, data);
     }
```

- [ ] **Step 3: Add content data helpers near `vcNodeText`**

Retain `vcNodeText` for fallback/debug use, but do not use it as the visible label.

```diff
+vcNodeContent: function (node: Record<string, unknown>, data: VcGraphData) {
+    const h = node.checkpointData;
+
+    return {
+        title: VcUtils.descriptionLines(node, data).join(' '),
+        user: h.user_full_name || '',
+        date: VcUtils.epochToDisplayStr(h.created_at),
+        hash: node.id.substring(0, NUM_ID_CHARS),
+        branch: VcUtils.branchDescription(node, data),
+        accent: VcUtils.nodeAccent(node, data)
+    };
+},
+
+epochToDisplayStr: function (n: number) {
+    const d = new Date(n);
+
+    return d.toLocaleDateString(undefined, VC_GRAPH_DATE_FORMAT);
+},
+
+nodeAccent: function (node: Record<string, unknown>, data: VcGraphData) {
+    const styles = editor.call('vcgraph:getAllStyles');
+
+    const style = styles[VcUtils.nodeToColorType(node, data)];
+
+    return style?.stroke || VC_GRAPH_FALLBACK_ACCENT;
+},
+
 vcNodeText: function (node: Record<string, unknown>, data: VcGraphData) {
```

- [ ] **Step 4: Add DOM rendering helpers inside `VcUtils`**

Use `textContent`; do not build HTML strings from checkpoint, user, or branch data.

```diff
+renderNodeContent: function (node: Record<string, unknown>, data: VcGraphData) {
+    const el = data.graph.view.getNodeDomElement(node.id);
+
+    const div = el.querySelector<HTMLElement>('.graph-node-div');
+
+    if (!div) {
+        return;
+    }
+
+    const h = VcUtils.vcNodeContent(node, data);
+
+    div.className = 'graph-node-div vc-graph-node';
+    div.style.setProperty('--vc-graph-node-accent', h.accent);
+    div.replaceChildren();
+
+    VcUtils.appendNodeText(div, 'vc-graph-node-icon', VC_GRAPH_NODE_ICON);
+    VcUtils.appendNodeText(div, 'vc-graph-node-title', h.title);
+    VcUtils.appendNodeText(div, 'vc-graph-node-user', h.user);
+    VcUtils.appendNodeText(div, 'vc-graph-node-date', h.date);
+    VcUtils.appendNodeText(div, 'vc-graph-node-hash', h.hash);
+    VcUtils.appendNodeText(div, 'vc-graph-node-branch', h.branch);
+},
+
+appendNodeText: function (parent: HTMLElement, cls: string, text: string) {
+    const el = document.createElement('span');
+
+    el.className = cls;
+    el.textContent = text;
+    parent.appendChild(el);
+},
+
 descriptionLines: function (node: Record<string, unknown>, data: VcGraphData) {
```

- [ ] **Step 5: Keep screen-coordinate menu sizing synced**

No code beyond Task 1 should be needed because `nodeToScreenCoords` already uses `NODE_DEFAULTS.baseWidth` and `NODE_DEFAULTS.baseHeight`. Confirm these values are used after the constants change:

```ts
h.w = NODE_DEFAULTS.baseWidth * scale;
h.h = NODE_DEFAULTS.baseHeight * scale;
```

- [ ] **Step 6: Run static verification for this task**

Run:

```bash
npm run type:check
```

Expected:

```text
exit code 0
```

---

### Task 3: Add Scoped Modern VC Graph Styles

**Files:**
- Modify: `sass/editor/_editor-version-control-graph.scss`
- Test: none added, by user request

- [ ] **Step 1: Hide the old SVG text labels only inside the VC graph panel**

The graph still creates SVG `text` nodes, but the modern visible content lives in the `foreignObject`.

```diff
 .pcui-container.vc-graph-panel {
     position: fixed;
     z-index: 301;
@@
     .v-line {
         font-family: Arial, sans-serif;
         font-size: 12px;
     }
+
+    text[joint-selector='label'] {
+        display: none;
+    }
```

- [ ] **Step 2: Add modern node content styles**

Keep styles scoped to `.pcui-container.vc-graph-panel` so other graph uses are not affected.

```diff
+    .vc-graph-node {
+        box-sizing: border-box;
+        position: relative;
+        width: 100%;
+        height: 100%;
+        padding: 10px 12px;
+        color: #f2f5f6;
+        font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;
+        pointer-events: none;
+    }
+
+    .vc-graph-node-icon {
+        position: absolute;
+        left: 12px;
+        top: 16px;
+        display: grid;
+        width: 28px;
+        height: 28px;
+        place-items: center;
+        border: 1px solid color-mix(in srgb, var(--vc-graph-node-accent) 44%, transparent);
+        border-radius: 50%;
+        background: #20292b;
+        color: var(--vc-graph-node-accent);
+        font-family: pc-icon, 'Helvetica Neue', Arial, Helvetica, sans-serif;
+        font-size: 16px;
+        line-height: 1;
+    }
+
+    .vc-graph-node-title,
+    .vc-graph-node-user,
+    .vc-graph-node-date {
+        display: block;
+        margin-left: 42px;
+        overflow: hidden;
+        text-overflow: ellipsis;
+        white-space: nowrap;
+    }
+
+    .vc-graph-node-title {
+        max-width: 120px;
+        color: #f2f5f6;
+        font-size: 13px;
+        font-weight: 700;
+        line-height: 15px;
+    }
+
+    .vc-graph-node-user {
+        max-width: 118px;
+        margin-top: 4px;
+        color: #a6acad;
+        font-size: 11px;
+        line-height: 13px;
+    }
+
+    .vc-graph-node-date {
+        margin-top: 1px;
+        color: #b9c0c2;
+        font-size: 11px;
+        line-height: 13px;
+    }
+
+    .vc-graph-node-hash {
+        position: absolute;
+        right: 12px;
+        top: 15px;
+        padding: 0 5px;
+        border: 1px solid #6b6240;
+        border-radius: 4px;
+        background: rgb(0 0 0 / 20%);
+        color: #f1c75f;
+        font-family: Monaco, Menlo, Consolas, monospace;
+        font-size: 11px;
+        line-height: 16px;
+    }
+
+    .vc-graph-node-branch {
+        position: absolute;
+        right: 12px;
+        bottom: 8px;
+        max-width: 72px;
+        overflow: hidden;
+        color: #7f898c;
+        font-size: 11px;
+        font-weight: 700;
+        line-height: 16px;
+        text-align: right;
+        text-overflow: ellipsis;
+        text-transform: uppercase;
+        white-space: nowrap;
+    }
```

If `color-mix` is not accepted by the project style tooling or target browsers, replace that one line with:

```scss
border-color: var(--vc-graph-node-accent);
```

- [ ] **Step 3: Modernize the node menu in the same file**

Keep the menu behavior unchanged; only tune visual styling.

```diff
 .pcui-menu.vc-node-menu {
+    overflow: hidden;
+    border: 1px solid #1b2426;
+    border-radius: 6px;
+    background: #293234;
+    box-shadow: 0 12px 24px rgb(0 0 0 / 36%);
+
     .pcui-menu-item {
         background-color: #293234;
+        color: #c7ced0;
+        font-size: 12px;
+        line-height: 30px;
+    }
+
+    .pcui-menu-item:hover {
+        background: #364346;
+        color: #fff;
     }
 }
```

Do not change menu item labels or actions in `src/editor/vc/graph/vc-node-menu.ts` unless visual verification shows an existing item requires a class hook.

- [ ] **Step 4: Compile styles and run lint/type checks**

Run:

```bash
npm run compile
npm run lint
npm run type:check
```

Expected:

```text
all commands exit code 0
```

---

### Task 4: Visual Verification

**Files:**
- Modify only if visual verification exposes a mismatch:
  - `src/editor/vc/graph/vc-utils.ts`
  - `sass/editor/_editor-version-control-graph.scss`
- Test: none added, by user request

- [ ] **Step 1: Open the editor and the Version Control Graph**

Use the existing local editor workflow. Trigger a graph with at least:

- one main branch
- one secondary branch
- a selected node
- the node context menu open
- one long username or branch label

- [ ] **Step 2: Verify node rendering**

Check these items manually:

- node content pans and zooms with the SVG graph
- icon stays inside the node and scales with it
- title does not overlap the hash chip
- username ellipsizes instead of widening the node
- date is on its own line
- branch label stays bottom-right
- branch accent color is visible on the node icon and stroke

- [ ] **Step 3: Verify graph interactions**

Check these existing behaviors manually:

- clicking a node opens the same menu
- `View Changes` still opens the diff picker
- `Select for Compare` and compare state still work
- `New Branch`, `Restore`, `Hard Reset`, and `Copy Data` still fire their existing actions
- expanding a node does not drop the modern content from existing nodes
- graph zoom does not detach or mis-size node content

- [ ] **Step 4: Compare against the mock**

Open:

```text
docs/mockups/vc-graph-modernization.html
```

Compare the live graph against the "Modernized proposal" section. The live implementation does not need to match pixel-for-pixel, but it must keep the same information hierarchy and spacing.

- [ ] **Step 5: Final verification before handoff**

Run:

```bash
git diff --check
npm run compile
npm run lint
npm run type:check
```

Expected:

```text
all commands exit code 0
```

Do not run or add automated tests unless the user changes the instruction.

---

## Implementation Notes

- Do not modify `node_modules/@playcanvas/pcui-graph`.
- Do not replace `pcui-graph` with a custom graph renderer.
- Do not change graph coordinate math unless visual verification proves node spacing is broken.
- Do not add tests.
- Use `textContent` for user-controlled strings.
- Keep all styles under `.pcui-container.vc-graph-panel` or `.pcui-menu.vc-node-menu`.
- Keep the selected marker node behavior unchanged.

## Self-Review

- Spec coverage: branch creation, modern node content, icon, date split, menu styling, SVG scaling compatibility, and no-tests instruction are covered.
- Placeholder scan: no placeholders remain.
- Type consistency: the plan uses existing `Graph.view.getNodeDomElement`, `NODE_DEFAULTS`, `vcNodeSchema`, `nodeToScreenCoords`, and `vcgraph:getAllStyles` names consistently.
