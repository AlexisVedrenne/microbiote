/**
 * SYSTÈME DE SÉQUENCES MOTRICES - VERSION POSES
 *
 * Les créatures mémorisent des SÉQUENCES DE POSES (configurations spatiales)
 * Au lieu de contractions directes, elles définissent des positions cibles pour leurs articulations
 */

/**
 * Une séquence motrice est composée de plusieurs poses qui s'enchaînent
 * Chaque pose définit l'état cible de toutes les articulations
 */
export class MotorSequence {
  constructor(jointCount) {
    this.jointCount = jointCount
    this.poses = [] // Liste de poses qui se répètent en boucle
    this.efficiency = 0 // Score d'efficacité (distance / énergie)
    this.timesUsed = 0
  }

  /**
   * Ajoute une pose à la séquence
   * @param {number} duration - Durée pour atteindre cette pose (frames)
   * @param {Array<number>} jointContractions - Contraction cible par articulation (0-1)
   *                                            0 = angle au repos, 1 = contracté au max
   */
  addPose(duration, jointContractions) {
    this.poses.push({
      duration,
      jointContractions: [...jointContractions]
    })
  }

  /**
   * Obtient la pose actuelle selon le temps (avec interpolation)
   * @param {number} time - Temps depuis début de la séquence
   * @returns {Object} - {poseIndex, localTime, jointContractions, progress}
   */
  getPoseAt(time) {
    if (this.poses.length === 0) return null

    // Calculer durée totale du cycle
    const cycleDuration = this.poses.reduce((sum, p) => sum + p.duration, 0)
    if (cycleDuration === 0) return null

    // Position dans le cycle actuel
    const cycleTime = time % cycleDuration

    // Trouver quelle pose
    let accumulated = 0
    for (let i = 0; i < this.poses.length; i++) {
      const pose = this.poses[i]
      if (cycleTime < accumulated + pose.duration) {
        const localTime = cycleTime - accumulated
        const progress = localTime / pose.duration // 0 à 1 dans la pose

        // Interpolation vers la pose suivante
        const nextPoseIndex = (i + 1) % this.poses.length
        const currentPose = this.poses[i].jointContractions
        const nextPose = this.poses[nextPoseIndex].jointContractions

        const interpolatedContractions = []
        for (let j = 0; j < currentPose.length; j++) {
          const current = currentPose[j]
          const next = nextPose[j] || current
          // Interpolation linéaire
          interpolatedContractions.push(current + (next - current) * progress)
        }

        return {
          poseIndex: i,
          localTime,
          progress,
          jointContractions: interpolatedContractions
        }
      }
      accumulated += pose.duration
    }

    // Fallback
    return {
      poseIndex: 0,
      localTime: 0,
      progress: 0,
      jointContractions: this.poses[0].jointContractions
    }
  }

  /**
   * Clone la séquence
   */
  clone() {
    const seq = new MotorSequence(this.jointCount)
    seq.poses = this.poses.map(p => ({
      duration: p.duration,
      jointContractions: [...p.jointContractions]
    }))
    seq.efficiency = this.efficiency
    seq.timesUsed = this.timesUsed
    return seq
  }
}

/**
 * Génère une séquence aléatoire d'exploration
 * @param {number} jointCount - Nombre d'articulations
 * @returns {MotorSequence}
 */
export function generateRandomSequence(jointCount) {
  const seq = new MotorSequence(jointCount)

  // Générer 2-4 poses aléatoires
  const poseCount = 2 + Math.floor(Math.random() * 3)

  for (let i = 0; i < poseCount; i++) {
    const duration = 15 + Math.floor(Math.random() * 25) // 15-40 frames (vitesse cohérente)
    const jointContractions = []

    // Contractions aléatoires pour chaque articulation
    for (let j = 0; j < jointCount; j++) {
      jointContractions.push(Math.random())
    }

    seq.addPose(duration, jointContractions)
  }

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

  for (const pose of mutated.poses) {
    for (let i = 0; i < pose.jointContractions.length; i++) {
      if (Math.random() < mutationRate) {
        // Petite variation
        pose.jointContractions[i] += (Math.random() - 0.5) * 0.3
        pose.jointContractions[i] = Math.max(0, Math.min(1, pose.jointContractions[i]))
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
  const jointCount = Math.max(seq1.jointCount, seq2.jointCount)
  const fused = new MotorSequence(jointCount)

  // Prendre poses alternées des deux parents
  const maxPoses = Math.max(seq1.poses.length, seq2.poses.length)

  for (let i = 0; i < maxPoses; i++) {
    const useSeq1 = i % 2 === 0

    if (useSeq1 && i < seq1.poses.length) {
      const pose = seq1.poses[i]
      fused.addPose(pose.duration, pose.jointContractions)
    } else if (!useSeq1 && i < seq2.poses.length) {
      const pose = seq2.poses[i]
      fused.addPose(pose.duration, pose.jointContractions)
    }
  }

  // Garantir au moins 2 poses
  if (fused.poses.length < 2) {
    return generateRandomSequence(jointCount)
  }

  return fused
}
