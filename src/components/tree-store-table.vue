<template>
  <div class="tree-grid-container">
    <ag-grid-vue
      class="ag-theme-alpine"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :treeData="true"
      :autoGroupColumnDef="autoGroupColumnDef"
      :getDataPath="getDataPath"
      :groupDefaultExpanded="groupDefaultExpanded"
      :defaultColDef="defaultColDef"
      :animateRows="true"
      @grid-ready="onGridReady"
      style="width: 100%; height: 450px"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'

import { TreeStore } from '@/stores/tree-store'

import type {
  AutoGroupColumnDef,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-enterprise'

import type { TreeItem } from '@/types'

const props = defineProps<{
  store: TreeStore
}>()

const gridApi = ref<GridApi<TreeItem> | null>(null)
const rowData = ref<TreeItem[]>([])

const columnDefs: ColDef<TreeItem>[] = [
  {
    headerName: '№ п/п',
    valueGetter: (params: ValueGetterParams<TreeItem>) => {
      const rowIndex = params.node?.rowIndex
      if (rowIndex == null || rowIndex < 0) return ''
      return rowIndex + 1
    },
    width: 100,
    pinned: 'left',
    suppressSizeToFit: true,
  },

  {
    headerName: 'Наименование',
    field: 'label',
    width: 150,
    valueFormatter: (params: ValueFormatterParams<TreeItem>) => {
      return params.value
    },
  },
]

const autoGroupColumnDef: AutoGroupColumnDef<TreeItem> = {
  headerName: 'Категория',
  width: 140,
  cellRendererParams: {
    suppressCount: true,
    innerRenderer: (params: ICellRendererParams<TreeItem>) =>
      params.node?.allChildrenCount ? 'Группа' : 'Элемент',
  },
}

const defaultColDef: ColDef<TreeItem> = {
  flex: 1,
  sortable: true,
  filter: true,
  resizable: true,
}

const groupDefaultExpanded = -1

const getDataPath = (data: TreeItem): string[] => {
  const path: string[] = []
  let currentId: string | number | null = data.id

  while (currentId !== null) {
    const item = props.store.getItem(currentId)
    if (item) {
      path.unshift(String(currentId))
      currentId = item.parent
    } else {
      break
    }
  }

  return path
}

const refreshData = () => {
  rowData.value = props.store.getAll() as TreeItem[]

  if (gridApi.value) {
    gridApi.value.setGridOption('rowData', rowData.value)
  }
}

const onGridReady = (params: GridReadyEvent<TreeItem>) => {
  gridApi.value = params.api

  refreshData()
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.tree-grid-container {
  padding: 20px;
  height: fit-content;
}
</style>
