<template>
  <q-page class="simulation-page">
    <SimulationCanvas ref="canvasRef" />
    <ControlPanel @reset="handleReset" @add-food="handleAddFood" />
    <EventLog />
    <InfoPanel />
    <CreatureList @focus-creature="handleFocusCreature" />
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useSimulation } from 'src/composables/useSimulation'
import SimulationCanvas from 'src/components/simulation/SimulationCanvas.vue'
import ControlPanel from 'src/components/simulation/ControlPanel.vue'
import EventLog from 'src/components/simulation/EventLog.vue'
import InfoPanel from 'src/components/simulation/InfoPanel.vue'
import CreatureList from 'src/components/simulation/CreatureList.vue'

const canvasRef = ref(null)
const { init, spawnFood, start, stop } = useSimulation()

function handleReset() {
  init()
}

function handleAddFood() {
  spawnFood(30)
}

function handleFocusCreature(creature) {
  if (canvasRef.value && canvasRef.value.focusOn) {
    const x = creature.getCenterX()
    const y = creature.getCenterY()
    canvasRef.value.focusOn(x, y)
  }
}

onMounted(() => {
  // Démarrer la simulation avec le callback de dessin du canvas
  start(() => {
    if (canvasRef.value && canvasRef.value.draw) {
      canvasRef.value.draw()
    }
  })
})

onUnmounted(() => {
  stop()
})
</script>

<style scoped lang="sass">
.simulation-page
  position: relative
  width: 100vw
  height: 100vh
  overflow: hidden
  margin: 0
  padding: 0
</style>
