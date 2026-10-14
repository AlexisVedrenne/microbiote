import { DEATH_CAUSES, MAX_DEATH_HISTORY } from 'src/utils/Constants'

export class EvolutionMemory {
  constructor() {
    this.deathHistory = []
    this.currentGenerationDeaths = [] // Morts de la génération en cours
  }

  /**
   * Enregistre la mort d'une créature
   */
  recordDeath(creature, cause) {
    // Calculer le score d'efficacité
    const efficiency = this.calculateEfficiency(creature)
    
    const deathRecord = {
      cause: cause,
      efficiency: efficiency,
      // Gènes complets pour reproduction
      genes: creature.getGenes(),
      // Stats pour analyse
      stats: {
        foodEaten: creature.stats.foodEaten,
        survivalTime: creature.stats.survivalTime,
        reproductions: creature.stats.reproductions,
        distanceTraveled: creature.stats.distanceTraveled,
        energyLost: creature.stats.energyLost
      },
      mass: creature.mass,
      nodeCount: creature.nodes.length,
      linkCount: creature.links.length,
      articulationCount: creature.articulations?.length || 0
    }

    this.deathHistory.push(deathRecord)
    this.currentGenerationDeaths.push(deathRecord)

    if (this.deathHistory.length > MAX_DEATH_HISTORY) {
      this.deathHistory.shift()
    }
  }

  /**
   * Calcule le score d'efficacité d'une créature
   * PRIORITÉ : les créatures qui BOUGENT sont favorisées
   */
  calculateEfficiency(creature) {
    const stats = creature.stats
    
    let score = 0
    
    // === MOUVEMENT (très important pour l'évolution) ===
    // Distance parcourue = capacité à se déplacer
    score += stats.distanceTraveled * 2
    
    // Vitesse moyenne = efficacité du mouvement
    if (stats.speedSamples > 0) {
      const avgSpeed = stats.totalSpeed / stats.speedSamples
      score += avgSpeed * 100
    }
    
    // === SURVIE ===
    // Nourriture mangée = capacité à trouver des ressources
    score += stats.foodEaten * 30
    
    // Temps de survie
    score += stats.survivalTime * 0.3
    
    // === REPRODUCTION ===
    score += stats.reproductions * 150
    
    // === EFFICACITÉ ÉNERGÉTIQUE ===
    // Bonus si la créature bouge beaucoup sans trop dépenser
    if (stats.energyLost > 10 && stats.distanceTraveled > 0) {
      const efficiency = stats.distanceTraveled / stats.energyLost
      score += efficiency * 50
    }
    
    return score
  }

  /**
   * Retourne les N meilleures créatures mortes cette génération
   * @param {number} count - Nombre de créatures à retourner
   * @returns {Array} - Gènes des meilleures créatures
   */
  getBestDeadCreatures(count = 5) {
    if (this.currentGenerationDeaths.length === 0) {
      return []
    }
    
    // Trier par efficacité décroissante
    const sorted = [...this.currentGenerationDeaths].sort((a, b) => b.efficiency - a.efficiency)
    
    // Retourner les meilleurs gènes
    return sorted.slice(0, count).map(d => d.genes)
  }

  /**
   * Retourne les meilleures créatures de tout l'historique
   */
  getBestFromHistory(count = 10) {
    if (this.deathHistory.length === 0) {
      return []
    }
    
    const sorted = [...this.deathHistory].sort((a, b) => b.efficiency - a.efficiency)
    return sorted.slice(0, count).map(d => d.genes)
  }

  /**
   * Reset des morts de la génération (appelé au changement de génération)
   */
  newGeneration() {
    this.currentGenerationDeaths = []
  }

  /**
   * Analyse les patterns de mort pour éviter les erreurs
   */
  analyzeDeathPatterns() {
    if (this.deathHistory.length < 10) return null

    const analysis = {
      avoidLargeSize: false,
      avoidSmallSize: false,
      avoidHighSpeed: false,
      avoidLowSpeed: false,
      avoidManySegments: false,
      avoidFewSegments: false
    }

    // Analyser les morts de faim
    const starvationDeaths = this.deathHistory.filter((d) => d.cause === DEATH_CAUSES.STARVATION)
    if (starvationDeaths.length >= 5) {
      const avgSegments = starvationDeaths.reduce((sum, d) => sum + d.linkCount, 0) / starvationDeaths.length
      const avgStrength = starvationDeaths.reduce((sum, d) => sum + (d.genes?.muscleStrength || 0.3), 0) / starvationDeaths.length

      if (avgSegments > 6) analysis.avoidManySegments = true
      if (avgStrength < 0.25) analysis.avoidLowSpeed = true
    }

    // Analyser cannibalisme
    const cannibalismDeaths = this.deathHistory.filter((d) => d.cause === DEATH_CAUSES.CANNIBALISM)
    if (cannibalismDeaths.length >= 3) {
      const avgMass = cannibalismDeaths.reduce((sum, d) => sum + d.mass, 0) / cannibalismDeaths.length

      if (avgMass < 6) analysis.avoidSmallSize = true
    }

    // Analyser vieillesse (les créatures qui meurent vieilles sont efficaces!)
    const oldAgeDeaths = this.deathHistory.filter((d) => d.cause === DEATH_CAUSES.OLD_AGE)
    if (oldAgeDeaths.length >= 3) {
      const avgSegments = oldAgeDeaths.reduce((sum, d) => sum + d.linkCount, 0) / oldAgeDeaths.length

      if (avgSegments < 4) {
        analysis.avoidManySegments = true
      } else if (avgSegments > 6) {
        analysis.avoidFewSegments = true
      }
    }

    return analysis
  }
}
