<template>
  <tree-store-table :store="store" />
</template>

<script setup lang="ts">
import { AllEnterpriseModule, ModuleRegistry } from 'ag-grid-enterprise'
import TreeStoreTable from '@/components/tree-store-table.vue'
import { TreeStore } from './stores/tree-store'
import type { TreeItem } from './types'

ModuleRegistry.registerModules([AllEnterpriseModule])

// на продакшене массив initialItems скорее всего будет реализован через fetch
// в конкретном случае храню массив захардкоженным
const initialItems: TreeItem[] = [
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

const store = new TreeStore(initialItems)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}
</style>
