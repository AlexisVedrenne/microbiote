/**
 * SYSTÈME DE SÉQUENCES MOTRICES
 *
 * Au lieu de mémoriser un pattern fixe, les créatures mémorisent des SÉQUENCES
 * qui se répètent en boucle (comme une méduse : contracte → propulse → glisse → contracte)
 */

/**
 * Une séquence motrice est composée de plusieurs phases qui s'enchaînent
 * Chaque phase a une durée et des paramètres de contraction pour chaque segment
 */
export class MotorSequence {
  constructor(segmentCount) {
    this.segmentCount = segmentCount
    this.phases = [] // Liste de phases qui se répètent en boucle
    this.efficiency = 0 // Score d'efficacité (distance / énergie)
    this.timesUsed = 0
  }

  /**
   * Ajoute une phase à la séquence
   * @param {number} duration - Durée de la phase (frames)
   * @param {Array<number>} contractions - Intensité de contraction par segment (0-1)
   */
  addPhase(duration, contractions) {
    this.phases.push({
      duration,
      contractions: [...contractions]
    })
  }

  /**
   * Obtient la phase actuelle selon le temps
   * @param {number} time - Temps depuis début de la séquence
   * @returns {Object} - {phaseIndex, localTime, contractions}
   */
  getPhaseAt(time) {
    if (this.phases.length === 0) return null

    // Calculer durée totale du cycle
    const cycleDuration = this.phases.reduce((sum, p) => sum + p.duration, 0)
    if (cycleDuration === 0) return null

    // Position dans le cycle actuel
    const cycleTime = time % cycleDuration

    // Trouver quelle phase
    let accumulated = 0
    for (let i = 0; i < this.phases.length; i++) {
      const phase = this.phases[i]
      if (cycleTime < accumulated + phase.duration) {
        return {
          phaseIndex: i,
          localTime: cycleTime - accumulated,
          contractions: phase.contractions
        }
      }
      accumulated += phase.duration
    }

    // Fallback (ne devrait pas arriver)
    return {
      phaseIndex: 0,
      localTime: 0,
      contractions: this.phases[0].contractions
    }
  }

  /**
   * Clone la séquence
   */
  clone() {
    const seq = new MotorSequence(this.segmentCount)
    seq.phases = this.phases.map(p => ({
      duration: p.duration,
      contractions: [...p.contractions]
    }))
    seq.efficiency = this.efficiency
    seq.timesUsed = this.timesUsed
    return seq
  }
}

/**
 * Génère une séquence aléatoire d'exploration
 * @param {number} segmentCount - Nombre de segments
 * @returns {MotorSequence}
 */
export function generateRandomSequence(segmentCount) {
  const seq = new MotorSequence(segmentCount)

  // Générer 2-4 phases aléatoires
  const phaseCount = 2 + Math.floor(Math.random() * 3)

  for (let i = 0; i < phaseCount; i++) {
    const duration = 10 + Math.floor(Math.random() * 20) // 10-30 frames
    const contractions = []

    // Contractions aléatoires pour chaque segment
    for (let s = 0; s < segmentCount; s++) {
      contractions.push(Math.random())
    }

    seq.addPhase(duration, contractions)
  }

  return seq
}

/**
 * Génère une séquence type "impulsion" (comme méduse)
 * Contracte tous ensemble → relâche → glisse
 * @param {number} segmentCount
 * @returns {MotorSequence}
 */
export function generateImpulseSequence(segmentCount) {
  const seq = new MotorSequence(segmentCount)

  // Phase 1 : Contraction (tous contractent)
  const contractPhase = Array(segmentCount).fill(1.0)
  seq.addPhase(8, contractPhase)

  // Phase 2 : Relâchement
  const releasePhase = Array(segmentCount).fill(0.0)
  seq.addPhase(5, releasePhase)

  // Phase 3 : Glisse (inertie)
  const glidePhase = Array(segmentCount).fill(0.0)
  seq.addPhase(15, glidePhase)

  return seq
}

/**
 * Génère une séquence type "vague" (comme anguille)
 * La contraction se propage du début à la fin
 * @param {number} segmentCount
 * @returns {MotorSequence}
 */
export function generateWaveSequence(segmentCount) {
  const seq = new MotorSequence(segmentCount)

  // Créer une vague qui progresse
  const phasesCount = segmentCount * 2
  for (let i = 0; i < phasesCount; i++) {
    const contractions = []
    for (let s = 0; s < segmentCount; s++) {
      // Fonction sinusoïdale qui progresse
      const wave = Math.sin(((i + s) / phasesCount) * Math.PI * 2)
      contractions.push((wave + 1) / 2) // Normaliser 0-1
    }
    seq.addPhase(3, contractions)
  }

  return seq
}

/**
 * Génère une séquence type "battement" (comme requin)
 * Avant rigide, arrière bat fort
 * @param {number} segmentCount
 * @returns {MotorSequence}
 */
export function generateBeatSequence(segmentCount) {
  const seq = new MotorSequence(segmentCount)

  const frontCount = Math.floor(segmentCount * 0.6)

  // Phase 1 : Battement gauche
  const leftBeat = []
  for (let s = 0; s < segmentCount; s++) {
    leftBeat.push(s < frontCount ? 0.2 : 0.8)
  }
  seq.addPhase(12, leftBeat)

  // Phase 2 : Centre
  const center = Array(segmentCount).fill(0.3)
  seq.addPhase(5, center)

  // Phase 3 : Battement droite
  const rightBeat = []
  for (let s = 0; s < segmentCount; s++) {
    rightBeat.push(s < frontCount ? 0.2 : 0.8)
  }
  seq.addPhase(12, rightBeat)

  return seq
}

/**
 * Mute une séquence (petites variations aléatoires)
 * @param {MotorSequence} sequence
 * @param {number} mutationRate - Taux de mutation (0-1)
 * @returns {MotorSequence}
 */
export function mutateSequence(sequence, mutationRate = 0.1) {
  const mutated = sequence.clone()

  for (const phase of mutated.phases) {
    for (let i = 0; i < phase.contractions.length; i++) {
      if (Math.random() < mutationRate) {
        // Petite variation
        phase.contractions[i] += (Math.random() - 0.5) * 0.3
        phase.contractions[i] = Math.max(0, Math.min(1, phase.contractions[i]))
      }
    }
  }

  return mutated
}

/**
 * Fusionne deux séquences (pour reproduction)
 * @param {MotorSequence} seq1
 * @param {MotorSequence} seq2
 * @returns {MotorSequence}
 */
export function fuseSequences(seq1, seq2) {
  const segmentCount = Math.max(seq1.segmentCount, seq2.segmentCount)
  const fused = new MotorSequence(segmentCount)

  // Prendre phases alternées des deux parents
  const maxPhases = Math.max(seq1.phases.length, seq2.phases.length)

  for (let i = 0; i < maxPhases; i++) {
    const useSeq1 = i % 2 === 0

    if (useSeq1 && i < seq1.phases.length) {
      const phase = seq1.phases[i]
      fused.addPhase(phase.duration, phase.contractions)
    } else if (!useSeq1 && i < seq2.phases.length) {
      const phase = seq2.phases[i]
      fused.addPhase(phase.duration, phase.contractions)
    }
  }

  // Garantir au moins 2 phases
  if (fused.phases.length < 2) {
    return generateRandomSequence(segmentCount)
  }

  return fused
}
