<template>
  <DraggablePanel :initial-x="20" :initial-y="windowHeight - 250" max-width="280px" height="300px">
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
  color: #90d5ff
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
    border-color: #66ffaa
    color: #66ffaa

  &.death
    border-color: #ff8888
    color: #ff8888

  &.cannibalism
    border-color: #ff66ff
    color: #ff66ff

.no-events
  color: #5599aa
  font-style: italic
  text-align: center
  padding: 20px
</style>
