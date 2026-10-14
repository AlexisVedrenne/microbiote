<template>
  <div class="locomotion-test">
    <!-- Canvas -->
    <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight" class="canvas" />

    <!-- Contrôles -->
    <div class="controls">
      <h2>🏁 Course Évolutive</h2>

      <div class="stats">
        <div>
          Génération: <strong>{{ generation }}</strong>
        </div>
        <div>Frame: {{ frame }} / {{ TEST_DURATION }}</div>
        <div>Créatures: {{ creatures.length }}</div>
        <div class="highlight">
          🏆 Arrivées: <strong>{{ finishedCount }}</strong> / {{ POPULATION_SIZE }}
        </div>
        <div>
          📏 Meilleure distance: <strong>{{ bestDistance.toFixed(0) }}</strong
          >px
        </div>
        <div>📊 Distance moyenne: {{ avgDistance.toFixed(0) }}px</div>
      </div>

      <div class="buttons">
        <button @click="isRunning ? pause() : start()" :class="{ active: isRunning }">
          {{ isRunning ? '⏸️ Pause' : '▶️ Start' }}
        </button>
        <button @click="reset()">🔄 Reset</button>
        <button @click="fastForward(10)">⏩ +10 Gen</button>
        <button @click="fastForward(50)">⏩ +50 Gen</button>
      </div>

      <div class="zoom-control">
        <label>Zoom: {{ (camera.zoom * 100).toFixed(0) }}%</label>
        <input type="range" min="0.1" max="1.5" step="0.05" v-model.number="camera.zoom" />
      </div>

      <div class="log">
        <h3>📋 Log</h3>
        <div class="log-entries">
          <div v-for="(entry, i) in log.slice(0, 20)" :key="i" class="log-entry">
            {{ entry }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useLocomotionTest } from 'src/composables/useLocomotionTest'

const {
  creatures,
  generation,
  frame,
  isRunning,
  bestDistance,
  avgDistance,
  finishedCount,
  log,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  TEST_DURATION,
  START_X,
  FINISH_X,
  RACE_DISTANCE,
  POPULATION_SIZE,
  init,
  start,
  pause,
  reset,
  fastForward,
} = useLocomotionTest()

const canvas = ref(null)
const canvasWidth = ref(1200)
const canvasHeight = ref(800)

let ctx = null
let renderLoopId = null

// Caméra centrée sur la piste de course
const camera = reactive({
  x: (START_X + FINISH_X) / 2, // Centré entre départ et arrivée
  y: WORLD_HEIGHT / 2,
  zoom: 0.5, // Zoom adapté à la taille de la piste
})

function render() {
  if (!ctx) return

  // Clear
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)

  // Setup transform
  ctx.save()
  ctx.translate(canvasWidth.value / 2, canvasHeight.value / 2)
  ctx.scale(camera.zoom, camera.zoom)
  ctx.translate(-camera.x, -camera.y)

  // Grille de référence
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  const gridSize = 100
  for (let x = 0; x <= WORLD_WIDTH; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, WORLD_HEIGHT)
    ctx.stroke()
  }
  for (let y = 0; y <= WORLD_HEIGHT; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(WORLD_WIDTH, y)
    ctx.stroke()
  }

  // === LIGNE DE DÉPART (verte) ===
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)'
  ctx.lineWidth = 4
  ctx.setLineDash([10, 10])
  ctx.beginPath()
  ctx.moveTo(START_X, 0)
  ctx.lineTo(START_X, WORLD_HEIGHT)
  ctx.stroke()
  ctx.setLineDash([])

  // Label départ
  ctx.fillStyle = 'rgba(74, 222, 128, 0.9)'
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('DÉPART', START_X, 30)

  // === LIGNE D'ARRIVÉE (rouge/or) ===
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(FINISH_X, 0)
  ctx.lineTo(FINISH_X, WORLD_HEIGHT)
  ctx.stroke()

  // Damier d'arrivée
  const squareSize = 20
  for (let y = 0; y < WORLD_HEIGHT; y += squareSize * 2) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillRect(FINISH_X - squareSize, y, squareSize, squareSize)
    ctx.fillRect(FINISH_X, y + squareSize, squareSize, squareSize)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(FINISH_X, y, squareSize, squareSize)
    ctx.fillRect(FINISH_X - squareSize, y + squareSize, squareSize, squareSize)
  }

  // Label arrivée
  ctx.fillStyle = 'rgba(250, 204, 21, 1)'
  ctx.font = 'bold 20px Arial'
  ctx.fillText('ARRIVÉE', FINISH_X, 30)

  // Dessiner les créatures
  for (const creature of creatures.value) {
    creature.draw(ctx)

    const cx = creature.getCenterX()
    const cy = creature.getCenterY()

    // Si la créature a fini, afficher son temps
    if (creature.finishTime !== null) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.9)'
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`🏁 ${creature.finishTime}`, cx, cy + 25)
    } else {
      // Sinon afficher la progression
      const progress = (((cx - START_X) / RACE_DISTANCE) * 100).toFixed(0)
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '8px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${progress}%`, cx, cy + 25)
    }
  }

  ctx.restore()

  // UI
  ctx.fillStyle = 'white'
  ctx.font = '14px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(`Gen ${generation.value} | Frame ${frame.value}/${TEST_DURATION}`, 10, 20)

  renderLoopId = requestAnimationFrame(render)
}

onMounted(() => {
  // Ajuster la taille du canvas à la fenêtre
  const updateCanvasSize = () => {
    canvasWidth.value = window.innerWidth - 320
    canvasHeight.value = window.innerHeight
  }
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)

  ctx = canvas.value.getContext('2d')
  init()
  render()
})

onUnmounted(() => {
  pause()
  if (renderLoopId) cancelAnimationFrame(renderLoopId)
})

// Auto-center camera : suit le leader (plus avancé vers l'arrivée)
watch(frame, () => {
  if (creatures.value.length > 0) {
    // Trouver le leader (le plus à droite)
    let leaderX = 0
    let sumY = 0
    for (const c of creatures.value) {
      const cx = c.getCenterX()
      if (cx > leaderX) leaderX = cx
      sumY += c.getCenterY()
    }
    // Centrer un peu devant le leader
    camera.x = Math.min(leaderX + 200, (START_X + FINISH_X) / 2)
    camera.y = sumY / creatures.value.length
  }
})
</script>

<style scoped>
.locomotion-test {
  display: flex;
  height: 100vh;
  background: #0a0a15;
  color: white;
}

.canvas {
  flex: 1;
  border-right: 2px solid #333;
  max-width: calc(100vw - 320px);
  height: 100vh;
}

.controls {
  width: 300px;
  padding: 20px;
  overflow-y: auto;
}

.controls h2 {
  margin: 0 0 20px 0;
}

.stats {
  background: #1a1a2e;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stats div {
  margin: 5px 0;
}

.stats .highlight {
  color: #4ade80;
  font-size: 1.1em;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.buttons button {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.buttons button:hover {
  background: #2563eb;
}

.buttons button.active {
  background: #22c55e;
}

.zoom-control {
  background: #1a1a2e;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.zoom-control label {
  display: block;
  margin-bottom: 8px;
}

.zoom-control input {
  width: 100%;
}

.log {
  background: #1a1a2e;
  padding: 15px;
  border-radius: 8px;
}

.log h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
}

.log-entries {
  font-family: monospace;
  font-size: 11px;
  max-height: 300px;
  overflow-y: auto;
}

.log-entry {
  padding: 3px 0;
  border-bottom: 1px solid #333;
}
</style>
