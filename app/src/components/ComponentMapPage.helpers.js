function safeNodeId(text) {
  const base = String(text || "node")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || "node";
}

function escLabel(text) {
  return String(text || "").replace(/"/g, '\\"');
}

function safeEdgeLabel(text) {
  return String(text || "depends_on")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "depends_on";
}

function nodeThemeFor(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('plant')) return 'plant';
  if (n === 'user' || n.includes(' user')) return 'user';
  if (n.includes('customer') || n.includes('supplier')) return 'partner';
  if (
    n.includes('order') ||
    n.includes('invoice') ||
    n.includes('quote') ||
    n.includes('credit') ||
    n.includes('refund')
  ) {
    return 'commercial';
  }
  return 'core';
}

export function buildComponentGraphSource(data) {
  const components = Array.isArray(data?.components) ? data.components : [];
  const dependencies = Array.isArray(data?.dependencies) ? data.dependencies : [];

  if (components.length === 0) return "flowchart LR\n";

  const entryNodeIdByName = new Map();
  const nodeIdsByTheme = {
    plant: [],
    user: [],
    partner: [],
    commercial: [],
    core: [],
  };
  const lines = ["flowchart LR"];

  for (const comp of components) {
    const name = String(comp.name || "Component").trim() || "Component";
    const theme = nodeThemeFor(name);
    const baseId = `c_${safeNodeId(name)}`;
    const subgraphId = `sg_${safeNodeId(name)}`;

    const rawSubpages = Array.isArray(comp.subpages) && comp.subpages.length > 0
      ? comp.subpages
      : [
          { id: 'list', label: 'List' },
          { id: 'create-edit', label: 'Create / Edit' },
          { id: 'preview', label: 'Preview' },
        ];

    const uniqueIds = new Set();
    const pageNodes = [];
    for (let idx = 0; idx < rawSubpages.length; idx += 1) {
      const page = rawSubpages[idx];
      const rawPageId = page?.id || page?.label || `view-${idx + 1}`;
      let pageId = `${baseId}_${safeNodeId(rawPageId)}`;
      let counter = 2;
      while (uniqueIds.has(pageId)) {
        pageId = `${baseId}_${safeNodeId(rawPageId)}_${counter}`;
        counter += 1;
      }
      uniqueIds.add(pageId);
      pageNodes.push({
        id: pageId,
        label: String(page?.label || `View ${idx + 1}`),
      });
    }

    lines.push(`    subgraph ${subgraphId}[\"${escLabel(name)}\"]`);
    lines.push('        direction TB');
    for (const pageNode of pageNodes) {
      lines.push(`        ${pageNode.id}[\"${escLabel(pageNode.label)}\"]`);
      nodeIdsByTheme[theme].push(pageNode.id);
    }
    lines.push('    end');

    const listNode = pageNodes.find((n) => n.label.toLowerCase() === 'list');
    const createEditNode = pageNodes.find((n) => n.label.toLowerCase().includes('create'));
    const previewNode = pageNodes.find((n) => n.label.toLowerCase() === 'preview');

    if (listNode && previewNode) {
      lines.push(`    ${listNode.id} --> ${previewNode.id}`);
    }
    if (createEditNode && previewNode) {
      lines.push(`    ${createEditNode.id} --> ${previewNode.id}`);
    }

    entryNodeIdByName.set(name, (previewNode || listNode || pageNodes[0]).id);
  }

  for (const dep of dependencies) {
    const fromId = entryNodeIdByName.get(dep?.from);
    const toId = entryNodeIdByName.get(dep?.to);
    if (!fromId || !toId) continue;
    const label = safeEdgeLabel(dep?.label);
    lines.push(`    ${fromId} -->|${label}| ${toId}`);
  }

  lines.push('');
  lines.push('    classDef plant fill:#e6f4ea,stroke:#2c8d4f,color:#1d4f2c,stroke-width:2px;');
  lines.push('    classDef user fill:#fdeaea,stroke:#c93a3a,color:#5f1f1f,stroke-width:2px;');
  lines.push('    classDef partner fill:#e8f0ff,stroke:#2f6fd9,color:#1f3e70,stroke-width:2px;');
  lines.push('    classDef commercial fill:#fff4e6,stroke:#d9822b,color:#6b3f10,stroke-width:2px;');
  lines.push('    classDef core fill:#f3f4f6,stroke:#6b7280,color:#1f2937,stroke-width:2px;');

  for (const [theme, ids] of Object.entries(nodeIdsByTheme)) {
    if (ids.length === 0) continue;
    lines.push(`    class ${ids.join(',')} ${theme};`);
  }

  return lines.join("\n");
}
