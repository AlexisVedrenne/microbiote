<template>
  <div
    ref="panelRef"
    class="draggable-panel"
    :style="panelStyle"
    @mousedown="startDrag"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  initialX: {
    type: Number,
    default: 20
  },
  initialY: {
    type: Number,
    default: 20
  },
  width: {
    type: String,
    default: 'auto'
  },
  maxWidth: {
    type: String,
    default: '340px'
  },
  maxHeight: {
    type: String,
    default: 'none'
  }
})

const panelRef = ref(null)
const position = ref({ x: props.initialX, y: props.initialY })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const panelStyle = computed(() => ({
  position: 'absolute',
  top: `${position.value.y}px`,
  left: `${position.value.x}px`,
  width: props.width,
  maxWidth: props.maxWidth,
  maxHeight: props.maxHeight,
  cursor: isDragging.value ? 'grabbing' : 'move'
}))

function startDrag(e) {
  // Ne pas drag si on clique sur un bouton, input ou autre élément interactif
  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
    return
  }

  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!isDragging.value) return

  position.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}
</script>

<style scoped lang="sass">
.draggable-panel
  background: rgba(5, 10, 20, 0.95)
  padding: 20px
  border-radius: 15px
  color: #00ffff
  border: 2px solid rgba(0, 255, 255, 0.3)
  box-shadow: 0 0 30px rgba(0, 200, 255, 0.3)
  user-select: none
  overflow-y: auto
  overflow-x: hidden

  &::-webkit-scrollbar
    width: 8px

  &::-webkit-scrollbar-track
    background: rgba(0, 0, 0, 0.3)
    border-radius: 4px

  &::-webkit-scrollbar-thumb
    background: rgba(0, 255, 255, 0.3)
    border-radius: 4px

    &:hover
      background: rgba(0, 255, 255, 0.5)
</style>
