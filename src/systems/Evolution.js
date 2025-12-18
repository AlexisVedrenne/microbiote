import { DEATH_CAUSES, MAX_DEATH_HISTORY } from 'src/utils/Constants'

export class EvolutionMemory {
  constructor() {
    this.deathHistory = []
  }

  recordDeath(creature, cause) {
    const deathRecord = {
      cause: cause,
      genes: {
        muscleStrength: creature.genes.muscleStrength,
        metabolicEfficiency: creature.genes.metabolicEfficiency,
        maxEnergyBonus: creature.genes.maxEnergyBonus
      },
      structure: {
        nodeCount: creature.nodes.length,
        segmentCount: creature.segments.length
      },
      stats: {
        foodEaten: creature.stats.foodEaten,
        survivalTime: creature.stats.survivalTime,
        reproductions: creature.stats.reproductions
      },
      mass: creature.mass
    }

    this.deathHistory.push(deathRecord)

    if (this.deathHistory.length > MAX_DEATH_HISTORY) {
      this.deathHistory.shift()
    }
  }

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
      const avgSegments = starvationDeaths.reduce((sum, d) => sum + d.structure.segmentCount, 0) / starvationDeaths.length
      const avgSpeed = starvationDeaths.reduce((sum, d) => sum + d.genes.muscleStrength, 0) / starvationDeaths.length

      if (avgSegments > 6) analysis.avoidManySegments = true
      if (avgSpeed < 0.25) analysis.avoidLowSpeed = true
    }

    // Analyser cannibalisme
    const cannibalismDeaths = this.deathHistory.filter((d) => d.cause === DEATH_CAUSES.CANNIBALISM)
    if (cannibalismDeaths.length >= 3) {
      const avgMass = cannibalismDeaths.reduce((sum, d) => sum + d.mass, 0) / cannibalismDeaths.length

      if (avgMass < 8) analysis.avoidSmallSize = true
    }

    // Analyser vieillesse
    const oldAgeDeaths = this.deathHistory.filter((d) => d.cause === DEATH_CAUSES.OLD_AGE)
    if (oldAgeDeaths.length >= 3) {
      const avgSegments = oldAgeDeaths.reduce((sum, d) => sum + d.structure.segmentCount, 0) / oldAgeDeaths.length

      if (avgSegments < 4) {
        analysis.avoidManySegments = true
      } else if (avgSegments > 6) {
        analysis.avoidFewSegments = true
      }
    }

    return analysis
  }
}
