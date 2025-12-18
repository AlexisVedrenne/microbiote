<template>
  <DraggablePanel :initial-x="20" :initial-y="20"  width="400px">
    <q-expansion-item  header-class="title" label="🦠 Évolution Microbienne">

    <div class="row items-center q-gutter-sm">
      <q-btn
        dense
        
        no-caps 
        :label="store.isPaused ? 'Play' : 'Pause'"
        color="primary"
        @click="store.togglePause()"
        :icon="store.isPaused ? 'play_arrow' : 'pause'"
      />
      <q-btn  dense icon="replay" no-caps label="Reset" color="negative" @click="emit('reset')" />
      <q-btn  dense icon="food_bank" no-caps  label="+Nourriture" color="positive" @click="emit('addFood')" />
    </div>

    <div class="stat-group">
      <div class="stat-line">
        <span class="stat-label">Génération max:</span>
        <span class="stat-value">{{ store.currentGeneration }}</span>
      </div>
      <div class="stat-line">
        <span class="stat-label">Population:</span>
        <span class="stat-value">{{ store.population }}</span>
      </div>
      <div class="stat-line">
        <span class="stat-label">Nourriture:</span>
        <span class="stat-value">{{ store.foodCount }}</span>
      </div>
      <div class="stat-line">
        <span class="stat-label">Temps:</span>
        <span class="stat-value">{{ store.timeLeft }}s</span>
      </div>
    </div>

    <div class="stat-group">
      <div class="section-title">📊 Moyennes</div>
      <div class="stat-line">
        <span class="stat-label">Taille:</span>
        <span class="stat-value">{{ store.avgStats.size }}</span>
      </div>
      <div class="stat-line">
        <span class="stat-label">Segments:</span>
        <span class="stat-value">{{ store.avgStats.segments }}</span>
      </div>
      <div class="stat-line">
        <span class="stat-label">Vitesse:</span>
        <span class="stat-value">{{ store.avgStats.speed }}</span>
      </div>
      <div class="stat-line">
        <span class="stat-label">Génération moy:</span>
        <span class="stat-value">{{ store.avgStats.generation }}</span>
      </div>
    </div>

    <div class="stat-group">
      <div class="section-title danger">☠️ Statistiques</div>
      <div class="stat-line">
        <span class="stat-label">Naissances:</span>
        <span class="stat-value">{{ store.totalBirths }}</span>
      </div>
      <div class="stat-line">
        <span class="stat-label">Morts (faim):</span>
        <span class="stat-value danger">{{ store.totalStarvations }}</span>
      </div>
      <div class="stat-line">
        <span class="stat-label">Cannibalismes:</span>
        <span class="stat-value">{{ store.totalCannibalisms }}</span>
      </div>
    </div>

    <div class="speed-control">
      <div class="stat-label">Vitesse: {{ store.simulationSpeed }}x</div>
      <q-slider
        v-model="store.simulationSpeed"
        :min="1"
        :max="5"
        :step="1"
        color="cyan"
        @update:model-value="store.setSpeed"
      />
    </div>
    </q-expansion-item>
  </DraggablePanel>
</template>

<script setup>
import { useSimulationStore } from 'src/stores/simulation'
import DraggablePanel from 'src/components/ui/DraggablePanel.vue'

const store = useSimulationStore()
const emit = defineEmits(['reset', 'addFood'])
</script>

<style scoped lang="sass">
.title
  margin: 0 0 15px 0
  color: #90d5ff
  text-shadow: 0 0 10px rgba(100, 200, 255, 0.6)
  font-size: 20px

.button-group
  display: flex
  gap: 5px
  margin-bottom: 10px

  .q-btn
    flex: 1

.stat-group
  background: rgba(20, 60, 90, 0.5)
  padding: 12px
  border-radius: 8px
  margin: 10px 0
  border-left: 3px solid rgba(100, 200, 255, 0.6)

.section-title
  color: #90d5ff
  font-weight: bold
  margin-bottom: 8px

  &.danger
    color: #ff8888

.stat-line
  display: flex
  justify-content: space-between
  margin: 6px 0
  font-size: 13px

.stat-label
  color: #b0e0ff

.stat-value
  color: #80e5ff
  font-weight: bold

  &.danger
    color: #ff8888

.speed-control
  margin-top: 10px
</style>
