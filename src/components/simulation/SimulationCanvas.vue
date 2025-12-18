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
  ></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSimulationStore } from 'src/stores/simulation'
import { useCamera } from 'src/composables/useCamera'
import { WORLD_WIDTH, WORLD_HEIGHT } from 'src/utils/Constants'
import { getTemperatureColor } from 'src/systems/Temperature'
import { Food } from 'src/classes/Food'

const canvasRef = ref(null)
const canvasWidth = ref(window.innerWidth)
const canvasHeight = ref(window.innerHeight)

const store = useSimulationStore()
const { camera, isDragging, startDrag, moveDrag, endDrag, zoom, screenToWorld } = useCamera(
  canvasWidth.value,
  canvasHeight.value
)

const canvasStyle = computed(() => ({
  display: 'block',
  background: 'radial-gradient(circle at center, #0a1628 0%, #000000 100%)',
  cursor: isDragging.value ? 'grabbing' : 'grab'
}))

let animationFrameId = null

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Fond noir
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.save()

  // Transformation caméra
  ctx.scale(camera.value.zoom, camera.value.zoom)
  ctx.translate(-camera.value.x, -camera.value.y)

  // Gradient de température
  const gradientSteps = 50
  const stepHeight = WORLD_HEIGHT / gradientSteps

  for (let i = 0; i < gradientSteps; i++) {
    const y = i * stepHeight
    ctx.fillStyle = getTemperatureColor(y)
    ctx.globalAlpha = 0.15
    ctx.fillRect(0, y, WORLD_WIDTH, stepHeight)
  }
  ctx.globalAlpha = 1.0

  // Bordures du monde
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'
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

  animationFrameId = requestAnimationFrame(draw)
}

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
  draw()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped>
canvas {
  display: block;
}
</style>
