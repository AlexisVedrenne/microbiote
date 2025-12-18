/**
 * JOINT (ARTICULATION)
 *
 * Représente un point central avec 2+ segments attachés
 * Permet de contracter l'angle entre les segments (comme un muscle)
 */

export class Joint {
  constructor(centralNode, segment1, segment2) {
    this.centralNode = centralNode // Le nœud au centre
    this.segment1 = segment1 // Premier segment
    this.segment2 = segment2 // Deuxième segment

    // Angle au repos (angle initial)
    this.restAngle = this.getCurrentAngle()

    // Contraction actuelle (0 = repos, 1 = contracté au max)
    this.contraction = 0

    // Force de contraction maximale
    this.maxContractionForce = 0.5

    // Angle minimal (contraction maximale) - 30° minimum
    this.minAngle = Math.PI / 6
  }

  /**
   * Calcule l'angle actuel entre les deux segments
   * @returns {number} - Angle en radians (0 à π)
   */
  getCurrentAngle() {
    // Vecteurs depuis le nœud central vers les autres nœuds
    const node1 = this.segment1.node1 === this.centralNode ? this.segment1.node2 : this.segment1.node1
    const node2 = this.segment2.node1 === this.centralNode ? this.segment2.node2 : this.segment2.node1

    const v1x = node1.x - this.centralNode.x
    const v1y = node1.y - this.centralNode.y
    const v2x = node2.x - this.centralNode.x
    const v2y = node2.y - this.centralNode.y

    // Normaliser
    const len1 = Math.sqrt(v1x * v1x + v1y * v1y)
    const len2 = Math.sqrt(v2x * v2x + v2y * v2y)

    if (len1 === 0 || len2 === 0) return 0

    const n1x = v1x / len1
    const n1y = v1y / len1
    const n2x = v2x / len2
    const n2y = v2y / len2

    // Produit scalaire pour trouver l'angle
    const dot = n1x * n2x + n1y * n2y
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)))

    return angle
  }

  /**
   * Applique la contraction musculaire sur l'articulation
   * Rapproche les deux nœuds externes (comme contracter un biceps)
   *
   * IMPORTANT : Respecte la 3ème loi de Newton (action-réaction)
   *
   * @param {number} targetContraction - Contraction cible (0-1)
   * @param {number} strength - Force musculaire globale
   * @param {number} mass - Masse de la créature (pour scaling)
   */
  applyContraction(targetContraction, strength = 1.0, mass = 1.0) {
    const currentAngle = this.getCurrentAngle()
    const targetAngle = this.restAngle - (this.restAngle - this.minAngle) * targetContraction

    // Différence d'angle
    const angleDiff = currentAngle - targetAngle

    // Pas besoin de contracter si proche
    if (Math.abs(angleDiff) < 0.01) return

    // Force proportionnelle à la différence d'angle et à la masse
    const forceMagnitude = angleDiff * this.maxContractionForce * strength * mass * 0.1

    // Obtenir les nœuds externes
    const node1 = this.segment1.node1 === this.centralNode ? this.segment1.node2 : this.segment1.node1
    const node2 = this.segment2.node1 === this.centralNode ? this.segment2.node2 : this.segment2.node1

    // Vecteurs depuis le centre
    const v1x = node1.x - this.centralNode.x
    const v1y = node1.y - this.centralNode.y
    const v2x = node2.x - this.centralNode.x
    const v2y = node2.y - this.centralNode.y

    const len1 = Math.sqrt(v1x * v1x + v1y * v1y)
    const len2 = Math.sqrt(v2x * v2x + v2y * v2y)

    if (len1 === 0 || len2 === 0) return

    // Normaliser
    const n1x = v1x / len1
    const n1y = v1y / len1
    const n2x = v2x / len2
    const n2y = v2y / len2

    // Direction de la force : perpendiculaire à chaque vecteur, vers l'autre
    // Pour rapprocher node1 vers node2
    const perp1x = -n1y
    const perp1y = n1x

    // Pour rapprocher node2 vers node1
    const perp2x = -n2y
    const perp2y = n2x

    // Déterminer le sens (rapprocher ou éloigner)
    const sign = angleDiff > 0 ? 1 : -1

    // Appliquer forces sur les nœuds externes
    node1.applyForce(perp1x * forceMagnitude * sign, perp1y * forceMagnitude * sign)
    node2.applyForce(-perp2x * forceMagnitude * sign, -perp2y * forceMagnitude * sign)

    // ACTION-RÉACTION : Force opposée sur le nœud central
    // La somme des forces doit être nulle (conservation du moment)
    this.centralNode.applyForce(
      -(perp1x * forceMagnitude * sign - perp2x * forceMagnitude * sign),
      -(perp1y * forceMagnitude * sign - perp2y * forceMagnitude * sign)
    )
  }
}

/**
 * Détecte toutes les articulations dans une créature
 * @param {Array} nodes - Liste des nœuds
 * @param {Array} segments - Liste des segments
 * @returns {Array<Joint>} - Liste des articulations détectées
 */
export function detectJoints(nodes, segments) {
  const joints = []

  // Pour chaque nœud, vérifier s'il a 2+ segments attachés
  for (const node of nodes) {
    const attachedSegments = segments.filter(seg => seg.node1 === node || seg.node2 === node)

    // Si 2+ segments attachés, créer des joints pour chaque paire
    if (attachedSegments.length >= 2) {
      for (let i = 0; i < attachedSegments.length - 1; i++) {
        for (let j = i + 1; j < attachedSegments.length; j++) {
          const joint = new Joint(node, attachedSegments[i], attachedSegments[j])
          joints.push(joint)
        }
      }
    }
  }

  return joints
}
