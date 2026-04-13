export const INITIAL_HIERARCHY = [
  {
    id: 'init-0',
    label: '거실',
    icon: 'weekend',
    level: 0, // 공간
    children: [
      {
        id: 'init-0-0',
        label: '선반',
        icon: '🗄️',
        level: 1, // 가구
        children: [
          {
            id: 'init-0-0-0',
            label: '서랍',
            icon: 'inbox',
            level: 2, // 구획
            children: [
              {
                id: 'init-0-0-0-0',
                label: '열쇠',
                icon: '🔑',
                level: 3, // 물건
                quantity: 1,
              }
            ]
          }
        ]
      }
    ]
  }
];

// ── Migration: 레벨 정보가 없는 기존 데이터에 레벨 부여 ───────────────────────────
export function ensureLevels(nodes, parentLevel = -1) {
  return nodes.map(n => {
    let currentLevel = n.level;
    // 레벨이 없는 경우 부모 레벨 + 1로 추정 (마이그레이션용)
    if (currentLevel === undefined) {
      if (n.quantity !== undefined) currentLevel = 3; // 물건은 무조건 3
      else currentLevel = Math.min(2, parentLevel + 1); // 나머지는 깊이에 따라 0, 1, 2
    }
    
    const node = { ...n, level: currentLevel };
    if (node.children) {
      node.children = ensureLevels(node.children, node.none ? parentLevel : currentLevel);
    }
    return node;
  });
}

// ── Hierarchy helpers ──────────────────────────────────────────────────────────
export function getItemsAtPath(nodes, path) {
  if (path.length === 0) {
    const result = [];
    for (const n of nodes) {
      if (n.none) {
        if (n.children) result.push(...n.children.filter(c => c.level === 3 || c.quantity !== undefined));
      } else {
        result.push(n);
      }
    }
    return result;
  }
  const [head, ...tail] = path;
  const node = nodes.find(n => n.id === head);
  if (!node?.children) return [];
  return getItemsAtPath(node.children, tail);
}

export function getLabelById(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n.label;
    if (n.children) {
      const found = getLabelById(n.children, id);
      if (found !== null) return found; 
    }
  }
  return null;
}

export function getNodeById(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = getNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function updateNodeAtPath(nodes, path, targetId, updates) {
  if (path.length === 0)
    return nodes.map(n => n.id === targetId ? { ...n, ...updates } : n);
  const [head, ...tail] = path;
  return nodes.map(n =>
    n.id === head
      ? { ...n, children: updateNodeAtPath(n.children || [], tail, targetId, updates) }
      : n
  );
}

export function getAllItems(nodes, currentPathIds = [], currentPathLabels = []) {
  let items = [];
  for (const node of nodes) {
    if (node.level === 3 || node.quantity !== undefined) {
      items.push({ ...node, pathIds: currentPathIds, pathLabels: currentPathLabels });
    } else if (node.children) {
      const nextPathIds = node.none ? currentPathIds : [...currentPathIds, node.id];
      const nextPathLabels = node.none ? currentPathLabels : [...currentPathLabels, node.label];
      items.push(...getAllItems(
        node.children,
        nextPathIds,
        nextPathLabels
      ));
    }
  }
  return items;
}

// 전체 계층에서 특정 ID를 가진 노드의 경로(ID 배열)를 찾음 (부모 ID들 + 자신의 ID)
export function findNodePathById(nodes, id, currentPath = []) {
  if (!Array.isArray(nodes)) return null;
  for (const node of nodes) {
    if (node.id === id) return [...currentPath, node.id];
    if (node.children) {
      const p = findNodePathById(node.children, id, [...currentPath, node.id]);
      if (p) return p;
    }
  }
  return null;
}

// 위 함수에서 자신을 제외한 부모들만의 경로를 반환
export function findParentPathById(nodes, id) {
  const p = findNodePathById(nodes, id);
  if (p && p.length > 0) return p.slice(0, -1);
  return null;
}

export function getNodeDepth(nodes, id, depth = 0) {
  for (const n of nodes) {
    if (n.id === id) return depth;
    if (n.children) {
      const childDepth = getNodeDepth(n.children, id, n.none ? depth : depth + 1);
      if (childDepth !== -1) return childDepth;
    }
  }
  return -1;
}

export function addNodeAtPath(nodes, path, newNode) {
  if (!Array.isArray(nodes)) return [newNode];
  if (path.length === 0) return [...nodes, newNode];
  const [head, ...tail] = path;
  return nodes.map(n =>
    n.id === head
      ? { ...n, children: addNodeAtPath(n.children || [], tail, newNode) }
      : n
  );
}

export function insertNodeAfter(nodes, path, afterId, newNode) {
  if (path.length === 0) {
    const idx = nodes.findIndex(n => n.id === afterId);
    if (idx === -1) return [...nodes, newNode];
    const result = [...nodes];
    result.splice(idx + 1, 0, newNode);
    return result;
  }
  const [head, ...tail] = path;
  return nodes.map(n =>
    n.id === head
      ? { ...n, children: insertNodeAfter(n.children || [], tail, afterId, newNode) }
      : n
  );
}

export function reorderNodeChildren(nodes, path, newChildrenIds) {
  if (path.length === 0) {
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    return newChildrenIds.map(id => nodeMap.get(id)).filter(Boolean);
  }
  const [head, ...tail] = path;
  return nodes.map(n =>
    n.id === head
      ? { ...n, children: reorderNodeChildren(n.children || [], tail, newChildrenIds) }
      : n
  );
}

export function deleteNodeAtPath(nodes, path, targetId) {
  if (path.length === 0) return nodes.filter(n => n.id !== targetId);
  const [head, ...tail] = path;
  return nodes.map(n =>
    n.id === head
      ? { ...n, children: deleteNodeAtPath(n.children || [], tail, targetId) }
      : n
  );
}

export function findNodeById(nodes, id) {
  if (!Array.isArray(nodes)) return null;
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function updateNodeQty(nodes, nodeId, newQty) {
  return nodes.map(n => {
    if (n.id === nodeId) {
      return { ...n, quantity: newQty };
    }
    if (n.children) {
      return { ...n, children: updateNodeQty(n.children, nodeId, newQty) };
    }
    return n;
  });
}

export function moveNode(nodes, _fromPath, nodeId, toPath) {
  let targetNode = null;
  const extract = (ns) => {
    const filtered = [];
    if (!Array.isArray(ns)) return filtered;
    for (const n of ns) {
      if (n.id === nodeId) {
        targetNode = n;
      } else if (n.children) {
        filtered.push({ ...n, children: extract(n.children) });
      } else {
        filtered.push(n);
      }
    }
    return filtered;
  };
  const afterRemove = extract(nodes);
  if (!targetNode) return nodes;
  return addNodeAtPath(afterRemove, toPath, targetNode);
}

export function getMoveTargets(nodes, itemIsLeaf, currentFromPath, pathIds = [], pathLabels = []) {
  let results = [];
  if (!Array.isArray(nodes)) return results;
  if (pathIds.length === 0) {
    const isAtRoot = currentFromPath.length === 0;
    results.push({
      id: 'ROOT_HOME',
      label: '홈',
      icon: 'home',
      level: -1, // 홈 레벨
      pathIds: [],
      pathLabels: [],
      depth: -1,
      isCurrent: isAtRoot
    });
  }

  for (const n of nodes) {
    if (n.none || n.level === 3 || n.quantity !== undefined) continue;
    const depth = pathIds.length;
    const nodePath = [...pathIds, n.id];
    const nodeLabels = [...pathLabels, n.label];
    
    const sameAsFrom = JSON.stringify(nodePath) === JSON.stringify(currentFromPath);
    results.push({ 
      id: n.id, 
      label: n.label, 
      icon: n.icon, 
      level: n.level,
      pathIds: nodePath, 
      pathLabels: nodeLabels, 
      depth,
      isCurrent: sameAsFrom
    });
    
    // 최대 깊이(구획) 이하로만 이동 가능하도록 제한 (depth < 2)
    if (n.children && depth < 2) {
      results.push(...getMoveTargets(n.children, itemIsLeaf, currentFromPath, nodePath, nodeLabels));
    }
  }
  return results;
}

export function searchHierarchy(nodes, query, pathLabels = [], pathIds = []) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  let results = [];
  if (!Array.isArray(nodes)) return results;
  for (const node of nodes) {
    if (!node.none && node.label.toLowerCase().includes(q)) {
      results.push({
        id: node.id, icon: node.icon, photoUri: node.photoUri,
        label: node.label,
        quantity: node.quantity,
        level: node.level,
        pathLabels,
        pathIds,
      });
    }
    if (node.children) {
      const nextPathLabels = node.none ? pathLabels : [...pathLabels, node.label];
      const nextPathIds = node.none ? pathIds : [...pathIds, node.id];
      results.push(...searchHierarchy(node.children, q, nextPathLabels, nextPathIds));
    }
  }
  return results;
}

export function flattenHierarchy(nodes, depth = 0) {
  let result = [];
  for (const node of nodes) {
    if (node.none && (!node.children || node.children.length === 0)) continue;
    if (node.none) {
      result.push(...flattenHierarchy(node.children || [], depth));
      continue;
    }
    const { children, ...rest } = node;
    result.push({ ...rest, depth });
    if (children) {
      result.push(...flattenHierarchy(children, depth + 1));
    }
  }
  return result;
}

export function unflattenHierarchy(flatItems) {
  const root = [];
  const depthStack = [];

  for (const item of flatItems) {
    const node = { ...item, children: [] };
    const depth = item.depth;
    // unflatten할 때는 level은 유지하고 depth만 제거
    const { depth: d, ...nodeWithoutDepth } = node;

    while (depthStack.length > 0 && depthStack[depthStack.length - 1].depth >= depth) {
      depthStack.pop();
    }

    if (depthStack.length === 0) {
      root.push(nodeWithoutDepth);
    } else {
      const parent = depthStack[depthStack.length - 1].node;
      if (!parent.children) parent.children = [];
      parent.children.push(nodeWithoutDepth);
    }
    depthStack.push({ node: nodeWithoutDepth, depth });
  }

  const cleanup = (nodes) => {
    for (const n of nodes) {
      if (n.children && n.children.length === 0) {
        if (n.level === 3 || n.quantity !== undefined) delete n.children;
        else n.children = [];
      } else if (n.children) {
        cleanup(n.children);
      }
    }
  };
  cleanup(root);
  return root;
}
