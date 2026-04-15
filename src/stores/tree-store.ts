import type {TreeItem, Id} from '@/types';

export class TreeStore {
  private items: TreeItem[];
  private itemsMap: Map<Id, TreeItem>;
  private childrenMap: Map<Id, TreeItem[]>;
  private parentMap: Map<Id, Id | null>;

  constructor(items: TreeItem[]) {
    this.items = [...items];
    this.itemsMap = new Map();
    this.childrenMap = new Map();
    this.parentMap = new Map();

    this.buildMaps();
  }

  private buildMaps(): void {
    // очищаем существующие мапы
    this.itemsMap.clear();
    this.childrenMap.clear();
    this.parentMap.clear();

    // мапинг для всех элементов
    for (const item of this.items) {
      this.itemsMap.set(item.id, item);
      this.parentMap.set(item.id, item.parent);
    }

    // организация связи родитель-ребенок
    for (const item of this.items) {
      if (item.parent !== null) {
        const children = this.childrenMap.get(item.parent) || [];
        children.push(item);
        this.childrenMap.set(item.parent, children);
      }
    }
  }

  getAll(): TreeItem[] {
    return this.items;
  }

  getItem(id: Id): TreeItem | undefined {
    return this.itemsMap.get(id);
  }

  getChildren(id: Id): TreeItem[] {
    return this.childrenMap.get(id) || [];
  }

  getAllChildren(id: Id): TreeItem[] {
    const result: TreeItem[] = [];
    const stack: Id[] = [id];
    const visited = new Set<Id>();

    while (stack.length > 0) {
      const currentId = stack.pop()!;

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const children = this.childrenMap.get(currentId) || [];

      for (const child of children) {
        result.push(child);
        stack.push(child.id);
      }
    }

    return result;
  }

  getAllParents(id: Id): TreeItem[] {
    const result: TreeItem[] = [];
    let currentId: Id | null = id;
    const visited = new Set<Id>();

    while (currentId !== null && !visited.has(currentId)) {
      visited.add(currentId);
      const item = this.itemsMap.get(currentId);

      if (item) {
        result.push(item);
        currentId = this.parentMap.get(currentId) || null;
      } else {
        break;
      }
    }

    return result;
  }

  addItem(item: TreeItem): void {
    // дабавление в основной массив
    this.items.push(item);

    // обновление мапов
    this.itemsMap.set(item.id, item);
    this.parentMap.set(item.id, item.parent);

    // обновление связей родитель-ребенок
    if (item.parent !== null) {
      const children = this.childrenMap.get(item.parent) || [];
      children.push(item);
      this.childrenMap.set(item.parent, children);
    }
  }

  removeItem(id: Id): void {
    const itemToRemove = this.itemsMap.get(id)
    if (!itemToRemove) return

    // если у удаляемого айтема есть дети - их тоже сносим
    const childrenToRemove = this.getAllChildren(id)
    const allIdsToRemove = new Set<Id>([id, ...childrenToRemove.map((c) => c.id)])

    // обновление основного массива - исключаем удаленный айтем
    this.items = this.items.filter((item) => !allIdsToRemove.has(item.id))

    // удаляем айтем из мапов
    allIdsToRemove.forEach((itemId) => {
      this.itemsMap.delete(itemId)
      this.childrenMap.delete(itemId)
      this.parentMap.delete(itemId)
    })

    // если удаляемый айтем был ребенком, то чистим ссылки на него у родителей
    for (const [parentId, children] of this.childrenMap.entries()) {
      const filteredChildren = children.filter((child) => !allIdsToRemove.has(child.id))
      if (filteredChildren.length > 0) {
        this.childrenMap.set(parentId, filteredChildren)
      } else {
        this.childrenMap.delete(parentId)
      }
    }
  }

  updateItem(updatedItem: TreeItem): void {
    const existingItem = this.itemsMap.get(updatedItem.id);
    if (!existingItem) return;

    const oldParent = existingItem.parent;

    Object.assign(existingItem, updatedItem);

    // обновляем мапы
    this.itemsMap.set(updatedItem.id, existingItem);
    this.parentMap.set(updatedItem.id, updatedItem.parent);

    // если изменился parent -> обновляем childrenMap
    if (oldParent !== updatedItem.parent) {
      // удаляем ссылку на ребенка из старого родителя
      if (oldParent !== null) {
        const oldParentChildren = this.childrenMap.get(oldParent) || [];
        const filteredChildren = oldParentChildren.filter(c => c.id !== updatedItem.id);
        if (filteredChildren.length > 0) {
          this.childrenMap.set(oldParent, filteredChildren);
        } else {
          this.childrenMap.delete(oldParent);
        }
      }

      // добавляем к новому родителю
      if (updatedItem.parent !== null) {
        const newParentChildren = this.childrenMap.get(updatedItem.parent) || [];
        newParentChildren.push(existingItem);
        this.childrenMap.set(updatedItem.parent, newParentChildren);
      }
    }

    // обновляем элемент в основном массиве
    const index = this.items.findIndex(item => item.id === updatedItem.id);
    if (index !== -1) {
      this.items[index] = existingItem;
    }
  }
}
