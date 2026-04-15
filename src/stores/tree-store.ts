import type {Id, TreeItem} from '@/types';

export class TreeStore {
  private items: TreeItem[];
  private itemsMap: Map<Id, TreeItem>;
  private childrenMap: Map<Id, TreeItem[]>;
  private parentMap: Map<Id, Id | null>;
  private indexMap: Map<Id, number>;

  constructor(items: TreeItem[]) {
    this.items = items.map((item) => ({...item}));
    this.itemsMap = new Map();
    this.childrenMap = new Map();
    this.parentMap = new Map();
    this.indexMap = new Map();

    this.buildMaps();
  }

  private static cloneItem(item: TreeItem): TreeItem {
    return {...item};
  }

  private static cloneItems(items: TreeItem[]): TreeItem[] {
    return items.map((item) => TreeStore.cloneItem(item));
  }

  private ensureUniqueId(id: Id): void {
    if (this.itemsMap.has(id)) {
      throw new Error(`Айтем с id="${String(id)}" уже существует`);
    }
  }

  private buildMaps(): void {
    this.itemsMap.clear();
    this.childrenMap.clear();
    this.parentMap.clear();
    this.indexMap.clear();

    for (const [index, item] of this.items.entries()) {
      if (this.itemsMap.has(item.id)) {
        throw new Error(`Дублирование id="${String(item.id)}" в конструкторе класса TreeStore`);
      }

      this.itemsMap.set(item.id, item);
      this.parentMap.set(item.id, item.parent);
      this.indexMap.set(item.id, index);
    }

    for (const item of this.items) {
      if (item.parent === null) continue;

      const children = this.childrenMap.get(item.parent) ?? [];
      children.push(item);
      this.childrenMap.set(item.parent, children);
    }
  }

  private removeFromItemsById(id: Id): void {
    const removeIndex = this.indexMap.get(id);
    if (removeIndex === undefined) return;

    const lastIndex = this.items.length - 1;
    const lastItem = this.items[lastIndex];
    if (!lastItem) return;

    if (removeIndex !== lastIndex) {
      this.items[removeIndex] = lastItem;
      this.indexMap.set(lastItem.id, removeIndex);
    }

    this.items.pop();
    this.indexMap.delete(id);
  }

  private collectSubtreeIds(rootId: Id): Set<Id> {
    const toRemove = new Set<Id>();
    const stack: Id[] = [rootId];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (currentId === undefined || toRemove.has(currentId)) continue;

      toRemove.add(currentId);
      const children = this.childrenMap.get(currentId);
      if (!children) continue;

      for (const child of children) {
        stack.push(child.id);
      }
    }

    return toRemove;
  }

  getAll(): TreeItem[] {
    return TreeStore.cloneItems(this.items);
  }

  getItem(id: Id): TreeItem | undefined {
    const item = this.itemsMap.get(id);
    return item ? TreeStore.cloneItem(item) : undefined;
  }

  getChildren(id: Id): TreeItem[] {
    const children = this.childrenMap.get(id) ?? [];
    return TreeStore.cloneItems(children);
  }

  getAllChildren(id: Id): TreeItem[] {
    const result: TreeItem[] = [];
    const stack: Id[] = [id];
    const visited = new Set<Id>();

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (currentId === undefined || visited.has(currentId)) continue;

      visited.add(currentId);
      const children = this.childrenMap.get(currentId) ?? [];

      for (const child of children) {
        result.push(child);
        stack.push(child.id);
      }
    }

    return TreeStore.cloneItems(result);
  }

  getAllParents(id: Id): TreeItem[] {
    const result: TreeItem[] = [];
    let currentId: Id | null = id;
    const visited = new Set<Id>();

    while (currentId !== null && !visited.has(currentId)) {
      visited.add(currentId);
      const item = this.itemsMap.get(currentId);

      if (!item) break;

      result.push(item);
      const parentId = this.parentMap.get(currentId);
      currentId = parentId ?? null;
    }

    return TreeStore.cloneItems(result);
  }

  addItem(item: TreeItem): void {
    this.ensureUniqueId(item.id);

    const nextItem = TreeStore.cloneItem(item);
    this.items.push(nextItem);
    this.itemsMap.set(nextItem.id, nextItem);
    this.parentMap.set(nextItem.id, nextItem.parent);
    this.indexMap.set(nextItem.id, this.items.length - 1);

    if (nextItem.parent !== null) {
      const children = this.childrenMap.get(nextItem.parent) ?? [];
      children.push(nextItem);
      this.childrenMap.set(nextItem.parent, children);
    }
  }

  removeItem(id: Id): void {
    if (!this.itemsMap.has(id)) return;

    const allIdsToRemove = this.collectSubtreeIds(id);

    for (const removeId of allIdsToRemove) {
      const parentId = this.parentMap.get(removeId);
      if (parentId === null || parentId === undefined) continue;

      const parentChildren = this.childrenMap.get(parentId);
      if (!parentChildren) continue;

      const nextChildren = parentChildren.filter((child) => child.id !== removeId);
      if (nextChildren.length === 0) {
        this.childrenMap.delete(parentId);
      } else {
        this.childrenMap.set(parentId, nextChildren);
      }
    }

    for (const removeId of allIdsToRemove) {
      this.childrenMap.delete(removeId);
      this.parentMap.delete(removeId);
      this.itemsMap.delete(removeId);
      this.removeFromItemsById(removeId);
    }
  }

  updateItem(updatedItem: TreeItem): void {
    const currentIndex = this.indexMap.get(updatedItem.id);
    if (currentIndex === undefined) return;

    const existingItem = this.items[currentIndex];
    if (!existingItem) return;
    const oldParent = existingItem.parent;

    Object.assign(existingItem, TreeStore.cloneItem(updatedItem));
    this.parentMap.set(existingItem.id, existingItem.parent);

    if (oldParent === existingItem.parent) return;

    if (oldParent !== null) {
      const oldParentChildren = this.childrenMap.get(oldParent) ?? [];
      const nextChildren = oldParentChildren.filter((item) => item.id !== existingItem.id);

      if (nextChildren.length === 0) {
        this.childrenMap.delete(oldParent);
      } else {
        this.childrenMap.set(oldParent, nextChildren);
      }
    }

    if (existingItem.parent !== null) {
      const newParentChildren = this.childrenMap.get(existingItem.parent) ?? [];
      newParentChildren.push(existingItem);
      this.childrenMap.set(existingItem.parent, newParentChildren);
    }
  }
}
