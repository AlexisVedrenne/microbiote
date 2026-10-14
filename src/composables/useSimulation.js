/**
 * useSimulation.js - Boucle principale de la simulation
 * 
 * Utilise le nouveau système de physique (physics/*)
 */

import { useSimulationStore } from 'src/stores/simulation'
import { Creature } from 'src/physics/Creature'
import { Food } from 'src/classes/Food'
import { WORLD_WIDTH, WORLD_HEIGHT, GENERATION_DURATION, DEATH_CAUSES, FOOD_TYPES } from 'src/utils/Constants'
import { evolveCreature, seekFood, seekMate, checkCannibalism } from 'src/utils/CreatureHelpers'

/**
 * Mute les gènes d'une créature pour créer une variation
 * Adapté au nouveau système d'onde
 */
function mutateGenes(genes) {
  const mutated = JSON.parse(JSON.stringify(genes)) // Deep copy
  const mutationRate = 0.2 // Taux augmenté pour plus d'exploration
  
  // Muter les propriétés physiques
  if (Math.random() < mutationRate) {
    mutated.muscleStrength = Math.max(0.15, Math.min(0.8, 
      mutated.muscleStrength + (Math.random() - 0.5) * 0.15))
  }
  
  if (Math.random() < mutationRate) {
    mutated.metabolicEfficiency = Math.max(0.5, Math.min(1.2, 
      mutated.metabolicEfficiency + (Math.random() - 0.5) * 0.1))
  }
  
  if (Math.random() < mutationRate) {
    mutated.fertility = Math.max(0.5, Math.min(1.5, 
      mutated.fertility + (Math.random() - 0.5) * 0.1))
  }
  
  // Muter la couleur légèrement
  if (mutated.color) {
    mutated.color.r = Math.max(50, Math.min(255, mutated.color.r + Math.floor((Math.random() - 0.5) * 30)))
    mutated.color.g = Math.max(50, Math.min(255, mutated.color.g + Math.floor((Math.random() - 0.5) * 30)))
    mutated.color.b = Math.max(50, Math.min(255, mutated.color.b + Math.floor((Math.random() - 0.5) * 30)))
  }
  
  // Muter les paramètres d'onde (nouveau système)
  if (mutated.motorClock) {
    // Fréquence de l'onde (vitesse d'oscillation)
    if (Math.random() < mutationRate) {
      mutated.motorClock.frequency = Math.max(0.02, Math.min(0.1, 
        (mutated.motorClock.frequency || 0.05) + (Math.random() - 0.5) * 0.02))
    }
    
    // Longueur d'onde (décalage entre articulations)
    if (Math.random() < mutationRate) {
      mutated.motorClock.waveLength = Math.max(0.2, Math.min(2.0, 
        (mutated.motorClock.waveLength || 0.8) + (Math.random() - 0.5) * 0.4))
    }
    
    // Amplitude (force du mouvement)
    if (Math.random() < mutationRate) {
      mutated.motorClock.amplitude = Math.max(0.2, Math.min(0.5, 
        (mutated.motorClock.amplitude || 0.4) + (Math.random() - 0.5) * 0.1))
    }
    
    // Vitesse globale
    if (Math.random() < mutationRate) {
      mutated.motorClock.speed = Math.max(0.5, Math.min(2, 
        (mutated.motorClock.speed || 1) + (Math.random() - 0.5) * 0.3))
    }
  }
  
  return mutated
}

export function useSimulation() {
  const store = useSimulationStore()
  let animationFrameId = null

  function init() {
    store.reset()

    // Population initiale
    for (let i = 0; i < 25; i++) {
      store.creatures.push(
        new Creature(
          Math.random() * WORLD_WIDTH,
          Math.random() * WORLD_HEIGHT,
          null,
          null,
          store.currentGeneration
        )
      )
    }

    spawnFood(60) // Nourriture initiale réduite
    store.logEvent('birth', '🌊 Simulation démarrée - Génération 1')
  }

  function spawnFood(count) {
    // Limiter la quantité totale de nourriture pour éviter le lag
    const maxFood = 150
    if (store.food.length >= maxFood) return
    
    const spawnCount = Math.min(count, maxFood - store.food.length)
    
    for (let i = 0; i < spawnCount; i++) {
      const foodType = getRandomFoodType()
      const x = Math.random() * WORLD_WIDTH
      const y = Math.random() * WORLD_HEIGHT

      store.food.push(new Food(x, y, foodType))

      // Petit amas pour nourriture riche (1-2 extra seulement)
      if (foodType.name === 'rich' && store.food.length < maxFood) {
        const clusterSize = 1 + Math.floor(Math.random() * 2)
        for (let j = 0; j < clusterSize && store.food.length < maxFood; j++) {
          const angle = Math.random() * Math.PI * 2
          const distance = 10 + Math.random() * 20
          store.food.push(new Food(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            foodType
          ))
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

    // Ajouter nourriture périodiquement (toutes les 2 secondes environ)
    if (store.time % 100 === 0) {
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

    store.logEvent('evolution', `🔄 GÉNÉRATION ${store.currentGeneration}`)

    // Récupérer les meilleures créatures mortes AVANT de reset
    const bestDeadGenes = store.evolutionMemory.getBestDeadCreatures(10)
    const bestFromHistory = store.evolutionMemory.getBestFromHistory(5)
    
    // Reset des morts de la génération
    store.evolutionMemory.newGeneration()

    // Faire évoluer les survivants
    for (const creature of store.creatures) {
      evolveCreature(creature, null, store.logEvent)
      creature.generation = store.currentGeneration

      // Reset stats
      creature.stats = {
        foodEaten: 0,
        distanceTraveled: 0,
        survivalTime: 0,
        reproductions: 0,
        totalSpeed: 0,
        speedSamples: 0,
        energyLost: 0
      }

      // Regain d'énergie
      creature.energy = Math.min(creature.maxEnergy, creature.energy + 40)
    }

    const survivorCount = store.creatures.length

    // Calculer combien de nouvelles créatures ajouter
    let newCreatureCount = 0
    if (survivorCount === 0) {
      newCreatureCount = 25
    } else if (survivorCount < 10) {
      newCreatureCount = 20
    } else if (survivorCount < 20) {
      newCreatureCount = 12
    } else if (survivorCount < 30) {
      newCreatureCount = 8
    } else {
      newCreatureCount = 4
    }

    // Créer les nouvelles créatures basées sur les meilleures mortes
    let createdFromBest = 0
    const allBestGenes = [...bestDeadGenes, ...bestFromHistory]
    
    for (let i = 0; i < newCreatureCount; i++) {
      let newCreature
      
      // 70% de chance de créer à partir d'une créature morte efficace
      if (allBestGenes.length > 0 && Math.random() < 0.7) {
        // Choisir un parent parmi les meilleurs
        const parentGenes = allBestGenes[Math.floor(Math.random() * allBestGenes.length)]
        
        // Créer une copie mutée
        const mutatedGenes = mutateGenes(parentGenes)
        
        newCreature = new Creature(
          Math.random() * WORLD_WIDTH,
          Math.random() * WORLD_HEIGHT,
          mutatedGenes,
          null,
          store.currentGeneration
        )
        createdFromBest++
      } else {
        // Créer une créature complètement nouvelle
        newCreature = new Creature(
          Math.random() * WORLD_WIDTH,
          Math.random() * WORLD_HEIGHT,
          null,
          null,
          store.currentGeneration
        )
      }
      
      store.creatures.push(newCreature)
    }

    if (createdFromBest > 0) {
      store.logEvent('birth', `+${newCreatureCount} créatures (${createdFromBest} basées sur les meilleures, ${survivorCount} survivants)`)
    } else {
      store.logEvent('birth', `+${newCreatureCount} créatures (${survivorCount} survivants)`)
    }
    spawnFood(30) // Nourriture de génération réduite

    if (store.currentGeneration > store.maxGeneration) {
      store.maxGeneration = store.currentGeneration
    }
  }

  function reproduce(creature, partner) {
    const parent1Family = creature.familyName || creature.firstName
    const parent2Family = partner.familyName || partner.firstName

    // Fusionner les gènes
    const childGenes = {
      muscleStrength: (creature.genes.muscleStrength + partner.genes.muscleStrength) / 2,
      metabolicEfficiency: (creature.genes.metabolicEfficiency + partner.genes.metabolicEfficiency) / 2,
      maxEnergyBonus: Math.floor((creature.genes.maxEnergyBonus + partner.genes.maxEnergyBonus) / 2),
      fertility: (creature.genes.fertility + partner.genes.fertility) / 2,
      color: {
        r: Math.floor((creature.color.r + partner.color.r) / 2),
        g: Math.floor((creature.color.g + partner.color.g) / 2),
        b: Math.floor((creature.color.b + partner.color.b) / 2)
      },
      structure: mergeStructures(creature.getGenes().structure, partner.getGenes().structure),
      motorClock: mergeMotorClocks(creature.motorClock, partner.motorClock)
    }

    const cx = (creature.getCenterX() + partner.getCenterX()) / 2
    const cy = (creature.getCenterY() + partner.getCenterY()) / 2

    const child = new Creature(cx, cy, childGenes, {
      parent1: parent1Family,
      parent2: parent2Family
    }, store.currentGeneration)

    // Muter légèrement l'horloge de l'enfant
    child.motorClock.mutate(0.1)

    store.creatures.push(child)

    // Coût de reproduction
    const reproductionCost = (40 + creature.mass * 3) * creature.genes.fertility
    creature.energy -= reproductionCost
    partner.energy -= reproductionCost

    // Cooldown
    const baseCooldown = 180 + creature.mass * 10
    creature.reproductionCooldown = baseCooldown * creature.genes.fertility
    partner.reproductionCooldown = baseCooldown * partner.genes.fertility

    creature.fertilityWindow = 0
    partner.fertilityWindow = 0

    creature.stats.reproductions++
    partner.stats.reproductions++

    store.totalBirths++
    store.logEvent('birth', `💕 ${creature.firstName} + ${partner.firstName} → ${child.firstName}`)
  }

  function mergeStructures(struct1, struct2) {
    // Choisir principalement d'un parent
    const primary = Math.random() < 0.5 ? struct1 : struct2

    const newStruct = {
      nodeCount: 0,
      nodeOffsets: [],
      links: [],
      color: {
        r: (struct1.color?.r || 150 + struct2.color?.r || 150) / 2,
        g: (struct1.color?.g || 150 + struct2.color?.g || 150) / 2,
        b: (struct1.color?.b || 150 + struct2.color?.b || 150) / 2
      }
    }

    // Prendre les nodes du parent principal
    for (const offset of primary.nodeOffsets) {
      newStruct.nodeOffsets.push({ ...offset })
    }

    // Prendre les links du parent principal
    const links = primary.links || []
    for (const link of links) {
      newStruct.links.push({ ...link })
    }

    newStruct.nodeCount = newStruct.nodeOffsets.length

    return newStruct
  }

  function mergeMotorClocks(clock1, clock2) {
    if (!clock1 || !clock2) return null

    // Prendre les poses alternées des deux parents
    const poses = []
    const maxPoses = Math.max(clock1.poses.length, clock2.poses.length)

    for (let i = 0; i < maxPoses; i++) {
      if (i % 2 === 0 && i < clock1.poses.length) {
        poses.push([...clock1.poses[i]])
      } else if (i < clock2.poses.length) {
        poses.push([...clock2.poses[i]])
      }
    }

    return {
      poses: poses,
      period: (clock1.period + clock2.period) / 2,
      speed: (clock1.speed + clock2.speed) / 2
    }
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
