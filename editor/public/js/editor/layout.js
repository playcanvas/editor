// main container
var root = new ui.Panel();
root.element.id = 'ui-root';
root.flexDirection = 'column';
root.flexWrap = 'nowrap';
root.scroll = true;
document.body.appendChild(root.element);



// top (header)
var header = new ui.Panel();
header.element.id = 'ui-top';
header.flexShrink = false;
// header.innerElement.textContent = 'menu';
root.append(header);

// middle
var middle = new ui.Panel();
middle.element.id = 'ui-middle';
middle.flexGrow = true;
root.append(middle);

// bottom (status)
var bottom = new ui.Panel();
bottom.element.id = 'ui-bottom';
bottom.flexShrink = false;
bottom.innerElement.textContent = 'status';
root.append(bottom);



// hierarchy
var hierarchyPanel = new ui.Panel('Hierarchy');
hierarchyPanel.class.add('hierarchy');
hierarchyPanel.flexShrink = false;
hierarchyPanel.style.width = '384px';
hierarchyPanel.scroll = true;
middle.append(hierarchyPanel);



// center
var center = new ui.Panel();
center.flexGrow = true;
center.flexDirection = 'column';
middle.append(center);

// viewport
var viewport = new ui.Panel();
viewport.flexGrow = true;
viewport.innerElement.style.backgroundImage = 'url("https://i.imgur.com/0zVgGIk.jpg")';
viewport.innerElement.style.backgroundPosition = 'center center';
viewport.innerElement.style.backgroundSize = 'cover';
center.append(viewport);

// assets
var assetsPanel = new ui.Panel('Assets');
assetsPanel.flexShrink = false;
assetsPanel.style.height = '300px';
assetsPanel.scroll = true;
center.append(assetsPanel);



// attributes
var attributesPanel = new ui.Panel('Attributes');
attributesPanel.class.add('attributes');
attributesPanel.flexShrink = false;
attributesPanel.style.width = '384px';
attributesPanel.scroll = true;
middle.append(attributesPanel);
