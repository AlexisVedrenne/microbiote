<template>
  <q-page class="simulation-page">
    <SimulationCanvas />
    <ControlPanel @reset="handleReset" @add-food="handleAddFood" />
    <EventLog />
    <InfoPanel />
    <RankingsPanel />
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSimulation } from 'src/composables/useSimulation'
import SimulationCanvas from 'src/components/simulation/SimulationCanvas.vue'
import ControlPanel from 'src/components/simulation/ControlPanel.vue'
import EventLog from 'src/components/simulation/EventLog.vue'
import InfoPanel from 'src/components/simulation/InfoPanel.vue'
import RankingsPanel from 'src/components/simulation/RankingsPanel.vue'

const { init, spawnFood } = useSimulation()

function handleReset() {
  init()
}

function handleAddFood() {
  spawnFood(30)
}

onMounted(() => {
  init()
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
