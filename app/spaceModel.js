// ──────────────────────────────────────────────────────────────────────────────
// 계층형 데이터 모델 — 스페이스(Space) × 오브젝트(Object)
//
// 스페이스(Space): 오브젝트가 배치되는 논리적 층위. 0 ~ MAX_SPACE(4).
//   - 자식 스페이스 = 부모 스페이스 + 1
//   - 스페이스 4의 오브젝트는 자식을 가질 수 없음
//
// 오브젝트(Object): 스페이스에 배치되는 실체. 타입 a / b / c / d.
//   - 부모 자격 서열: a > b > c > d (부모 서열이 자식 서열보다 높거나 같아야 함)
//   - d 타입은 항상 leaf (부모가 될 수 없음)
//   - 어떤 타입이든 0~4 어느 스페이스에도 배치 가능 (스페이스 독립성)
// ──────────────────────────────────────────────────────────────────────────────

export const MAX_SPACE = 4;
export const OBJECT_TYPES = ['a', 'b', 'c', 'd'];

// 타입 서열(rank): 숫자가 작을수록 상위. a=0, b=1, c=2, d=3
const TYPE_RANK = { a: 0, b: 1, c: 2, d: 3 };

export const getTypeRank = (type) => {
  if (!(type in TYPE_RANK)) {
    throw new Error(`Invalid object type: ${type}`);
  }
  return TYPE_RANK[type];
};

// 부모 타입이 자식 타입을 자식으로 받을 수 있는가?
// - d는 절대 부모 불가
// - 부모 rank <= 자식 rank (rank 숫자가 작거나 같음 = 서열이 높거나 같음)
export const canBeParentType = (parentType, childType) => {
  if (parentType === 'd') return false;
  return getTypeRank(parentType) <= getTypeRank(childType);
};

// ──────────────────────────────────────────────────────────────────────────────
// 스키마
// ──────────────────────────────────────────────────────────────────────────────

/**
 * SpaceObject — 계층에 배치되는 단일 노드
 * @typedef {Object} SpaceObject
 * @property {string} id          - 고유 식별자
 * @property {'a'|'b'|'c'|'d'} type - 오브젝트 타입
 * @property {number} space       - 배치된 스페이스 (0..MAX_SPACE)
 * @property {string|null} parentId - 부모 오브젝트 id (루트면 null)
 * @property {number} sortOrder   - 동일 부모 내 형제 사이의 정렬 순서
 * @property {Object} [data]      - 자유 사용자 데이터 (label 등)
 */

/**
 * SpaceTree — 오브젝트 저장소
 * id → SpaceObject 맵. 순서는 parentId + sortOrder로 결정.
 */
export class SpaceTree {
  constructor() {
    /** @type {Map<string, SpaceObject>} */
    this.nodes = new Map();
  }

  // ── 조회 헬퍼 ──────────────────────────────────────────────────────────
  get(id) {
    return this.nodes.get(id) || null;
  }

  has(id) {
    return this.nodes.has(id);
  }

  /** 모든 노드 배열 (순서 무관) */
  all() {
    return Array.from(this.nodes.values());
  }

  /** 루트 노드들 (parentId === null), sortOrder 오름차순 */
  roots() {
    return this.all()
      .filter(n => n.parentId === null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /** 주어진 부모의 직속 자식들, sortOrder 오름차순 */
  childrenOf(parentId) {
    return this.all()
      .filter(n => n.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /** 주어진 노드의 서브트리 전체(자기 자신 포함) */
  descendantsOf(rootId, { includeSelf = true } = {}) {
    const root = this.get(rootId);
    if (!root) return [];
    const result = includeSelf ? [root] : [];
    const stack = [rootId];
    while (stack.length) {
      const pid = stack.pop();
      for (const child of this.childrenOf(pid)) {
        result.push(child);
        stack.push(child.id);
      }
    }
    return result;
  }

  // ── 내부: 다음 sortOrder 계산 ────────────────────────────────────────
  _nextSortOrder(parentId) {
    const siblings = this.childrenOf(parentId);
    if (siblings.length === 0) return 0;
    return siblings[siblings.length - 1].sortOrder + 1;
  }

  // ── id 생성(간단한 monotonic id) ─────────────────────────────────────
  _genId() {
    // 충돌 방지: 기존 최대 id + 1 사용
    let max = 0;
    for (const id of this.nodes.keys()) {
      const n = Number(id);
      if (Number.isFinite(n) && n > max) max = n;
    }
    return String(max + 1);
  }

  // ──────────────────────────────────────────────────────────────────────
  // addObject — 새 오브젝트 추가
  //   - parentId === null 이면 루트(공백 0)
  //   - 부모가 있으면 스페이스 = parent.space + 1
  //   - 부모 타입 서열 / d 타입 부모 금지 / MAX_SPACE 초과 금지 검사
  // ──────────────────────────────────────────────────────────────────────
  addObject({ type, parentId = null, data = {}, id = null }) {
    if (!OBJECT_TYPES.includes(type)) {
      throw new Error(`Invalid object type: ${type}`);
    }

    let space;
    if (parentId === null) {
      space = 0;
    } else {
      const parent = this.get(parentId);
      if (!parent) throw new Error(`Parent not found: ${parentId}`);
      if (parent.type === 'd') {
        throw new Error(`Object type 'd' cannot have children (leaf-only)`);
      }
      if (!canBeParentType(parent.type, type)) {
        throw new Error(
          `Type rank violation: parent '${parent.type}' cannot own child '${type}'`
        );
      }
      if (parent.space >= MAX_SPACE) {
        throw new Error(
          `Parent is already at MAX_SPACE (${MAX_SPACE}); cannot add child below`
        );
      }
      space = parent.space + 1;
    }

    const newId = id !== null ? String(id) : this._genId();
    if (this.nodes.has(newId)) {
      throw new Error(`Object id already exists: ${newId}`);
    }

    const node = {
      id: newId,
      type,
      space,
      parentId,
      sortOrder: this._nextSortOrder(parentId),
      data,
    };
    this.nodes.set(newId, node);
    return node;
  }

  // ──────────────────────────────────────────────────────────────────────
  // moveObject — 부모 이동 (서브트리 전체 포함)
  //   - newParentId === null 이면 루트로 이동
  //   - 순환(자기 자신 또는 자기 자손 아래로) 금지
  //   - 부모 타입/서열 검증
  //   - 이동 후 서브트리 어떤 노드도 스페이스 > MAX_SPACE 가 되면 안 됨
  //   - sortOrder: 기본은 새 부모의 맨 뒤. { index } 옵션으로 특정 위치 지정 가능.
  // ──────────────────────────────────────────────────────────────────────
  moveObject(objectId, newParentId, { index = null } = {}) {
    const node = this.get(objectId);
    if (!node) throw new Error(`Object not found: ${objectId}`);

    // 루트로 이동
    if (newParentId === null) {
      const newSpace = 0;
      this._validateSubtreeFits(objectId, newSpace);
      this._relocateSubtree(objectId, null, newSpace);
      this._placeAmongSiblings(objectId, null, index);
      return node;
    }

    // 부모 존재
    const newParent = this.get(newParentId);
    if (!newParent) throw new Error(`New parent not found: ${newParentId}`);

    // 자기 자신으로 이동 금지
    if (newParentId === objectId) {
      throw new Error(`Cannot move an object into itself`);
    }

    // 자기 자손 아래로 이동 금지 (순환)
    const descendantIds = new Set(
      this.descendantsOf(objectId, { includeSelf: false }).map(n => n.id)
    );
    if (descendantIds.has(newParentId)) {
      throw new Error(`Cannot move an object into its own descendant`);
    }

    // d 타입 부모 금지
    if (newParent.type === 'd') {
      throw new Error(`Object type 'd' cannot have children (leaf-only)`);
    }

    // 타입 서열 검증
    if (!canBeParentType(newParent.type, node.type)) {
      throw new Error(
        `Type rank violation: parent '${newParent.type}' cannot own child '${node.type}'`
      );
    }

    // 새 부모 자체가 이미 MAX_SPACE면 자식을 달 수 없음
    if (newParent.space >= MAX_SPACE) {
      throw new Error(
        `New parent is at MAX_SPACE (${MAX_SPACE}); cannot attach children`
      );
    }

    const newSpace = newParent.space + 1;
    // 이동 전 검증 — 서브트리 최대 depth가 MAX_SPACE를 넘으면 취소
    this._validateSubtreeFits(objectId, newSpace);

    // 검증 통과 → 실제 이동 및 스페이스 재계산
    this._relocateSubtree(objectId, newParentId, newSpace);
    this._placeAmongSiblings(objectId, newParentId, index);
    return node;
  }

  // ──────────────────────────────────────────────────────────────────────
  // reorderObject — 동일 부모 내 순서 변경
  //   - targetIndex: 동일 부모 형제 배열 기준 새 위치(0-based)
  //   - 부모는 바뀌지 않음 (부모 변경은 moveObject를 사용)
  // ──────────────────────────────────────────────────────────────────────
  reorderObject(objectId, targetIndex) {
    const node = this.get(objectId);
    if (!node) throw new Error(`Object not found: ${objectId}`);
    const siblings = this.childrenOf(node.parentId);
    if (siblings.length === 0) return node;
    const clamped = Math.max(0, Math.min(targetIndex, siblings.length - 1));

    // 자기 자신을 제외한 순서 배열에 targetIndex 자리에 끼워넣음
    const without = siblings.filter(s => s.id !== objectId);
    const insertAt = Math.max(0, Math.min(clamped, without.length));
    without.splice(insertAt, 0, node);

    // sortOrder를 0..n-1로 재할당
    without.forEach((s, i) => {
      s.sortOrder = i;
    });
    return node;
  }

  // ──────────────────────────────────────────────────────────────────────
  // removeObject — 서브트리 전체 삭제
  // ──────────────────────────────────────────────────────────────────────
  removeObject(objectId) {
    const node = this.get(objectId);
    if (!node) return false;
    const subtree = this.descendantsOf(objectId, { includeSelf: true });
    for (const n of subtree) this.nodes.delete(n.id);
    // 남은 형제들의 sortOrder 조밀화
    this._compactSiblings(node.parentId);
    return true;
  }

  // ── 내부 헬퍼 ────────────────────────────────────────────────────────

  // 서브트리가 newRootSpace에 재배치되었을 때 최대 스페이스가 MAX_SPACE를 넘는지 검증
  _validateSubtreeFits(rootId, newRootSpace) {
    const root = this.get(rootId);
    if (!root) return;
    const oldRootSpace = root.space;
    const subtree = this.descendantsOf(rootId, { includeSelf: true });
    for (const n of subtree) {
      const delta = n.space - oldRootSpace; // 루트로부터의 상대 depth
      const projected = newRootSpace + delta;
      if (projected > MAX_SPACE) {
        throw new Error(
          `Move rejected: subtree node '${n.id}' would land at space ${projected} (> ${MAX_SPACE})`
        );
      }
    }
  }

  // 서브트리의 루트 parentId를 교체하고 전체 스페이스 재계산
  _relocateSubtree(rootId, newParentId, newRootSpace) {
    const root = this.get(rootId);
    if (!root) return;
    const oldRootSpace = root.space;
    const subtree = this.descendantsOf(rootId, { includeSelf: true });

    // 기존 부모의 형제 정렬 유지를 위해 분리 후 compact
    const oldParentId = root.parentId;
    root.parentId = newParentId;
    for (const n of subtree) {
      const delta = n.space - oldRootSpace;
      n.space = newRootSpace + delta;
    }
    if (oldParentId !== newParentId) {
      this._compactSiblings(oldParentId);
    }
  }

  // 주어진 부모의 자식들 sortOrder를 0..n-1로 조밀화
  _compactSiblings(parentId) {
    const siblings = this.childrenOf(parentId);
    siblings.forEach((s, i) => {
      s.sortOrder = i;
    });
  }

  // 노드를 새 부모의 형제 중 특정 index 자리에 배치 (index === null 이면 맨 뒤)
  _placeAmongSiblings(objectId, parentId, index) {
    const node = this.get(objectId);
    if (!node) return;
    // 우선 parentId가 이미 업데이트되어 있다고 가정 (_relocateSubtree 후 호출)
    const siblings = this.childrenOf(parentId).filter(s => s.id !== objectId);
    let insertAt;
    if (index === null || index >= siblings.length) {
      insertAt = siblings.length;
    } else {
      insertAt = Math.max(0, index);
    }
    siblings.splice(insertAt, 0, node);
    siblings.forEach((s, i) => {
      s.sortOrder = i;
    });
  }

  // ── 디버그/직렬화 ────────────────────────────────────────────────────

  /** 중첩 배열 형태로 내보내기 (부모 → 자식) */
  toNested() {
    const build = (parentId) =>
      this.childrenOf(parentId).map(n => ({
        id: n.id,
        type: n.type,
        space: n.space,
        sortOrder: n.sortOrder,
        data: n.data,
        children: build(n.id),
      }));
    return build(null);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 차곡차곡 hierarchy ↔ SpaceTree 변환
//   hierarchy 노드:  { id, label, icon, level(0..3), children?, quantity?, ... }
//     level 0=공간, 1=가구, 2=구획, 3=물건
//   SpaceObject:     { id, type('a'|'b'|'c'|'d'), space(0..4), parentId, sortOrder, data }
//     type 매핑:     0→a, 1→b, 2→c, 3→d   (차곡차곡 level이 곧 서열)
//     space:         hierarchy 중첩 깊이(0..). 루트 공간이 space=0.
//     data:          hierarchy 노드에서 id/children/level 을 뺀 나머지를 보관.
// ──────────────────────────────────────────────────────────────────────────────

const LEVEL_TO_TYPE = ['a', 'b', 'c', 'd'];
const TYPE_TO_LEVEL = { a: 0, b: 1, c: 2, d: 3 };

export const levelToType = (level) => LEVEL_TO_TYPE[level] ?? 'a';
export const typeToLevel = (type) => TYPE_TO_LEVEL[type] ?? 0;

/**
 * 차곡차곡 hierarchy(중첩 배열) → SpaceTree 인스턴스.
 * 각 노드의 id/level은 그대로, 나머지 필드는 data에 보관.
 */
export function hierarchyToSpaceTree(hierarchy) {
  const tree = new SpaceTree();
  const walk = (nodes, parentId) => {
    nodes.forEach((n) => {
      const { id, level, children, ...rest } = n;
      // addObject를 거치면 type/space 검증이 걸려서 기존 데이터가 튕길 수 있음 →
      // 원본 hierarchy를 그대로 복원해야 하므로 직접 Map에 삽입한다.
      const parent = parentId ? tree.get(parentId) : null;
      const space = parent ? parent.space + 1 : 0;
      const siblings = tree.childrenOf(parentId);
      const node = {
        id: String(id),
        type: levelToType(level ?? 0),
        space,
        parentId: parentId ?? null,
        sortOrder: siblings.length,
        data: rest, // label, icon, quantity, photoUri, ...
      };
      tree.nodes.set(node.id, node);
      if (Array.isArray(children) && children.length > 0) {
        walk(children, node.id);
      }
    });
  };
  walk(hierarchy || [], null);
  return tree;
}

/**
 * SpaceTree → 차곡차곡 hierarchy(중첩 배열).
 * data 필드를 펼쳐서 원래의 hierarchy 노드 모양으로 복원.
 */
export function spaceTreeToHierarchy(tree) {
  const build = (parentId) =>
    tree.childrenOf(parentId).map((n) => {
      const node = {
        id: n.id,
        level: typeToLevel(n.type),
        ...n.data,
      };
      const children = build(n.id);
      if (children.length > 0) node.children = children;
      return node;
    });
  return build(null);
}
