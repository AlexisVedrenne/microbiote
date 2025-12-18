<template>
  <canvas
    ref="canvasRef"
    :width="canvasWidth"
    :height="canvasHeight"
    :style="canvasStyle"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
    @wheel.prevent="onWheel"
    @click="onClick"
    @contextmenu.prevent
  ></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, defineExpose } from 'vue'
import { useSimulationStore } from 'src/stores/simulation'
import { useCamera } from 'src/composables/useCamera'
import { WORLD_WIDTH, WORLD_HEIGHT } from 'src/utils/Constants'
import { getTemperatureColor } from 'src/systems/Temperature'
import { Food } from 'src/classes/Food'

const canvasRef = ref(null)
const canvasWidth = ref(window.innerWidth)
const canvasHeight = ref(window.innerHeight)

const store = useSimulationStore()
const { camera, isDragging, startDrag, moveDrag, endDrag, zoom, screenToWorld, focusOn } = useCamera(
  canvasWidth.value,
  canvasHeight.value
)

const canvasStyle = computed(() => ({
  display: 'block',
  background: 'radial-gradient(circle at center, #1a4d6d 0%, #0a2540 100%)',
  cursor: isDragging.value ? 'grabbing' : 'grab'
}))

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Fond bleu aquatique
  ctx.fillStyle = '#0d3a52'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.save()

  // Transformation caméra
  ctx.scale(camera.value.zoom, camera.value.zoom)
  ctx.translate(-camera.value.x, -camera.value.y)

  // Fond de l'eau avec gradient aquatique
  const waterGradient = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT)
  waterGradient.addColorStop(0, '#3a7ca5')    // Bleu clair en haut (chaud)
  waterGradient.addColorStop(0.5, '#2f6690') // Bleu moyen
  waterGradient.addColorStop(1, '#16425b')    // Bleu foncé en bas (froid)
  ctx.fillStyle = waterGradient
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

  // Gradient de température (plus subtil et aquatique)
  const gradientSteps = 50
  const stepHeight = WORLD_HEIGHT / gradientSteps

  for (let i = 0; i < gradientSteps; i++) {
    const y = i * stepHeight
    ctx.fillStyle = getTemperatureColor(y)
    ctx.globalAlpha = 0.08
    ctx.fillRect(0, y, WORLD_WIDTH, stepHeight)
  }
  ctx.globalAlpha = 1.0

  // Bordures du monde (cyan aquatique)
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)'
  ctx.lineWidth = 3 / camera.value.zoom
  ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

  // Dessiner nourriture
  for (const f of store.food) {
    f.draw(ctx, store.time)
  }

  // Dessiner créatures
  for (const creature of store.creatures) {
    creature.draw(ctx)
  }

  ctx.restore()
}

defineExpose({
  draw,
  focusOn
})

function onMouseDown(e) {
  const clickedOnUI = e.target.closest('.draggable-panel')
  if (clickedOnUI) return

  startDrag(e.clientX, e.clientY)
}

function onMouseMove(e) {
  moveDrag(e.clientX, e.clientY)
}

function onMouseUp() {
  endDrag()
}

function onMouseLeave() {
  endDrag()
}

function onWheel(e) {
  zoom(e.deltaY, e.clientX, e.clientY)
}

function onClick(e) {
  if (isDragging.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const screenX = e.clientX - rect.left
  const screenY = e.clientY - rect.top

  const worldPos = screenToWorld(screenX, screenY)

  if (worldPos.x >= 0 && worldPos.x <= WORLD_WIDTH && worldPos.y >= 0 && worldPos.y <= WORLD_HEIGHT) {
    // Ajouter nourriture
    for (let i = 0; i < 8; i++) {
      store.food.push(
        new Food(worldPos.x + (Math.random() - 0.5) * 40, worldPos.y + (Math.random() - 0.5) * 40)
      )
    }
  }
}

function onResize() {
  canvasWidth.value = window.innerWidth
  canvasHeight.value = window.innerHeight
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
canvas {
  display: block;
}
</style>
