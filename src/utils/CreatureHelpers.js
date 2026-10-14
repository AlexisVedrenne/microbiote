/**
 * CreatureHelpers.js - Fonctions utilitaires pour les créatures
 * 
 * Compatible avec le nouveau système de physique (physics/*)
 */

import { Node } from 'src/physics/Node'
import { Link } from 'src/physics/Link'
import { detectArticulations } from 'src/physics/Contraction'

/**
 * Évolution adaptative basée sur les performances
 */
export function evolveCreature(creature, deathPatterns, logEventFn) {
  const avgSpeed = creature.stats.speedSamples > 0 
    ? creature.stats.totalSpeed / creature.stats.speedSamples 
    : 0
  const foodPerTime = creature.stats.survivalTime > 0 
    ? creature.stats.foodEaten / (creature.stats.survivalTime / 60) 
    : 0
  const energyEfficiency = creature.stats.energyLost > 0 
    ? creature.stats.foodEaten / creature.stats.energyLost 
    : 0

  const weaknesses = [
    { type: 'speed', value: avgSpeed, threshold: 0.3 },
    { type: 'food', value: foodPerTime, threshold: 1.5 },
    { type: 'efficiency', value: energyEfficiency, threshold: 0.3 },
    { type: 'survival', value: creature.stats.survivalTime, threshold: 600 }
  ]

  let weakest = null
  let weakestRatio = Infinity

  for (const w of weaknesses) {
    const ratio = w.value / w.threshold
    if (ratio < weakestRatio) {
      weakestRatio = ratio
      weakest = w.type
    }
  }

  switch (weakest) {
    case 'speed':
      // Améliorer la force musculaire
      creature.genes.muscleStrength *= 1.2
      creature.genes.muscleStrength = Math.min(0.8, creature.genes.muscleStrength)
      
      // Muter l'horloge motrice pour essayer de nouveaux mouvements
      if (creature.motorClock) {
        creature.motorClock.mutate(0.15)
      }
      logEventFn('evolution', `${creature.firstName}: Évolution VITESSE`)
      break

    case 'food':
      if (Math.random() < 0.5 && creature.links.length < 8) {
        addLink(creature)
        logEventFn('evolution', `${creature.firstName}: Évolution +MEMBRE`)
      } else {
        creature.genes.muscleStrength *= 1.15
        logEventFn('evolution', `${creature.firstName}: Évolution AGILITÉ`)
      }
      break

    case 'efficiency':
      if (Math.random() < 0.4 && creature.links.length > 2) {
        removeLink(creature)
        logEventFn('evolution', `${creature.firstName}: Évolution -MEMBRE`)
      } else {
        creature.genes.metabolicEfficiency *= 0.85
        creature.genes.metabolicEfficiency = Math.max(0.5, creature.genes.metabolicEfficiency)
        logEventFn('evolution', `${creature.firstName}: Évolution MÉTABOLISME`)
      }
      break

    case 'survival':
      if (Math.random() < 0.5) {
        creature.genes.maxEnergyBonus += 20
        creature.maxEnergy = 100 + creature.genes.maxEnergyBonus
        logEventFn('evolution', `${creature.firstName}: Évolution ÉNERGIE MAX`)
      } else {
        creature.genes.fertility *= 0.9
        creature.genes.fertility = Math.max(0.5, creature.genes.fertility)
        logEventFn('evolution', `${creature.firstName}: Évolution FERTILITÉ`)
      }
      break
  }

  // Mutation couleur
  creature.color.r = Math.max(50, Math.min(255, creature.color.r + (Math.random() - 0.5) * 30))
  creature.color.g = Math.max(50, Math.min(255, creature.color.g + (Math.random() - 0.5) * 30))
  creature.color.b = Math.max(50, Math.min(255, creature.color.b + (Math.random() - 0.5) * 30))
}

/**
 * Ajoute un lien (membre) à la créature
 */
export function addLink(creature) {
  if (creature.nodes.length >= 10) return

  // Choisir un node existant au hasard
  const parentNode = creature.nodes[Math.floor(Math.random() * creature.nodes.length)]
  
  // Créer un nouveau node dans une direction aléatoire
  const angle = Math.random() * Math.PI * 2
  const length = 18 + Math.random() * 15

  const newNode = new Node(
    parentNode.x + Math.cos(angle) * length,
    parentNode.y + Math.sin(angle) * length
  )
  creature.nodes.push(newNode)

  // Créer le lien
  const newLink = new Link(parentNode, newNode, length)
  creature.links.push(newLink)

  // Recalculer
  creature.calculateMass()
  creature.articulations = detectArticulations(creature.nodes, creature.links)
  
  // Mettre à jour l'horloge pour le nouveau nombre d'articulations
  if (creature.motorClock && creature.articulations.length > creature.motorClock.articulationCount) {
    creature.motorClock.articulationCount = creature.articulations.length
    // Ajouter une contraction aléatoire pour la nouvelle articulation
    for (const pose of creature.motorClock.poses) {
      pose.push(Math.random())
    }
  }
  
  ensureConnectivity(creature)
}

/**
 * Retire un lien de la créature
 */
export function removeLink(creature) {
  if (creature.links.length <= 2 || creature.nodes.length <= 3) return

  // Retirer un lien au hasard
  const linkIndex = Math.floor(Math.random() * creature.links.length)
  creature.links.splice(linkIndex, 1)

  ensureConnectivity(creature)
  creature.calculateMass()
  creature.articulations = detectArticulations(creature.nodes, creature.links)
}

/**
 * Assure que tous les nodes sont connectés
 */
export function ensureConnectivity(creature) {
  if (creature.nodes.length <= 1) return

  const visited = new Set()
  const queue = [creature.nodes[0]]
  visited.add(creature.nodes[0])

  while (queue.length > 0) {
    const current = queue.shift()

    for (const link of creature.links) {
      let neighbor = null
      if (link.nodeA === current) neighbor = link.nodeB
      if (link.nodeB === current) neighbor = link.nodeA

      if (neighbor && !visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
      }
    }
  }

  // Supprimer les nodes non connectés
  if (visited.size < creature.nodes.length) {
    creature.nodes = creature.nodes.filter(n => visited.has(n))
    creature.links = creature.links.filter(l => 
      creature.nodes.includes(l.nodeA) && creature.nodes.includes(l.nodeB)
    )
  }
}

/**
 * Cherche et mange la nourriture proche
 */
export function seekFood(creature, foodArray) {
  const cx = creature.getCenterX()
  const cy = creature.getCenterY()
  const radius = creature.getRadius()
  const visionRange = 80 + creature.mass * 8

  let nearestFood = null
  let nearestDist = visionRange

  for (let i = foodArray.length - 1; i >= 0; i--) {
    const f = foodArray[i]
    const dx = f.x - cx
    const dy = f.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Contact = manger
    if (dist < radius + 8) {
      let energyGain = f.type.energy
      if (creature.debuffs.poison > 0) {
        energyGain *= 0.5
      }

      creature.energy = Math.min(creature.maxEnergy, creature.energy + energyGain)
      creature.stats.foodEaten++

      if (f.type.debuff) {
        creature.debuffs[f.type.debuff] = f.type.debuffDuration
      }

      foodArray.splice(i, 1)
      continue
    }

    if (dist < nearestDist) {
      nearestDist = dist
      nearestFood = f
    }
  }

  // Attirer vers la nourriture la plus proche
  if (nearestFood) {
    const dx = nearestFood.x - cx
    const dy = nearestFood.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 0) {
      // Force très légère pour ne pas perturber la physique
      let baseForce = 0.005 * creature.genes.muscleStrength
      if (creature.debuffs.slow > 0) baseForce *= 0.5

      const forceX = (dx / dist) * baseForce
      const forceY = (dy / dist) * baseForce

      // Appliquer seulement au premier node (tête)
      if (creature.nodes.length > 0) {
        creature.nodes[0].applyForce(forceX, forceY)
      }
    }
  }
}

/**
 * Cherche un partenaire pour reproduction
 */
export function seekMate(creature, creaturesArray) {
  const cx = creature.getCenterX()
  const cy = creature.getCenterY()
  const radius = creature.getRadius()
  const detectionRange = 120 / creature.genes.fertility

  let nearestMate = null
  let nearestDist = detectionRange

  for (const other of creaturesArray) {
    if (other === creature || !other.canReproduce()) continue

    const dx = other.getCenterX() - cx
    const dy = other.getCenterY() - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Contact = reproduction
    if (dist < radius + other.getRadius() + 5) {
      return other
    }

    if (dist < nearestDist) {
      nearestDist = dist
      nearestMate = other
    }
  }

  // Attirer vers le partenaire
  if (nearestMate) {
    const dx = nearestMate.getCenterX() - cx
    const dy = nearestMate.getCenterY() - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 0) {
      // Force très légère
      const force = 0.003 / creature.genes.fertility
      const forceX = (dx / dist) * force
      const forceY = (dy / dist) * force

      // Appliquer seulement au premier node
      if (creature.nodes.length > 0) {
        creature.nodes[0].applyForce(forceX, forceY)
      }
    }
  }

  return null
}

/**
 * Vérifie et applique le cannibalisme
 */
export function checkCannibalism(creature, creaturesArray, recordDeathFn, logEventFn) {
  const cx = creature.getCenterX()
  const cy = creature.getCenterY()
  const radius = creature.getRadius()

  for (let i = creaturesArray.length - 1; i >= 0; i--) {
    const other = creaturesArray[i]
    if (other === creature) continue

    const dx = other.getCenterX() - cx
    const dy = other.getCenterY() - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    const canEat = creature.mass > other.mass * 1.5 || 
                   (creature.energy > other.energy && other.energy < 30)

    if (canEat && dist < radius + other.getRadius()) {
      creature.energy += other.mass * 12
      recordDeathFn(other, 'cannibalism')
      creaturesArray.splice(i, 1)
      logEventFn('cannibalism', `🔪 ${creature.firstName} mange ${other.firstName}`)
      return true
    }
  }
  return false
}
