/**
 * SYSTÈME D'ANALYSE COMPORTEMENTALE
 *
 * Analyse comment une créature se déplace naturellement et détermine
 * quel type de propulsion correspond le mieux à son comportement
 */

import { PROPULSION_TYPES } from 'src/utils/Constants'

/**
 * Analyse les séquences utilisées par une créature
 * et détermine le type de propulsion qui correspond le mieux
 *
 * @param {Object} behaviorData - Données comportementales collectées
 * @returns {string|null} - Type de propulsion détecté (ou null si pas assez de données)
 */
export function detectPropulsionType(behaviorData) {
  const {
    avgSynchronization, // Synchronisation des segments (0-1)
    avgWaveProgression, // Progression en vague (0-1)
    avgImpulsiveness, // Caractère impulsif (0-1)
    avgSymmetry, // Symétrie gauche/droite (0-1)
    avgContinuity, // Continuité du mouvement (0-1)
    segmentCount
  } = behaviorData

  // Pas assez de données
  if (avgSynchronization === undefined) return null

  // Score pour chaque type
  const scores = {}

  // JET : Haute synchronisation + Impulsif + Peu continu
  scores[PROPULSION_TYPES.JET] =
    avgSynchronization * 2.0 +
    avgImpulsiveness * 1.5 +
    (1 - avgContinuity) * 1.0

  // UNDULATION : Forte progression en vague + Peu synchronisé + Très continu
  scores[PROPULSION_TYPES.UNDULATION] =
    avgWaveProgression * 2.0 +
    (1 - avgSynchronization) * 1.5 +
    avgContinuity * 1.5

  // OSCILLATION : Faible symétrie + Continue + Segments longs
  const elongationScore = segmentCount > 4 ? 1.0 : 0.5
  scores[PROPULSION_TYPES.OSCILLATION] =
    (1 - avgSymmetry) * 1.5 +
    avgContinuity * 1.0 +
    elongationScore * 1.0

  // ROWING : Haute symétrie + Synchronisation modérée
  scores[PROPULSION_TYPES.ROWING] =
    avgSymmetry * 2.0 +
    avgSynchronization * 0.8 +
    (1 - avgImpulsiveness) * 0.5

  // VIBRATION : Peu impulsif + Peu de progression + Haute fréquence
  const compactScore = segmentCount < 5 ? 1.0 : 0.5
  scores[PROPULSION_TYPES.VIBRATION] =
    (1 - avgImpulsiveness) * 1.5 +
    (1 - avgWaveProgression) * 1.0 +
    compactScore * 1.5

  // Trouver le type avec le score le plus élevé
  let bestType = null
  let bestScore = 0

  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestType = type
    }
  }

  // Seuil minimum pour déterminer le type
  const MIN_SCORE_THRESHOLD = 2.0
  if (bestScore < MIN_SCORE_THRESHOLD) {
    return null // Pas assez confiant
  }

  return bestType
}

/**
 * Analyse une séquence motrice et extrait ses caractéristiques
 * @param {MotorSequence} sequence - Séquence à analyser
 * @returns {Object} - Caractéristiques extraites
 */
export function analyzeSequenceCharacteristics(sequence) {
  if (!sequence || sequence.phases.length === 0) {
    return null
  }

  let totalSynchronization = 0
  let totalWaveProgression = 0
  let totalImpulsiveness = 0
  let totalSymmetry = 0
  let totalContinuity = 0
  let sampleCount = 0

  // Analyser chaque phase
  for (let i = 0; i < sequence.phases.length; i++) {
    const phase = sequence.phases[i]
    const contractions = phase.contractions

    // SYNCHRONISATION : Variance des contractions (faible variance = haute sync)
    const avg = contractions.reduce((a, b) => a + b, 0) / contractions.length
    const variance = contractions.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / contractions.length
    const synchronization = 1.0 - Math.min(1.0, variance * 4) // Normaliser

    // PROGRESSION EN VAGUE : Corrélation entre index et valeur
    let waveScore = 0
    for (let j = 0; j < contractions.length - 1; j++) {
      const diff = Math.abs(contractions[j + 1] - contractions[j])
      waveScore += diff
    }
    waveScore /= contractions.length
    const waveProgression = Math.min(1.0, waveScore * 2)

    // IMPULSIVITÉ : Changement brusque entre phases
    let impulsiveness = 0
    if (i > 0) {
      const prevPhase = sequence.phases[i - 1]
      for (let j = 0; j < Math.min(contractions.length, prevPhase.contractions.length); j++) {
        impulsiveness += Math.abs(contractions[j] - prevPhase.contractions[j])
      }
      impulsiveness /= Math.min(contractions.length, prevPhase.contractions.length)
    }

    // SYMÉTRIE : Comparaison gauche vs droite (segments pairs vs impairs)
    let leftSum = 0
    let rightSum = 0
    let leftCount = 0
    let rightCount = 0
    for (let j = 0; j < contractions.length; j++) {
      if (j % 2 === 0) {
        leftSum += contractions[j]
        leftCount++
      } else {
        rightSum += contractions[j]
        rightCount++
      }
    }
    const leftAvg = leftCount > 0 ? leftSum / leftCount : 0
    const rightAvg = rightCount > 0 ? rightSum / rightCount : 0
    const symmetry = 1.0 - Math.min(1.0, Math.abs(leftAvg - rightAvg) * 2)

    // CONTINUITÉ : Durée de la phase (longue = continue)
    const continuity = Math.min(1.0, phase.duration / 30)

    totalSynchronization += synchronization
    totalWaveProgression += waveProgression
    totalImpulsiveness += impulsiveness
    totalSymmetry += symmetry
    totalContinuity += continuity
    sampleCount++
  }

  if (sampleCount === 0) return null

  return {
    avgSynchronization: totalSynchronization / sampleCount,
    avgWaveProgression: totalWaveProgression / sampleCount,
    avgImpulsiveness: totalImpulsiveness / sampleCount,
    avgSymmetry: totalSymmetry / sampleCount,
    avgContinuity: totalContinuity / sampleCount,
    segmentCount: sequence.segmentCount
  }
}

/**
 * Détermine si une créature a assez d'expérience pour détecter son type
 * @param {Object} motorMemory - Mémoire motrice de la créature
 * @returns {boolean}
 */
export function hasEnoughDataForDetection(motorMemory) {
  // Besoin d'au moins 5 séquences testées avec au moins 50 samples chacune
  const validSequences = motorMemory.sequences.filter(s => s.timesUsed >= 3)
  return validSequences.length >= 5
}

/**
 * Analyse toutes les séquences d'une créature et détermine son type
 * @param {Object} motorMemory - Mémoire motrice
 * @returns {string|null} - Type détecté
 */
export function analyzeCreatureBehavior(motorMemory) {
  if (!hasEnoughDataForDetection(motorMemory)) {
    return null
  }

  // Analyser toutes les séquences
  const allCharacteristics = []

  for (const seq of motorMemory.sequences) {
    const chars = analyzeSequenceCharacteristics(seq)
    if (chars) {
      allCharacteristics.push(chars)
    }
  }

  if (allCharacteristics.length === 0) return null

  // Moyenne des caractéristiques
  const avgBehavior = {
    avgSynchronization: 0,
    avgWaveProgression: 0,
    avgImpulsiveness: 0,
    avgSymmetry: 0,
    avgContinuity: 0,
    segmentCount: motorMemory.sequences[0].segmentCount
  }

  for (const chars of allCharacteristics) {
    avgBehavior.avgSynchronization += chars.avgSynchronization
    avgBehavior.avgWaveProgression += chars.avgWaveProgression
    avgBehavior.avgImpulsiveness += chars.avgImpulsiveness
    avgBehavior.avgSymmetry += chars.avgSymmetry
    avgBehavior.avgContinuity += chars.avgContinuity
  }

  const count = allCharacteristics.length
  avgBehavior.avgSynchronization /= count
  avgBehavior.avgWaveProgression /= count
  avgBehavior.avgImpulsiveness /= count
  avgBehavior.avgSymmetry /= count
  avgBehavior.avgContinuity /= count

  return detectPropulsionType(avgBehavior)
}
