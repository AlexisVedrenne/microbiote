<template>
  <div>
    <DraggablePanel
      :initial-x="windowWidth - 380"
      :initial-y="windowHeight - 450"

      max-height="400px"
      width="400px"
    >
      <div class="creature-list-title">🦠 Créatures Vivantes ({{ store.creatures.length }})</div>

      <q-list bordered separator dense class="creatures-container rounded-borders">
        <q-item v-if="store.creatures.length === 0">
          <q-item-section class="text-center text-grey-5">
            <q-item-label>Aucune créature</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          v-for="creature in store.creatures"
          :key="creature.firstName"
          clickable
          @click="showDetails(creature)"
          @contextmenu.prevent="focusCreature(creature)"
          :active="store.selectedCreature === creature"
          active-class="bg-cyan-9"
          class="creature-item"
        >
          <q-item-section>
            <q-item-label class="creature-name">{{ creature.firstName }}</q-item-label>
            <q-item-label v-if="creature.familyName" caption class="creature-family">
              {{ creature.familyName }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="creature-stats">
              <q-chip dense size="sm" color="positive" text-color="white">
                ⚡{{ Math.floor(creature.energy) }}
              </q-chip>
              <q-chip dense size="sm" color="blue" text-color="white">
                🧬{{ creature.segments.length }}
              </q-chip>
              <q-chip dense size="sm" color="orange" text-color="white">
                📏{{ creature.mass.toFixed(1) }}
              </q-chip>
            </div>
          </q-item-section>

        </q-item>
      </q-list>
    </DraggablePanel>

    <!-- Dialog avec détails de la créature -->
    <CreatureDetails v-model="showDetailsDialog" :creature="store.selectedCreature" />
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue'
import { useSimulationStore } from 'src/stores/simulation'
import DraggablePanel from 'src/components/ui/DraggablePanel.vue'
import CreatureDetails from './CreatureDetails.vue'

const store = useSimulationStore()
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

const emit = defineEmits(['focus-creature'])

const showDetailsDialog = computed({
  get: () => store.selectedCreature !== null,
  set: (value) => {
    if (!value) {
      store.unselectCreature()
    }
  }
})

function showDetails(creature) {
  store.selectCreature(creature)
}

function focusCreature(creature) {
  emit('focus-creature', creature)
}
</script>

<style scoped lang="sass">
.creature-list-title
  color: #90d5ff
  font-weight: bold
  font-size: 13px
  margin-bottom: 8px
  text-align: center

.creatures-container
  max-height: 340px
  overflow-y: auto
  font-size: 11px

.creature-item
  padding: 6px 8px
  margin: 2px 0
  background: rgba(20, 70, 110, 0.3)
  border: 1px solid rgba(100, 200, 255, 0.4)
  border-radius: 4px
  cursor: pointer
  transition: all 0.2s
  display: flex
  flex-direction: column
  gap: 2px

  &:hover
    background: rgba(30, 90, 140, 0.5)
    border-color: rgba(100, 200, 255, 0.7)

  &.selected
    background: rgba(40, 110, 170, 0.6)
    border-color: rgba(100, 200, 255, 0.9)

.creature-name
  color: #90d5ff
  font-weight: bold

.creature-family
  color: rgba(144, 213, 255, 0.7)
  font-size: 9px
  margin-left: 4px

.creature-stats
  color: rgba(176, 224, 255, 0.8)
  font-size: 10px
  display: flex
  gap: 8px

.no-creatures
  text-align: center
  color: rgba(144, 213, 255, 0.5)
  padding: 20px
  font-style: italic

// PANEL DÉTAILS
.details-header
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: 10px

.details-title
  color: #00ffff
  font-weight: bold
  font-size: 13px

.close-btn
  background: rgba(255, 50, 50, 0.3)
  border: 1px solid rgba(255, 100, 100, 0.5)
  color: #ff6666
  padding: 2px 8px
  border-radius: 3px
  cursor: pointer
  font-weight: bold
  font-size: 12px

  &:hover
    background: rgba(255, 50, 50, 0.5)

.details-content
  max-height: 520px
  overflow-y: auto
  font-size: 11px

.detail-section
  margin-bottom: 12px
  padding-bottom: 8px
  border-bottom: 1px solid rgba(0, 200, 255, 0.2)

  &:last-child
    border-bottom: none

.section-title
  color: #00dd88
  font-weight: bold
  font-size: 12px
  margin-bottom: 6px

.detail-row
  display: flex
  justify-content: space-between
  padding: 3px 0
  gap: 10px

.label
  color: rgba(200, 220, 255, 0.7)
  flex-shrink: 0

.value
  color: #ffffff
  text-align: right
  word-break: break-all

  &.highlight
    color: #ffdd00
    font-weight: bold

  &.fertile
    color: #00ff88

  &.debuff
    color: #ff6666

.energy-bar
  display: flex
  align-items: center
  gap: 8px

.bar-container
  width: 60px
  height: 8px
  background: rgba(0, 0, 0, 0.4)
  border: 1px solid rgba(0, 200, 255, 0.3)
  border-radius: 4px
  overflow: hidden

.bar-fill
  height: 100%
  background: linear-gradient(90deg, #00ff88, #00ffff)
  transition: width 0.3s

.color-preview
  display: inline-block
  width: 12px
  height: 12px
  border: 1px solid rgba(255, 255, 255, 0.3)
  border-radius: 2px
  margin-right: 4px
  vertical-align: middle
</style>
