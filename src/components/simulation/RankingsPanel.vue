<template>
  <DraggablePanel
    :initial-x="windowWidth - 380"
    :initial-y="windowHeight - 350"
    max-width="340px"
    max-height="300px"
  >
    <div class="rankings-title">🏆 Classements</div>

    <div class="rankings-section">
      <div class="section-header">👤 Top Individus:</div>
      <div v-if="store.topCreatures.length === 0" class="no-data">Aucune créature</div>
      <div v-else>
        <div v-for="(creature, index) in store.topCreatures" :key="creature.firstName" class="ranking-item individuals">
          {{ index + 1 }}. {{ creature.firstName }}
          <span v-if="creature.familyName" class="family">({{ creature.familyName }})</span>
          - {{ Math.floor(creature.calculateScore()) }} pts
        </div>
      </div>
    </div>

    <div class="rankings-section">
      <div class="section-header families">👨‍👩‍👧 Top Familles:</div>
      <div v-if="store.topFamilies.length === 0" class="no-data">Aucune famille</div>
      <div v-else>
        <div v-for="([name, data], index) in store.topFamilies" :key="name" class="ranking-item families">
          {{ index + 1 }}. {{ name }} - {{ data.members.length }} membres,
          {{ Math.floor(data.totalScore / data.members.length) }} pts/membre
        </div>
      </div>
    </div>
  </DraggablePanel>
</template>

<script setup>
import { ref } from 'vue'
import { useSimulationStore } from 'src/stores/simulation'
import DraggablePanel from 'src/components/ui/DraggablePanel.vue'

const store = useSimulationStore()
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)
</script>

<style scoped lang="sass">
.rankings-title
  color: #00ffff
  font-weight: bold
  margin-bottom: 10px
  font-size: 14px

.rankings-section
  margin: 15px 0

.section-header
  font-weight: bold
  color: #ff6b9d
  margin-bottom: 10px
  font-size: 13px

  &.families
    color: #00ff88

.ranking-item
  margin: 3px 0
  padding: 5px
  background: rgba(255, 107, 157, 0.1)
  border-radius: 3px
  font-size: 12px
  line-height: 1.5

  &.individuals
    background: rgba(255, 107, 157, 0.1)

  &.families
    background: rgba(0, 255, 136, 0.1)

.family
  color: #99d9ff
  font-size: 10px

.no-data
  color: #666
  font-style: italic
  font-size: 11px
  padding: 10px 0
</style>
