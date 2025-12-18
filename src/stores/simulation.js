import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { GENERATION_DURATION, MAX_EVENTS, DEATH_CAUSES } from 'src/utils/Constants'
import { EvolutionMemory } from 'src/systems/Evolution'

export const useSimulationStore = defineStore('simulation', () => {
  // État
  const creatures = ref([])
  const food = ref([])
  const time = ref(0)
  const generationTime = ref(0)
  const currentGeneration = ref(1)
  const maxGeneration = ref(1)
  const isPaused = ref(false)
  const simulationSpeed = ref(1)

  // Statistiques
  const totalBirths = ref(0)
  const totalStarvations = ref(0)
  const totalCannibalisms = ref(0)

  // Journal d'événements
  const events = ref([])

  // Familles
  const families = ref(new Map())

  // Mémoire évolutive
  const evolutionMemory = new EvolutionMemory()

  // Getters
  const population = computed(() => creatures.value.length)
  const foodCount = computed(() => food.value.length)
  const timeLeft = computed(() => Math.floor((GENERATION_DURATION - generationTime.value) / 60))

  const avgStats = computed(() => {
    if (creatures.value.length === 0) {
      return {
        size: 0,
        segments: 0,
        speed: 0,
        generation: 0
      }
    }

    const avgSize = creatures.value.reduce((sum, c) => sum + c.mass, 0) / creatures.value.length
    const avgSegments = creatures.value.reduce((sum, c) => sum + c.segments.length, 0) / creatures.value.length
    const avgSpeed =
      creatures.value.reduce((sum, c) => {
        let totalVel = 0
        for (const node of c.nodes) {
          totalVel += Math.sqrt(node.vx ** 2 + node.vy ** 2)
        }
        return sum + totalVel / c.nodes.length
      }, 0) / creatures.value.length
    const avgGen = creatures.value.reduce((sum, c) => sum + c.generation, 0) / creatures.value.length

    return {
      size: avgSize.toFixed(1),
      segments: avgSegments.toFixed(1),
      speed: avgSpeed.toFixed(2),
      generation: avgGen.toFixed(1)
    }
  })

  // État de sélection pour affichage détails
  const selectedCreature = ref(null)

  // Actions
  function logEvent(type, message) {
    events.value.unshift({ type, message, time: time.value })
    if (events.value.length > MAX_EVENTS) {
      events.value.pop()
    }
  }

  function recordDeath(creature, cause) {
    evolutionMemory.recordDeath(creature, cause)

    if (cause === DEATH_CAUSES.STARVATION || cause === DEATH_CAUSES.OLD_AGE) {
      totalStarvations.value++
      const causeText = cause === DEATH_CAUSES.OLD_AGE ? 'vieillesse' : 'faim'
      logEvent('death', `💀 ${creature.firstName} (${causeText})`)
    } else if (cause === DEATH_CAUSES.CANNIBALISM) {
      totalCannibalisms.value++
    }
  }

  function reset() {
    creatures.value = []
    food.value = []
    time.value = 0
    generationTime.value = 0
    currentGeneration.value = 1
    maxGeneration.value = 1
    totalBirths.value = 0
    totalStarvations.value = 0
    totalCannibalisms.value = 0
    events.value = []
    families.value = new Map()
  }

  function togglePause() {
    isPaused.value = !isPaused.value
  }

  function setSpeed(speed) {
    simulationSpeed.value = speed
  }

  function selectCreature(creature) {
    selectedCreature.value = creature
  }

  function unselectCreature() {
    selectedCreature.value = null
  }

  return {
    // État
    creatures,
    food,
    time,
    generationTime,
    currentGeneration,
    maxGeneration,
    isPaused,
    simulationSpeed,
    totalBirths,
    totalStarvations,
    totalCannibalisms,
    events,
    families,
    evolutionMemory,
    selectedCreature,

    // Getters
    population,
    foodCount,
    timeLeft,
    avgStats,

    // Actions
    logEvent,
    recordDeath,
    reset,
    togglePause,
    setSpeed,
    selectCreature,
    unselectCreature
  }
})
