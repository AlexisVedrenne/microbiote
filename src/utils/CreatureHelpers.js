import { Node } from 'src/classes/Node'
import { Segment } from 'src/classes/Segment'

// Évolution adaptative
export function evolveCreature(creature, deathPatterns, logEventFn) {
  const avgSpeed = creature.stats.speedSamples > 0 ? creature.stats.totalSpeed / creature.stats.speedSamples : 0

  const foodPerTime = creature.stats.survivalTime > 0 ? creature.stats.foodEaten / (creature.stats.survivalTime / 60) : 0

  const energyEfficiency = creature.stats.energyLost > 0 ? creature.stats.foodEaten / creature.stats.energyLost : 0

  const weaknesses = [
    { type: 'speed', value: avgSpeed, threshold: 0.5 },
    { type: 'food', value: foodPerTime, threshold: 2 },
    { type: 'efficiency', value: energyEfficiency, threshold: 0.5 },
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

  const avoidanceFactor = 0.3

  switch (weakest) {
    case 'speed':
      if (deathPatterns && deathPatterns.avoidHighSpeed && Math.random() < avoidanceFactor) {
        creature.genes.metabolicEfficiency *= 0.85
        logEventFn('birth', `${creature.firstName}: Évolution PRUDENTE (évite haute vitesse)`)
      } else {
        creature.genes.muscleStrength *= 1.3
        creature.genes.muscleStrength = Math.min(0.6, creature.genes.muscleStrength)

        for (const seg of creature.segments) {
          seg.strength *= 1.2
        }

        if (Math.random() < 0.4 && creature.segments.length >= 2) {
          const avgPhase = creature.segments.reduce((sum, s) => sum + s.phase, 0) / creature.segments.length
          for (const seg of creature.segments) {
            seg.phase = seg.phase * 0.7 + avgPhase * 0.3
          }
        }

        logEventFn('birth', `${creature.firstName}: Évolution VITESSE`)
      }
      break

    case 'food': {
      const shouldAddSegment = Math.random() < 0.5 && creature.segments.length < 10

      if (shouldAddSegment) {
        if (deathPatterns && deathPatterns.avoidManySegments && Math.random() < avoidanceFactor) {
          creature.genes.muscleStrength *= 1.2
          logEventFn('birth', `${creature.firstName}: Évolution PRUDENTE (évite + segments)`)
        } else {
          addSegment(creature)
          logEventFn('birth', `${creature.firstName}: Évolution +MEMBRE`)
        }
      } else {
        creature.genes.muscleStrength *= 1.2
        logEventFn('birth', `${creature.firstName}: Évolution AGILITÉ`)
      }
    }
      break

    case 'efficiency': {
      const shouldRemoveSegment = Math.random() < 0.4 && creature.segments.length > 3

      if (shouldRemoveSegment) {
        if (deathPatterns && deathPatterns.avoidSmallSize && Math.random() < avoidanceFactor) {
          creature.genes.metabolicEfficiency *= 0.85
          creature.genes.metabolicEfficiency = Math.max(0.5, creature.genes.metabolicEfficiency)
          logEventFn('birth', `${creature.firstName}: Évolution PRUDENTE (évite petite taille)`)
        } else {
          removeSegment(creature)
          logEventFn('birth', `${creature.firstName}: Évolution -MEMBRE`)
        }
      } else {
        creature.genes.metabolicEfficiency *= 0.85
        creature.genes.metabolicEfficiency = Math.max(0.5, creature.genes.metabolicEfficiency)
        logEventFn('birth', `${creature.firstName}: Évolution MÉTABOLISME`)
      }
    }
      break

    case 'survival':
      if (Math.random() < 0.5) {
        creature.genes.maxEnergyBonus += 30
        creature.maxEnergy = 100 + creature.genes.maxEnergyBonus
        logEventFn('birth', `${creature.firstName}: Évolution ÉNERGIE MAX`)
      } else {
        creature.genes.fertility *= 0.85
        creature.genes.fertility = Math.max(0.5, creature.genes.fertility)
        logEventFn('birth', `${creature.firstName}: Évolution FERTILITÉ (↑reproduction)`)
      }
      break
  }

  // Mutation couleur
  creature.color.r = Math.max(50, Math.min(255, creature.color.r + (Math.random() - 0.5) * 30))
  creature.color.g = Math.max(50, Math.min(255, creature.color.g + (Math.random() - 0.5) * 30))
  creature.color.b = Math.max(50, Math.min(255, creature.color.b + (Math.random() - 0.5) * 30))
}

// Ajouter un segment
export function addSegment(creature) {
  if (creature.nodes.length >= 12) return

  const parentNode = creature.nodes[Math.floor(Math.random() * creature.nodes.length)]
  const angle = Math.random() * Math.PI * 2
  const length = 15 + Math.random() * 25

  const newNode = new Node(parentNode.x + Math.cos(angle) * length, parentNode.y + Math.sin(angle) * length)
  creature.nodes.push(newNode)

  creature.segments.push(
    new Segment(parentNode, newNode, 0.2 + Math.random() * 0.3, Math.random() * Math.PI * 2, 0.04 + Math.random() * 0.06)
  )

  creature.calculateMass()
  ensureConnectivity(creature)
}

// Retirer un segment
export function removeSegment(creature) {
  if (creature.segments.length <= 2 || creature.nodes.length <= 3) return

  const segIndex = Math.floor(Math.random() * creature.segments.length)
  creature.segments.splice(segIndex, 1)

  ensureConnectivity(creature)

  if (creature.segments.length < 2 || creature.nodes.length < 3) {
    return
  }

  creature.calculateMass()
}

// Assurer connectivité du graphe
export function ensureConnectivity(creature) {
  if (creature.nodes.length <= 1) return

  const visited = new Set()
  const queue = [creature.nodes[0]]
  visited.add(creature.nodes[0])

  while (queue.length > 0) {
    const current = queue.shift()

    for (const seg of creature.segments) {
      let neighbor = null
      if (seg.node1 === current) neighbor = seg.node2
      if (seg.node2 === current) neighbor = seg.node1

      if (neighbor && !visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
      }
    }
  }

  if (visited.size < creature.nodes.length) {
    creature.nodes = creature.nodes.filter((n) => visited.has(n))

    creature.segments = creature.segments.filter((s) => creature.nodes.includes(s.node1) && creature.nodes.includes(s.node2))
  }
}

// Chercher nourriture
export function seekFood(creature, foodArray) {
  const cx = creature.getCenterX()
  const cy = creature.getCenterY()
  const radius = creature.getRadius()

  const visionRange = 100 + creature.mass * 10

  let nearestFood = null
  let nearestDist = visionRange

  for (let i = foodArray.length - 1; i >= 0; i--) {
    const f = foodArray[i]
    const dx = f.x - cx
    const dy = f.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < radius + 10) {
      let energyGain = f.type.energy
      if (creature.debuffs.poison > 0) {
        energyGain *= 0.5
      }

      creature.energy = Math.min(creature.maxEnergy, creature.energy + energyGain)
      creature.stats.foodEaten++

      if (f.type.debuff) {
        if (f.type.debuff === 'slow') {
          creature.debuffs.slow = f.type.debuffDuration
        } else if (f.type.debuff === 'poison') {
          creature.debuffs.poison = f.type.debuffDuration
        }
      }

      foodArray.splice(i, 1)
      continue
    }

    if (dist < nearestDist) {
      nearestDist = dist
      nearestFood = f
    }
  }

  if (nearestFood) {
    const dx = nearestFood.x - cx
    const dy = nearestFood.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 0) {
      let baseForce = 0.3 * creature.genes.muscleStrength
      if (creature.debuffs.slow > 0) {
        baseForce *= 0.5
      }

      const forceX = (dx / dist) * baseForce
      const forceY = (dy / dist) * baseForce

      for (const node of creature.nodes) {
        node.applyForce(forceX, forceY)
      }
    }
  }
}

// Chercher partenaire
export function seekMate(creature, creaturesArray) {
  const cx = creature.getCenterX()
  const cy = creature.getCenterY()
  const radius = creature.getRadius()

  const detectionRange = 150 / creature.genes.fertility

  let nearestMate = null
  let nearestDist = detectionRange
  let nearestOutsideFamily = null
  let nearestOutsideDist = detectionRange

  for (const other of creaturesArray) {
    if (other === creature || !other.canReproduce()) continue

    const dx = other.getCenterX() - cx
    const dy = other.getCenterY() - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < radius + other.getRadius() + 5) {
      return other // Contact physique = reproduction
    }

    const isOutsideFamily = !creature.familyName || !other.familyName || creature.familyName !== other.familyName

    if (isOutsideFamily && dist < nearestOutsideDist) {
      nearestOutsideDist = dist
      nearestOutsideFamily = other
    }

    if (dist < nearestDist) {
      nearestDist = dist
      nearestMate = other
    }
  }

  let targetMate = nearestMate
  if (nearestOutsideFamily && Math.random() < 0.6) {
    targetMate = nearestOutsideFamily
  }

  if (targetMate) {
    const dx = targetMate.getCenterX() - cx
    const dy = targetMate.getCenterY() - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 0) {
      const attractionForce = 0.2 / creature.genes.fertility
      const forceX = (dx / dist) * attractionForce
      const forceY = (dy / dist) * attractionForce

      for (const node of creature.nodes) {
        node.applyForce(forceX, forceY)
      }
    }
  }

  return null
}

// Cannibalisme
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

    const canEat = creature.mass > other.mass * 1.5 || (creature.energy > other.energy && other.energy < 30)

    if (canEat && dist < radius + other.getRadius()) {
      creature.energy += other.mass * 15

      recordDeathFn(other, 'cannibalism')
      creaturesArray.splice(i, 1)
      logEventFn('cannibalism', `🔪 ${creature.firstName} mange ${other.firstName}`)
      return true
    }
  }
  return false
}
