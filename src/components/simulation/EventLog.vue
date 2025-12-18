<template>
  <DraggablePanel :initial-x="20" :initial-y="windowHeight - 250" max-width="280px" max-height="200px">
    <div class="log-title">📜 Journal</div>
    <div class="events-container">
      <div
        v-for="(event, index) in store.events"
        :key="`event-${index}-${event.time}`"
        :class="['event', event.type]"
      >
        {{ event.message }}
      </div>
      <div v-if="store.events.length === 0" class="no-events">Aucun événement</div>
    </div>
  </DraggablePanel>
</template>

<script setup>
import { ref } from 'vue'
import { useSimulationStore } from 'src/stores/simulation'
import DraggablePanel from 'src/components/ui/DraggablePanel.vue'

const store = useSimulationStore()
const windowHeight = ref(window.innerHeight)
</script>

<style scoped lang="sass">
.log-title
  color: #00ffff
  font-weight: bold
  margin-bottom: 8px
  font-size: 14px

.events-container
  max-height: 150px
  overflow-y: auto
  font-size: 11px

.event
  margin: 5px 0
  padding: 5px
  border-left: 2px solid
  padding-left: 8px
  line-height: 1.4

  &.birth
    border-color: #00ff88
    color: #00ff88

  &.death
    border-color: #ff6b6b
    color: #ff6b6b

  &.cannibalism
    border-color: #ff00ff
    color: #ff00ff

.no-events
  color: #666
  font-style: italic
  text-align: center
  padding: 20px
</style>
