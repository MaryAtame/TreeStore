import { beforeEach, describe, expect, it } from 'vitest'
import { TreeStore } from '@/stores/tree-store'
import type { TreeItem } from '@/types'

describe('TreeStore', () => {
  let store: TreeStore
  let testItems: TreeItem[]

  beforeEach(() => {
    testItems = [
      { id: 1, parent: null, label: 'Item 1' },
      { id: '91064cee', parent: 1, label: 'Item 2' },
      { id: 3, parent: 1, label: 'Item 3' },
      { id: 4, parent: '91064cee', label: 'Item 4' },
      { id: 5, parent: '91064cee', label: 'Item 5' },
      { id: 6, parent: '91064cee', label: 'Item 6' },
      { id: 7, parent: 4, label: 'Item 7' },
      { id: 8, parent: 4, label: 'Item 8' },
    ]
    store = new TreeStore(testItems)
  })

  it('метод getAll возвращает все айтемы в исходном порядке', () => {
    const all = store.getAll()
    expect(all).toHaveLength(8)
    expect(all).toEqual(testItems)
  })

  it('метод getItem возвращает айтем по его id (строка или число)', () => {
    expect(store.getItem(1)).toEqual(testItems[0])
    expect(store.getItem('91064cee')).toEqual(testItems[1])
    expect(store.getItem(999)).toBeUndefined()
  })

  it('метод getChildren прямых потомков, либо пустой массив в случае отсутствия детей', () => {
    expect(store.getChildren(1).map((item) => item.id)).toEqual(['91064cee', 3])
    expect(store.getChildren(8)).toEqual([])
  })

  it('метод getAllChildren возвращает всех потомков', () => {
    const children = store.getAllChildren(1).map((item) => item.id)
    expect(children).toHaveLength(7)
    expect(children).toEqual(expect.arrayContaining(['91064cee', 3, 4, 5, 6, 7, 8]))
    expect(store.getAllChildren(8)).toEqual([])
  })

  it('метод getAllParents возвращает цепочку родителей', () => {
    const parents = store.getAllParents(7).map((item) => item.id)
    expect(parents).toEqual([7, 4, '91064cee', 1])
    expect(store.getAllParents(1).map((item) => item.id)).toEqual([1])
  })

  it('метод getAllParents обрабатывает цепочку родительских элементов, когда идентификатор родителя равен 0 или является пустой строкой', () => {
    const edgeItems: TreeItem[] = [
      { id: 0, parent: null, label: 'Root 0' },
      { id: '', parent: 0, label: 'Root Empty' },
      { id: 'leaf', parent: '', label: 'Leaf' },
    ]
    const edgeStore = new TreeStore(edgeItems)

    expect(edgeStore.getAllParents('leaf').map((item) => item.id)).toEqual(['leaf', '', 0])
  })

  it('корректно добавляет и удаляет поддерево', () => {
    store.addItem({ id: 9, parent: 1, label: 'Item 9' })
    expect(store.getItem(9)?.label).toBe('Item 9')
    expect(store.getChildren(1).map((item) => item.id)).toEqual(['91064cee', 3, 9])

    store.removeItem('91064cee')
    expect(
      store
        .getAll()
        .map((item) => item.id)
        .sort(),
    ).toEqual([1, 3, 9])
    expect(store.getItem('91064cee')).toBeUndefined()
    expect(store.getItem(7)).toBeUndefined()
  })

  it('обновляет айтем и перепривязывает детей при изменении родителя', () => {
    store.updateItem({ id: 4, parent: 1, label: 'Updated 4' })

    expect(store.getItem(4)).toEqual({ id: 4, parent: 1, label: 'Updated 4' })
    expect(store.getChildren(1).map((item) => item.id)).toEqual(['91064cee', 3, 4])
    expect(store.getChildren('91064cee').map((item) => item.id)).toEqual([5, 6])
  })

  it('защищает внутреннее состояние от внешних мутаций', () => {
    const all = store.getAll()
    all.push({ id: 999, parent: null, label: 'mutation' })
    expect(store.getAll()).toHaveLength(8)

    const item = store.getItem(1)
    expect(item).toBeDefined()
    if (!item) return

    item.label = 'was mutated outside'
    expect(store.getItem(1)?.label).toBe('Item 1')
  })

  it('метод addItem выбрасывает исключение при наличии повторяющихся идентификаторов в конструкторе и методе addItem.', () => {
    expect(
      () =>
        new TreeStore([
          { id: 1, parent: null, label: 'a' },
          { id: 1, parent: null, label: 'b' },
        ]),
    ).toThrow()
    expect(() => store.addItem({ id: 1, parent: null, label: 'duplicate' })).toThrow()
  })
})
