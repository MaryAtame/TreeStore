<template>
  <div class="tree-grid-container">
    <table-controls
      :isEditMode="isEditMode"
      @toggle-mode="handleChangeMode"
      @add-item="handleAddItem"
      @update-item="handleUpdateItem"
      @remove-item="handleRemoveItem"
    />
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
import { onMounted, ref } from 'vue'
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

import type { Id, TreeItem } from '@/types'
import TableControls from '@/components/table-controls.vue'

const props = defineProps<{
  store: TreeStore
}>()

const isEditMode = ref(false)

const handleChangeMode = (): void => {
  isEditMode.value = !isEditMode.value
}

const parseIdInput = (value: string): Id | null => {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('n:')) {
    const numericValue = Number(trimmed.slice(2).trim())
    return Number.isNaN(numericValue) ? null : numericValue
  }

  if (trimmed.startsWith('s:')) {
    return trimmed.slice(2)
  }

  const numericValue = Number(trimmed)
  if (!Number.isNaN(numericValue) && trimmed !== '') {
    return numericValue
  }

  return trimmed
}

const resolveExistingId = (rawId: string): Id | undefined => {
  const parsedId = parseIdInput(rawId)
  if (parsedId === null) return undefined
  if (props.store.getItem(parsedId)) return parsedId

  const asString = rawId.trim()
  if (asString && props.store.getItem(asString)) return asString

  const asNumber = Number(asString)
  if (!Number.isNaN(asNumber) && props.store.getItem(asNumber)) return asNumber

  return undefined
}

const parseParentInput = (value: string): Id | null | undefined => {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed.toLowerCase() === 'null') return null

  return parseIdInput(trimmed)
}

const handleAddItem = (): void => {
  const rawId = window.prompt('Введите id нового элемента.')
  if (rawId === null) return

  const id = parseIdInput(rawId)
  if (id === null) {
    window.alert('Некорректный id. Операция отменена.')
    return
  }

  const rawParent = window.prompt(
    'Введите значение id родительского элемента (оставьте пустым или "null" если родителя нет).',
    '',
  )
  if (rawParent === null) return

  const parent = parseParentInput(rawParent)
  if (parent === undefined) {
    window.alert('Некорректное значение id родительского элемента. Операция отменена.')
    return
  }

  const label = window.prompt('Введите наименование элемента:', '')
  if (label === null) return

  const trimmedLabel = label.trim()
  if (!trimmedLabel) {
    window.alert('Наименование не может быть пустым.')
    return
  }

  try {
    props.store.addItem({ id, parent, label: trimmedLabel })
    refreshData()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось добавить элемент.'
    window.alert(message)
  }
}

const handleUpdateItem = (): void => {
  const rawId = window.prompt('Введите id элемента для изменения.')
  if (rawId === null) return

  const existingId = resolveExistingId(rawId)
  if (existingId === undefined) {
    window.alert('Элемент с таким id не найден.')
    return
  }

  const currentItem = props.store.getItem(existingId)
  if (!currentItem) {
    window.alert('Элемент с таким id не найден.')
    return
  }

  const rawParent = window.prompt(
    'Введите значение id родительского элемента (оставьте пустым или "null" если родителя нет).\nОставьте как есть, если менять не нужно.',
    currentItem.parent === null ? '' : String(currentItem.parent),
  )
  if (rawParent === null) return

  const nextParent = parseParentInput(rawParent)
  if (nextParent === undefined) {
    window.alert('Некорректное значение id родительского элемента. Операция отменена.')
    return
  }

  const nextLabelInput = window.prompt('Введите новое наименование:', currentItem.label)
  if (nextLabelInput === null) return

  const nextLabel = nextLabelInput.trim()
  if (!nextLabel) {
    window.alert('Наименование не может быть пустым.')
    return
  }

  props.store.updateItem({
    ...currentItem,
    id: existingId,
    parent: nextParent,
    label: nextLabel,
  })
  refreshData()
}

const handleRemoveItem = (): void => {
  const rawId = window.prompt('Введите id элемента для удаления.')
  if (rawId === null) return

  const existingId = resolveExistingId(rawId)
  if (existingId === undefined) {
    window.alert('Элемент с таким id не найден.')
    return
  }

  const confirmResult = window.confirm(
    'Удалить элемент и все его дочерние элементы? Действие необратимо.',
  )
  if (!confirmResult) return

  props.store.removeItem(existingId)
  refreshData()
}

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
  sortable: false,
  filter: false,
  resizable: false,
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
  rowData.value = props.store.getAll()

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
