<template>
  <div class="controls">
    <div class="mode-toggler">
      <span class="mode-toggler__label">Режим:</span>
      <button type="button" class="mode-toggler__button" @click="emit('toggle-mode')">
        {{ modeText }}
      </button>
    </div>
    <div class="toolbar" v-if="isEditMode">
      <button type="button" class="button button--outlined" @click="emit('add-item')">
        Добавить элемент
      </button>
      <button type="button" class="button" @click="emit('update-item')">Изменить элемент</button>
      <button type="button" class="button button--dashed" @click="emit('remove-item')">
        Удалить элемент
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isEditMode: boolean
}>()

const emit = defineEmits<{
  (event: 'toggle-mode'): void
  (event: 'add-item'): void
  (event: 'update-item'): void
  (event: 'remove-item'): void
}>()

const modeText = computed(() => (props.isEditMode ? 'редактирование' : 'просмотр'))
</script>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.mode-toggler {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2a66c0;
}

.mode-toggler__label {
  font-size: 16px;
  color: #2a66c0;
}

.mode-toggler__button {
  cursor: pointer;
  background-color: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  margin: 0 0;
  padding: 6px 0;
  color: #2a66c0;
}

.button {
  cursor: pointer;
  background-color: #e8e8e8;
  font-size: 16px;
  margin: 0 0;
  padding: 5px 10px;
  border: 1px solid #2a66c0;
  color: #2a66c0;
  border-radius: 16px;
  transition: all 0.3s ease-in;
}

.button--dashed {
  border-style: dashed;
}

.button:hover {
  background-color: transparent;
  box-shadow: 0px 1px 5px 0px rgba(34, 60, 80, 0.2);
}

.toolbar {
  display: flex;
  gap: 8px;
}
</style>
