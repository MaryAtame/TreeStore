import { describe, beforeEach } from 'vitest'
import { TreeStore } from '@/stores/tree-store.ts'
import type { TreeItem } from '@/types'

describe('TreeStore', () => {
  let store: TreeStore
  const testItems: TreeItem[] = [
    { id: 1, parent: null, label: 'Айтем 1' },
    { id: '91064cee', parent: 1, label: 'Айтем 2' },
    { id: 3, parent: 1, label: 'Айтем 3' },
    { id: 4, parent: '91064cee', label: 'Айтем 4' },
    { id: 5, parent: '91064cee', label: 'Айтем 5' },
    { id: 6, parent: '91064cee', label: 'Айтем 6' },
    { id: 7, parent: 4, label: 'Айтем 7' },
    { id: 8, parent: 4, label: 'Айтем 8' },
    { id: 9, parent: null, label: 'Айтем 9' },
  ]

  beforeEach(() => {
    store = new TreeStore(testItems)
  })

  describe('getAll', () => {})

  describe('getItem', () => {})

  describe('getChildren', () => {})

  describe('getAllChildren', () => {})

  describe('getAllParents', () => {})

  describe('addItem', () => {})

  describe('removeItem', () => {})

  describe('updateItem', () => {})
})
