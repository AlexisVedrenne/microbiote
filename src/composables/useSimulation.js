import { useSimulationStore } from 'src/stores/simulation'
import { Creature } from 'src/classes/Creature'
import { Food } from 'src/classes/Food'
import { WORLD_WIDTH, WORLD_HEIGHT, GENERATION_DURATION, DEATH_CAUSES, FOOD_TYPES } from 'src/utils/Constants'
import { evolveCreature, seekFood, seekMate, checkCannibalism } from 'src/utils/CreatureHelpers'

export function useSimulation() {
  const store = useSimulationStore()
  let animationFrameId = null

  function init() {
    store.reset()

    // Population initiale
    for (let i = 0; i < 30; i++) {
      store.creatures.push(
        new Creature(Math.random() * WORLD_WIDTH, Math.random() * WORLD_HEIGHT, null, null, store.currentGeneration)
      )
    }

    spawnFood(200)
    store.logEvent('birth', 'Simulation démarrée - Génération 1')
  }

  function spawnFood(count) {
    for (let i = 0; i < count; i++) {
      const foodType = getRandomFoodType()
      const x = Math.random() * WORLD_WIDTH
      const y = Math.random() * WORLD_HEIGHT

      store.food.push(new Food(x, y, foodType))

      // Amas de nourriture riche
      if (foodType.name === 'rich') {
        const clusterSize = 3 + Math.floor(Math.random() * 3)
        for (let j = 0; j < clusterSize; j++) {
          const angle = Math.random() * Math.PI * 2
          const distance = 10 + Math.random() * 30
          store.food.push(new Food(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, foodType))
        }
      }
    }
  }

  function getRandomFoodType() {
    const rand = Math.random()
    let cumul = 0

    for (const key in FOOD_TYPES) {
      cumul += FOOD_TYPES[key].probability
      if (rand < cumul) {
        return FOOD_TYPES[key]
      }
    }
    return FOOD_TYPES.NORMAL
  }

  function update() {
    if (store.isPaused) return

    store.time++
    store.generationTime++

    // Nouvelle génération
    if (store.generationTime >= GENERATION_DURATION) {
      nextGeneration()
      return
    }

    // Ajouter nourriture périodiquement
    if (store.time % 60 === 0) {
      spawnFood(2)
    }

    // Mettre à jour créatures
    for (const creature of store.creatures) {
      creature.update()

      // Chercher nourriture
      seekFood(creature, store.food)

      // Chercher partenaire
      if (creature.canReproduce()) {
        const partner = seekMate(creature, store.creatures)
        if (partner) {
          reproduce(creature, partner)
        }
      }

      // Cannibalisme
      checkCannibalism(creature, store.creatures, store.recordDeath, store.logEvent)
    }

    // Supprimer créatures mortes
    for (let i = store.creatures.length - 1; i >= 0; i--) {
      if (store.creatures[i].isDead()) {
        const creature = store.creatures[i]
        const cause = creature.age > 1800 ? DEATH_CAUSES.OLD_AGE : DEATH_CAUSES.STARVATION
        store.recordDeath(creature, cause)
        store.creatures.splice(i, 1)
      }
    }

    // Extinction
    if (store.creatures.length === 0) {
      store.logEvent('death', '⚠️ EXTINCTION - Redémarrage...')
      setTimeout(() => init(), 2000)
    }
  }

  function nextGeneration() {
    store.currentGeneration++
    store.generationTime = 0

    store.logEvent('birth', `🔄 GÉNÉRATION ${store.currentGeneration} - Évolution en cours...`)

    const deathPatterns = store.evolutionMemory.analyzeDeathPatterns()

    // Faire évoluer survivants
    for (const creature of store.creatures) {
      evolveCreature(creature, deathPatterns, store.logEvent)
      creature.generation = store.currentGeneration

      creature.stats = {
        foodEaten: 0,
        distanceTraveled: 0,
        survivalTime: 0,
        reproductions: 0,
        totalSpeed: 0,
        speedSamples: 0,
        energyLost: 0
      }

      creature.energy = Math.min(creature.maxEnergy, creature.energy + 50)
    }

    const survivorCount = store.creatures.length

    // Ajouter nouvelles créatures
    let newCreatureCount = 0
    if (survivorCount === 0) {
      newCreatureCount = 30
    } else if (survivorCount < 10) {
      newCreatureCount = 25
    } else if (survivorCount < 20) {
      newCreatureCount = 15
    } else if (survivorCount < 30) {
      newCreatureCount = 10
    } else {
      newCreatureCount = 5
    }

    for (let i = 0; i < newCreatureCount; i++) {
      store.creatures.push(
        new Creature(Math.random() * WORLD_WIDTH, Math.random() * WORLD_HEIGHT, null, null, store.currentGeneration)
      )
    }

    store.logEvent('birth', `+${newCreatureCount} nouvelles créatures (${survivorCount} survivants)`)

    spawnFood(80)

    if (store.currentGeneration > store.maxGeneration) {
      store.maxGeneration = store.currentGeneration
    }
  }

  function reproduce(creature, partner) {
    const parent1Family = creature.familyName || creature.firstName.split('-')[0]
    const parent2Family = partner.familyName || partner.firstName.split('-')[0]

    const childGenes = {
      muscleStrength: (creature.genes.muscleStrength + partner.genes.muscleStrength) / 2,
      metabolicEfficiency: (creature.genes.metabolicEfficiency + partner.genes.metabolicEfficiency) / 2,
      maxEnergyBonus: Math.floor((creature.genes.maxEnergyBonus + partner.genes.maxEnergyBonus) / 2),
      fertility: (creature.genes.fertility + partner.genes.fertility) / 2,
      preferredTemp: (creature.genes.preferredTemp + partner.genes.preferredTemp) / 2,
      thermalTolerance: (creature.genes.thermalTolerance + partner.genes.thermalTolerance) / 2,
      structure: mergeStructures(creature.getGenes().structure, partner.getGenes().structure)
    }

    const cx = (creature.getCenterX() + partner.getCenterX()) / 2
    const cy = (creature.getCenterY() + partner.getCenterY()) / 2

    const child = new Creature(
      cx,
      cy,
      childGenes,
      {
        parent1: parent1Family,
        parent2: parent2Family
      },
      store.currentGeneration
    )
    store.creatures.push(child)

    const reproductionCost = (50 + creature.mass * 4) * creature.genes.fertility
    creature.energy -= reproductionCost
    partner.energy -= reproductionCost

    const baseCooldown = 200 + creature.mass * 15
    creature.reproductionCooldown = baseCooldown * creature.genes.fertility
    partner.reproductionCooldown = baseCooldown * partner.genes.fertility

    creature.fertilityWindow = 0
    partner.fertilityWindow = 0

    creature.stats.reproductions++
    partner.stats.reproductions++

    store.totalBirths++

    const sameFamily = creature.familyName && partner.familyName && creature.familyName === partner.familyName
    const familyNote = sameFamily ? '(même famille)' : '(hors-famille)'
    store.logEvent('birth', `💕 ${creature.firstName} + ${partner.firstName} ${familyNote} → ${child.firstName}`)
  }

  function mergeStructures(struct1, struct2) {
    const newStruct = {
      nodeCount: 0,
      nodeOffsets: [],
      segments: [],
      color: {
        r: (struct1.color.r + struct2.color.r) / 2,
        g: (struct1.color.g + struct2.color.g) / 2,
        b: (struct1.color.b + struct2.color.b) / 2
      }
    }

    const allSegments = [...struct1.segments, ...struct2.segments]
    const selectedSegments = []

    const keepRatio = 0.5 + Math.random() * 0.3
    for (const seg of allSegments) {
      if (Math.random() < keepRatio && selectedSegments.length < 10) {
        selectedSegments.push({ ...seg })
      }
    }

    const usedNodes = new Set()
    for (const seg of selectedSegments) {
      usedNodes.add(seg.i1)
      usedNodes.add(seg.i2)
    }

    const nodeMapping = new Map()
    let newIndex = 0

    const allOffsets = [...struct1.nodeOffsets, ...struct2.nodeOffsets]

    for (const oldIndex of usedNodes) {
      if (oldIndex < allOffsets.length) {
        newStruct.nodeOffsets.push({ ...allOffsets[oldIndex] })
        nodeMapping.set(oldIndex, newIndex)
        newIndex++
      }
    }

    newStruct.nodeCount = newStruct.nodeOffsets.length

    for (const seg of selectedSegments) {
      if (nodeMapping.has(seg.i1) && nodeMapping.has(seg.i2)) {
        newStruct.segments.push({
          ...seg,
          i1: nodeMapping.get(seg.i1),
          i2: nodeMapping.get(seg.i2)
        })
      }
    }

    return newStruct
  }

  function gameLoop(drawCallback) {
    for (let i = 0; i < store.simulationSpeed; i++) {
      update()
    }
    if (drawCallback) {
      drawCallback()
    }
    animationFrameId = requestAnimationFrame(() => gameLoop(drawCallback))
  }

  function start(drawCallback) {
    init()
    gameLoop(drawCallback)
  }

  function stop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  return {
    init,
    spawnFood,
    start,
    stop
  }
}
