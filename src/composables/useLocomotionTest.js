/**
 * useLocomotionTest.js - Test de locomotion en mode COURSE
 * 
 * RÈGLES :
 * - Les créatures partent alignées à gauche
 * - Elles doivent atteindre la ligne d'arrivée à droite
 * - AUCUNE triche : pas de force qui les pousse, juste leur physique
 * 
 * MUTATIONS (obligatoire, 1 par enfant) :
 * - 45% : Vitesse de l'horloge (frequency, speed)
 * - 45% : Positions à atteindre dans l'horloge (poses)
 * - 10% : Structure (ajout/suppression de membres) - RARE
 */

import { ref } from 'vue'
import { Creature } from 'src/physics/Creature'

// Constantes du test
const WORLD_WIDTH = 2000
const WORLD_HEIGHT = 1500
const POPULATION_SIZE = 30
const SURVIVORS_COUNT = 15  // On garde la moitié
const TEST_DURATION = 1000  // Frames max par course

// Course
const START_X = 150         // Ligne de départ
const FINISH_X = 1850       // Ligne d'arrivée
const RACE_DISTANCE = FINISH_X - START_X

export function useLocomotionTest() {
  // État
  const creatures = ref([])
  const generation = ref(1)
  const frame = ref(0)
  const isRunning = ref(false)
  const bestTime = ref(0)
  const finishedCount = ref(0)
  const log = ref([])
  
  // Pour compatibilité avec l'interface
  const bestDistance = ref(0)
  const avgDistance = ref(0)
  
  let animationFrameId = null
  let lastTime = 0
  const targetFPS = 50
  const frameInterval = 1000 / targetFPS

  /**
   * Initialise la population
   */
  function init() {
    creatures.value = []
    generation.value = 1
    frame.value = 0
    finishedCount.value = 0
    log.value = []
    
    const spacing = (WORLD_HEIGHT - 100) / POPULATION_SIZE
    
    for (let i = 0; i < POPULATION_SIZE; i++) {
      const creature = new Creature(
        START_X + (Math.random() - 0.5) * 20,
        50 + i * spacing + (Math.random() - 0.5) * 10,
        null,
        null,
        1
      )
      creature.energy = Infinity
      creature.finishTime = null
      
      // Tracking pour l'efficience
      creature.energySpent = 0      // Énergie dépensée pendant la course
      creature.startX = creature.getCenterX()
      
      creatures.value.push(creature)
    }
    
    addLog(`🏁 COURSE - Génération 1 - ${POPULATION_SIZE} créatures`)
  }

  /**
   * Met à jour une frame
   * PAS DE TRICHE : juste la physique normale
   * + Calcul de l'énergie dépensée
   */
  function updateFrame() {
    frame.value++
    
    for (const creature of creatures.value) {
      // Calculer l'énergie dépensée AVANT l'update (basé sur les contractions)
      // L'énergie = somme des mouvements des articulations
      const energyThisFrame = calculateEnergySpent(creature)
      creature.energySpent += energyThisFrame
      
      // Mise à jour physique normale (horloge + contractions + eau)
      creature.update()
      
      // Vérifier arrivée
      if (creature.finishTime === null) {
        const cx = creature.getCenterX()
        if (cx >= FINISH_X) {
          creature.finishTime = frame.value
          finishedCount.value++
          
          if (finishedCount.value === 1) {
            addLog(`🥇 ${creature.firstName} arrive 1er ! (${frame.value} frames)`)
          } else if (finishedCount.value <= 3) {
            const medals = ['', '🥈', '🥉']
            addLog(`${medals[finishedCount.value]} ${creature.firstName} arrive ${finishedCount.value}e`)
          }
        }
      }
    }
    
    if (frame.value >= TEST_DURATION || finishedCount.value >= creatures.value.length) {
      endGeneration()
    }
  }
  
  /**
   * Calcule l'énergie dépensée par une créature pour cette frame
   * Basé sur la vitesse des nodes (mouvement = énergie)
   */
  function calculateEnergySpent(creature) {
    let energy = 0
    
    // Énergie = somme des vitesses de tous les nodes
    for (const node of creature.nodes) {
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
      energy += speed
    }
    
    // On ne divise PAS par la masse ici - on le fera dans le calcul d'efficience
    return energy
  }

  /**
   * Fin de génération : sélection basée sur l'EFFICIENCE
   * 
   * Efficience = (Distance parcourue × Masse) / Énergie dépensée
   * 
   * Comme ça les grosses créatures ne sont pas désavantagées
   * (elles dépensent plus d'énergie mais c'est normal vu leur taille)
   */
  function endGeneration() {
    const results = creatures.value.map((creature, index) => {
      const cx = creature.getCenterX()
      const distanceTraveled = cx - creature.startX
      const mass = creature.mass || (creature.nodes.length + creature.links.length * 0.5)
      const energySpent = creature.energySpent || 1  // Éviter division par 0
      
      // Efficience = distance × masse / énergie
      // Plus c'est haut, mieux c'est
      // Une grosse créature qui dépense beaucoup d'énergie n'est pas pénalisée
      const efficiency = (distanceTraveled * mass) / energySpent
      
      return {
        index,
        creature,
        efficiency,
        distanceTraveled,
        energySpent,
        mass,
        finished: creature.finishTime !== null,
        finishTime: creature.finishTime
      }
    })
    
    // Trier par efficience (plus haut = meilleur)
    results.sort((a, b) => b.efficiency - a.efficiency)
    
    const finishers = results.filter(r => r.finished)
    bestTime.value = finishers[0]?.finishTime || 0
    finishedCount.value = finishers.length
    bestDistance.value = results[0]?.distanceTraveled || 0
    avgDistance.value = results.reduce((sum, r) => sum + r.distanceTraveled, 0) / results.length
    
    const bestCreature = results[0]
    addLog(`📊 Génération ${generation.value} terminée`)
    addLog(`   Arrivées: ${finishers.length}/${POPULATION_SIZE}`)
    addLog(`   🏆 Meilleur: ${bestCreature.creature.firstName}`)
    addLog(`      Efficience: ${bestCreature.efficiency.toFixed(2)}`)
    addLog(`      Distance: ${bestCreature.distanceTraveled.toFixed(0)}px | Énergie: ${bestCreature.energySpent.toFixed(0)} | Masse: ${bestCreature.mass.toFixed(1)}`)
    
    const survivors = results.slice(0, SURVIVORS_COUNT)
    nextGeneration(survivors)
  }

  /**
   * Crée la génération suivante
   */
  function nextGeneration(survivors) {
    generation.value++
    frame.value = 0
    finishedCount.value = 0
    
    const newCreatures = []
    const spacing = (WORLD_HEIGHT - 100) / POPULATION_SIZE
    
    let creatureIndex = 0
    
    for (const survivor of survivors) {
      const parentGenes = survivor.creature.getGenes()
      
      for (let childNum = 0; childNum < 2; childNum++) {
        const childGenes = mutateGenes(parentGenes)
        
        const child = new Creature(
          START_X + (Math.random() - 0.5) * 20,
          50 + creatureIndex * spacing + (Math.random() - 0.5) * 10,
          childGenes,
          null,
          generation.value
        )
        child.energy = Infinity
        child.finishTime = null
        child.energySpent = 0
        child.startX = child.getCenterX()
        
        newCreatures.push(child)
        creatureIndex++
      }
    }
    
    creatures.value = newCreatures
    addLog(`🏁 Génération ${generation.value} - Nouvelle course !`)
  }

  /**
   * MUTATIONS - UNIQUEMENT 3 TYPES :
   * 
   * 1. Vitesse horloge (45%) : frequency ou speed
   * 2. Positions horloge (45%) : modifier les poses (valeurs de contraction)
   * 3. Structure (10%) : ajouter ou supprimer un membre
   */
  function mutateGenes(genes) {
    const mutated = JSON.parse(JSON.stringify(genes))
    
    const roll = Math.random()
    
    if (roll < 0.45) {
      // === MUTATION VITESSE HORLOGE (45%) ===
      if (mutated.motorClock) {
        if (Math.random() < 0.5) {
          // Muter frequency
          mutated.motorClock.frequency = clamp(
            mutated.motorClock.frequency + (Math.random() - 0.5) * 0.03,
            0.02, 0.15
          )
          addLog(`🧬 Mutation: frequency → ${mutated.motorClock.frequency.toFixed(3)}`)
        } else {
          // Muter speed
          mutated.motorClock.speed = clamp(
            mutated.motorClock.speed + (Math.random() - 0.5) * 0.6,
            0.3, 4.0
          )
          addLog(`🧬 Mutation: speed → ${mutated.motorClock.speed.toFixed(2)}`)
        }
      }
    } 
    else if (roll < 0.90) {
      // === MUTATION POSITIONS HORLOGE (45%) ===
      if (mutated.motorClock && mutated.motorClock.poses && mutated.motorClock.poses.length > 0) {
        // Choisir une pose au hasard
        const poseIdx = Math.floor(Math.random() * mutated.motorClock.poses.length)
        const pose = mutated.motorClock.poses[poseIdx]
        
        if (pose && pose.length > 0) {
          // Choisir une articulation au hasard dans cette pose
          const artIdx = Math.floor(Math.random() * pose.length)
          
          // Modifier la valeur de contraction (entre 0 et 1)
          const oldValue = pose[artIdx]
          pose[artIdx] = clamp(
            pose[artIdx] + (Math.random() - 0.5) * 0.3,
            0.0, 1.0
          )
          addLog(`🧬 Mutation: pose[${poseIdx}][${artIdx}] ${oldValue.toFixed(2)} → ${pose[artIdx].toFixed(2)}`)
        }
      }
    } 
    else {
      // === MUTATION STRUCTURE (10%) - RARE ===
      if (mutated.structure) {
        if (Math.random() < 0.5 && mutated.structure.nodeOffsets.length < 10) {
          addSegment(mutated)
          addLog(`🧬 Mutation structure: +1 membre (total: ${mutated.structure.nodeOffsets.length})`)
        } else if (mutated.structure.nodeOffsets.length > 3) {
          removeSegment(mutated)
          addLog(`🧬 Mutation structure: -1 membre (total: ${mutated.structure.nodeOffsets.length})`)
        } else {
          // Fallback : muter une pose si on ne peut pas modifier la structure
          if (mutated.motorClock && mutated.motorClock.poses && mutated.motorClock.poses.length > 0) {
            const poseIdx = Math.floor(Math.random() * mutated.motorClock.poses.length)
            const pose = mutated.motorClock.poses[poseIdx]
            if (pose && pose.length > 0) {
              const artIdx = Math.floor(Math.random() * pose.length)
              pose[artIdx] = clamp(pose[artIdx] + (Math.random() - 0.5) * 0.3, 0.0, 1.0)
            }
          }
        }
      }
    }
    
    // Légère mutation de couleur pour distinguer les lignées
    if (mutated.color) {
      mutated.color.r = clamp(mutated.color.r + Math.floor((Math.random() - 0.5) * 15), 50, 255)
      mutated.color.g = clamp(mutated.color.g + Math.floor((Math.random() - 0.5) * 15), 50, 255)
      mutated.color.b = clamp(mutated.color.b + Math.floor((Math.random() - 0.5) * 15), 50, 255)
    }
    
    return mutated
  }
  
  /**
   * Ajoute un membre (node + link)
   */
  function addSegment(genes) {
    const offsets = genes.structure.nodeOffsets
    const links = genes.structure.links || []
    
    // Choisir un node existant au hasard
    const parentIdx = Math.floor(Math.random() * offsets.length)
    const parent = offsets[parentIdx]
    
    // Nouveau node dans une direction aléatoire
    const angle = Math.random() * Math.PI * 2
    const length = 15 + Math.random() * 20
    const newOffset = {
      x: parent.x + Math.cos(angle) * length,
      y: parent.y + Math.sin(angle) * length
    }
    
    const newIdx = offsets.length
    offsets.push(newOffset)
    genes.structure.nodeCount = offsets.length
    
    links.push({ a: parentIdx, b: newIdx, length: length })
    genes.structure.links = links
  }
  
  /**
   * Supprime un membre (node feuille + son link)
   */
  function removeSegment(genes) {
    const offsets = genes.structure.nodeOffsets
    const links = genes.structure.links || []
    
    if (offsets.length <= 3) return
    
    // Compter les connexions de chaque node
    const connectionCount = new Array(offsets.length).fill(0)
    for (const link of links) {
      connectionCount[link.a]++
      connectionCount[link.b]++
    }
    
    // Trouver une feuille (1 seule connexion)
    let leafIdx = -1
    for (let i = 1; i < offsets.length; i++) {
      if (connectionCount[i] === 1) {
        leafIdx = i
        break
      }
    }
    
    if (leafIdx === -1) return
    
    // Supprimer
    offsets.splice(leafIdx, 1)
    genes.structure.nodeCount = offsets.length
    
    genes.structure.links = links
      .filter(l => l.a !== leafIdx && l.b !== leafIdx)
      .map(l => ({
        a: l.a > leafIdx ? l.a - 1 : l.a,
        b: l.b > leafIdx ? l.b - 1 : l.b,
        length: l.length
      }))
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  function addLog(message) {
    log.value.unshift(`[Gen ${generation.value}] ${message}`)
    if (log.value.length > 100) log.value.pop()
    console.log(message)
  }

  function gameLoop(currentTime) {
    if (!isRunning.value) return
    
    animationFrameId = requestAnimationFrame(gameLoop)
    
    const elapsed = currentTime - lastTime
    if (elapsed >= frameInterval) {
      lastTime = currentTime - (elapsed % frameInterval)
      updateFrame()
    }
  }

  function start() {
    if (creatures.value.length === 0) init()
    isRunning.value = true
    lastTime = performance.now()
    animationFrameId = requestAnimationFrame(gameLoop)
  }

  function pause() {
    isRunning.value = false
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
  }

  function reset() {
    pause()
    init()
  }

  function fastForward(generations) {
    pause()
    addLog(`⏩ Fast-forward de ${generations} générations...`)
    
    for (let g = 0; g < generations; g++) {
      for (let f = 1; f <= TEST_DURATION; f++) {
        let allFinished = true
        
        for (const creature of creatures.value) {
          // Calculer énergie dépensée
          creature.energySpent += calculateEnergySpent(creature)
          
          creature.update()
          
          if (creature.finishTime === null) {
            const cx = creature.getCenterX()
            if (cx >= FINISH_X) {
              creature.finishTime = f
            } else {
              allFinished = false
            }
          }
        }
        
        if (allFinished) break
      }
      
      // Calcul d'efficience
      const results = creatures.value.map((creature, index) => {
        const cx = creature.getCenterX()
        const distanceTraveled = cx - creature.startX
        const mass = creature.mass || (creature.nodes.length + creature.links.length * 0.5)
        const energySpent = creature.energySpent || 1
        const efficiency = (distanceTraveled * mass) / energySpent
        
        return {
          index,
          creature,
          efficiency,
          distanceTraveled,
          finished: creature.finishTime !== null
        }
      }).sort((a, b) => b.efficiency - a.efficiency)
      
      bestDistance.value = results[0]?.distanceTraveled || 0
      
      const survivors = results.slice(0, SURVIVORS_COUNT)
      nextGeneration(survivors)
    }
    
    addLog(`✅ Fast-forward terminé - Génération ${generation.value}`)
    addLog(`   Meilleure distance: ${bestDistance.value.toFixed(0)}px`)
  }

  return {
    creatures,
    generation,
    frame,
    isRunning,
    bestDistance,
    avgDistance,
    bestTime,
    finishedCount,
    log,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    TEST_DURATION,
    START_X,
    FINISH_X,
    RACE_DISTANCE,
    POPULATION_SIZE,
    init,
    start,
    pause,
    reset,
    fastForward
  }
}
