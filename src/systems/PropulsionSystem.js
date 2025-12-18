import { PROPULSION_TYPES, PROPULSION_CONFIGS, PROPULSION_MUTATION_RATE } from 'src/utils/Constants'

/**
 * Génère les phases initiales pour un type de propulsion donné
 * @param {string} type - Type de propulsion (UNDULATION, OSCILLATION, etc.)
 * @param {number} segmentCount - Nombre de segments
 * @returns {Array<number>} - Array de phases (0 à 2π)
 */
export function generatePropulsionPattern(type, segmentCount) {
  const pattern = []

  switch (type) {
    case PROPULSION_TYPES.UNDULATION:
      // Vague progressive du début à la fin
      for (let i = 0; i < segmentCount; i++) {
        pattern.push((i / segmentCount) * Math.PI * 2)
      }
      break

    case PROPULSION_TYPES.OSCILLATION: {
      // Segments avant synchronisés, arrière bat fort
      const frontCount = Math.floor(segmentCount * 0.7)
      for (let i = 0; i < frontCount; i++) {
        pattern.push(0) // Rigide
      }
      for (let i = frontCount; i < segmentCount; i++) {
        pattern.push(Math.PI) // Arrière bat en opposition
      }
      break
    }

    case PROPULSION_TYPES.JET:
      // Tous segments contractent ensemble puis relâchent
      for (let i = 0; i < segmentCount; i++) {
        pattern.push(0) // Tous synchronisés
      }
      break

    case PROPULSION_TYPES.ROWING:
      // Alternance gauche/droite
      for (let i = 0; i < segmentCount; i++) {
        // Pair = gauche, Impair = droite
        pattern.push(i % 2 === 0 ? 0 : Math.PI)
      }
      break

    case PROPULSION_TYPES.VIBRATION:
      // Petites variations aléatoires autour de 0
      for (let i = 0; i < segmentCount; i++) {
        pattern.push((Math.random() - 0.5) * 0.5) // Petite variance
      }
      break

    default:
      // Fallback: pattern aléatoire
      for (let i = 0; i < segmentCount; i++) {
        pattern.push(Math.random() * Math.PI * 2)
      }
  }

  return pattern
}

/**
 * Sélectionne un type de propulsion aléatoire
 * @returns {string} - Type de propulsion
 */
export function getRandomPropulsionType() {
  const types = Object.values(PROPULSION_TYPES)
  return types[Math.floor(Math.random() * types.length)]
}

/**
 * Fusionne deux types de propulsion lors de la reproduction
 * Si les deux parents ont le même type, l'enfant hérite du même
 * Sinon, 50% chance de prendre un des deux
 * 5% chance de mutation vers un type aléatoire
 * @param {string} type1 - Type parent 1
 * @param {string} type2 - Type parent 2
 * @returns {string} - Type de l'enfant
 */
export function fusePropulsionTypes(type1, type2) {
  // 5% de chance de mutation vers type aléatoire
  if (Math.random() < PROPULSION_MUTATION_RATE) {
    return getRandomPropulsionType()
  }

  // Si même type, hérite du même
  if (type1 === type2) {
    return type1
  }

  // Sinon 50/50 entre les deux parents
  return Math.random() < 0.5 ? type1 : type2
}

/**
 * Obtient la configuration pour un type de propulsion
 * @param {string} type - Type de propulsion
 * @returns {Object} - Configuration du type
 */
export function getPropulsionConfig(type) {
  return PROPULSION_CONFIGS[type] || PROPULSION_CONFIGS[PROPULSION_TYPES.UNDULATION]
}

/**
 * Calcule le modificateur de force basé sur le type
 * @param {string} type - Type de propulsion
 * @returns {number} - Multiplicateur de force
 */
export function getForceMultiplier(type) {
  const config = getPropulsionConfig(type)
  return config.forceMultiplier
}

/**
 * Calcule le modificateur de coût énergétique basé sur le type
 * @param {string} type - Type de propulsion
 * @returns {number} - Multiplicateur de coût énergétique
 */
export function getEnergyCostMultiplier(type) {
  const config = getPropulsionConfig(type)
  return config.energyCost
}

/**
 * Obtient la fréquence d'oscillation pour un segment selon le type
 * @param {string} type - Type de propulsion
 * @returns {number} - Fréquence d'oscillation
 */
export function getSegmentFrequency(type) {
  const config = getPropulsionConfig(type)
  const base = config.baseFrequency
  const variance = config.frequencyVariance
  return base + (Math.random() - 0.5) * 2 * variance
}

/**
 * Valide si un pattern moteur est compatible avec le type de propulsion
 * Applique des contraintes selon le type pour guider l'apprentissage
 * @param {string} type - Type de propulsion
 * @param {Array<number>} pattern - Pattern de phases à valider
 * @returns {Array<number>} - Pattern ajusté selon contraintes du type
 */
export function constrainPatternToType(type, pattern) {
  const adjusted = [...pattern]

  switch (type) {
    case PROPULSION_TYPES.OSCILLATION: {
      // Force les 70% premiers segments à être synchronisés
      const frontCount = Math.floor(pattern.length * 0.7)
      const avgFront = adjusted.slice(0, frontCount).reduce((a, b) => a + b, 0) / frontCount
      for (let i = 0; i < frontCount; i++) {
        adjusted[i] = avgFront
      }
      break
    }

    case PROPULSION_TYPES.JET: {
      // Force tous les segments à être très proches (±10%)
      const avg = adjusted.reduce((a, b) => a + b, 0) / adjusted.length
      for (let i = 0; i < adjusted.length; i++) {
        adjusted[i] = avg + (adjusted[i] - avg) * 0.1 // Réduit variance à 10%
      }
      break
    }

    case PROPULSION_TYPES.ROWING:
      // Force alternance gauche/droite
      for (let i = 0; i < adjusted.length; i++) {
        adjusted[i] = i % 2 === 0 ? 0 : Math.PI
      }
      break

    case PROPULSION_TYPES.VIBRATION: {
      // Garde petites variations autour de la moyenne
      const avgVib = adjusted.reduce((a, b) => a + b, 0) / adjusted.length
      for (let i = 0; i < adjusted.length; i++) {
        const diff = adjusted[i] - avgVib
        adjusted[i] = avgVib + Math.max(-0.5, Math.min(0.5, diff)) // Limite à ±0.5
      }
      break
    }

    case PROPULSION_TYPES.UNDULATION:
      // Pas de contrainte forte, mais encourage progression
      // (le learning peut optimiser librement)
      break
  }

  return adjusted
}

/**
 * Obtient la couleur du type de propulsion
 * @param {string} type - Type de propulsion
 * @returns {Object} - {r, g, b}
 */
export function getPropulsionColor(type) {
  const config = getPropulsionConfig(type)
  return config.color
}

/**
 * Obtient l'emoji représentant le type
 * @param {string} type - Type de propulsion
 * @returns {string} - Emoji
 */
export function getPropulsionEmoji(type) {
  const config = getPropulsionConfig(type)
  return config.emoji
}

/**
 * Obtient le nom lisible du type
 * @param {string} type - Type de propulsion
 * @returns {string} - Nom français
 */
export function getPropulsionName(type) {
  const config = getPropulsionConfig(type)
  return config.name
}
