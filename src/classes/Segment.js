export class Segment {
  constructor(node1, node2, strength, phase, frequency) {
    this.node1 = node1
    this.node2 = node2
    this.restLength = this.getLength()
    this.strength = strength
    this.phase = phase
    this.frequency = frequency
  }

  getLength() {
    const dx = this.node2.x - this.node1.x
    const dy = this.node2.y - this.node1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Applique une force basée sur la contraction musculaire (0-1)
   * NOUVEAU SYSTÈME : Physique à impulsion
   * @param {number} contractionIntensity - Intensité de contraction (0-1)
   * @param {number} muscleStrength - Force musculaire globale
   * @param {number} forceMultiplier - Multiplicateur de force
   * @param {string} propulsionType - Type de propulsion (optionnel, pour orientation)
   */
  applyImpulseForce(contractionIntensity, muscleStrength = 1, forceMultiplier = 2.5, propulsionType = null) {
    // Direction du segment
    const dx = this.node2.x - this.node1.x
    const dy = this.node2.y - this.node1.y
    const currentLength = Math.sqrt(dx * dx + dy * dy)

    if (currentLength === 0) return

    const ny = dy / currentLength
    const nx = dx / currentLength

    // Direction perpendiculaire
    const perpX = -ny
    const perpY = nx

    // Force basée sur l'intensité de contraction
    const force = contractionIntensity * muscleStrength * forceMultiplier

    // Si pas de type défini, utiliser force perpendiculaire par défaut
    if (!propulsionType) {
      this.node1.applyForce(perpX * force, perpY * force)
      this.node2.applyForce(-perpX * force, -perpY * force)
      return
    }

    // PHYSIQUE DIFFÉRENTE SELON LE TYPE
    switch (propulsionType) {
      case 'UNDULATION': {
        // ONDULATION : Pousse dans la direction du segment (vague progressive)
        const pushForce = force * 0.8
        this.node1.applyForce(-nx * pushForce, -ny * pushForce)
        this.node2.applyForce(nx * pushForce, ny * pushForce)
        break
      }

      case 'OSCILLATION': {
        // OSCILLATION : Battement latéral fort
        this.node1.applyForce(perpX * force, perpY * force)
        this.node2.applyForce(-perpX * force, -perpY * force)
        break
      }

      case 'JET': {
        // JET : Expulsion radiale (comme méduse)
        const jetForce = force * 1.2
        this.node1.applyForce(-perpX * jetForce, -perpY * jetForce)
        this.node2.applyForce(perpX * jetForce, perpY * jetForce)
        break
      }

      case 'ROWING': {
        // RAMES : Alternance gauche/droite
        this.node1.applyForce(perpX * force, perpY * force)
        this.node2.applyForce(-perpX * force, -perpY * force)
        break
      }

      case 'VIBRATION': {
        // VIBRATION : Petits mouvements rapides
        const vibForce = force * 0.6
        this.node1.applyForce(perpX * vibForce, perpY * vibForce)
        this.node2.applyForce(-perpX * vibForce, -perpY * vibForce)
        break
      }

      default: {
        // Par défaut : perpendiculaire
        this.node1.applyForce(perpX * force, perpY * force)
        this.node2.applyForce(-perpX * force, -perpY * force)
      }
    }
  }

  // CONTRAINTE RIGIDE : Force le segment à garder exactement sa longueur
  enforceConstraint() {
    const dx = this.node2.x - this.node1.x
    const dy = this.node2.y - this.node1.y
    const currentLength = Math.sqrt(dx * dx + dy * dy)

    if (currentLength < 0.1) return

    // Différence entre longueur actuelle et longueur de repos
    const difference = currentLength - this.restLength
    const percent = difference / currentLength / 2

    const offsetX = dx * percent
    const offsetY = dy * percent

    // Corriger les positions directement pour maintenir la distance
    this.node1.x += offsetX
    this.node1.y += offsetY
    this.node2.x -= offsetX
    this.node2.y -= offsetY
  }

  /**
   * NOUVELLE RÉSISTANCE DE L'EAU (Lois de Newton)
   *
   * Principe : L'eau est immobile. Si un membre pousse l'eau dans une direction,
   * on applique une force OPPOSÉE sur le membre (3ème loi Newton - action/réaction)
   */
  applyWaterResistance() {
    // Vélocité moyenne du segment
    const midVx = (this.node1.vx + this.node2.vx) / 2
    const midVy = (this.node1.vy + this.node2.vy) / 2
    const speed = Math.sqrt(midVx * midVx + midVy * midVy)

    if (speed < 0.01) return

    // Direction du segment
    const dx = this.node2.x - this.node1.x
    const dy = this.node2.y - this.node1.y
    const segLength = Math.sqrt(dx * dx + dy * dy)

    if (segLength < 0.1) return

    const segDirX = dx / segLength
    const segDirY = dy / segLength

    // Direction du mouvement (normalisée)
    const velDirX = midVx / speed
    const velDirY = midVy / speed

    // Décomposer vitesse en composantes parallèle et perpendiculaire au segment
    const dotProduct = velDirX * segDirX + velDirY * segDirY
    const parallelVx = segDirX * dotProduct
    const parallelVy = segDirY * dotProduct
    const perpVx = velDirX - parallelVx
    const perpVy = velDirY - parallelVy

    const perpSpeed = Math.sqrt(perpVx * perpVx + perpVy * perpVy)

    // RÉSISTANCE DE L'EAU : Proportionnelle au carré de la vitesse
    // et à la surface exposée (longueur × vitesse perpendiculaire)
    const waterDensity = 0.02 // Constante de densité de l'eau
    const surfaceArea = segLength * perpSpeed

    // Force de résistance (proportionnelle à vitesse²)
    const dragMagnitude = waterDensity * surfaceArea * speed

    // Force OPPOSÉE au mouvement (3ème loi Newton)
    const dragX = -velDirX * dragMagnitude
    const dragY = -velDirY * dragMagnitude

    // Appliquer résistance aux deux nœuds (action-réaction)
    this.node1.applyForce(dragX * 0.5, dragY * 0.5)
    this.node2.applyForce(dragX * 0.5, dragY * 0.5)
  }
}

/**
 * DÉTECTION ET TRAITEMENT DES GROUPES DE SEGMENTS (NAGEOIRES)
 *
 * Quand 2+ segments sont attachés au même nœud avec un angle faible,
 * ils fonctionnent comme une nageoire et on calcule le volume d'eau déplacé
 */
export function applyGroupedWaterResistance(segments, nodes) {
  const ANGLE_THRESHOLD = Math.PI / 6 // 30° - seuil pour considérer segments groupés
  const processedSegments = new Set()

  // Pour chaque nœud
  for (const node of nodes) {
    // Trouver segments attachés à ce nœud
    const attachedSegments = segments.filter(seg =>
      (seg.node1 === node || seg.node2 === node) && !processedSegments.has(seg)
    )

    if (attachedSegments.length < 2) continue

    // Vérifier les paires de segments
    for (let i = 0; i < attachedSegments.length - 1; i++) {
      for (let j = i + 1; j < attachedSegments.length; j++) {
        const seg1 = attachedSegments[i]
        const seg2 = attachedSegments[j]

        // Calculer angle entre les deux segments
        const angle = getAngleBetweenSegments(seg1, seg2, node)

        if (angle < ANGLE_THRESHOLD) {
          // SEGMENTS GROUPÉS : Traiter comme une nageoire
          applyFinResistance(seg1, seg2, node)

          processedSegments.add(seg1)
          processedSegments.add(seg2)
        }
      }
    }
  }

  // Appliquer résistance normale aux segments non groupés
  for (const seg of segments) {
    if (!processedSegments.has(seg)) {
      seg.applyWaterResistance()
    }
  }
}

/**
 * Calcule l'angle entre deux segments partageant un nœud
 */
function getAngleBetweenSegments(seg1, seg2, sharedNode) {
  // Obtenir l'autre nœud de chaque segment
  const node1 = seg1.node1 === sharedNode ? seg1.node2 : seg1.node1
  const node2 = seg2.node1 === sharedNode ? seg2.node2 : seg2.node1

  // Vecteurs depuis le nœud partagé
  const v1x = node1.x - sharedNode.x
  const v1y = node1.y - sharedNode.y
  const v2x = node2.x - sharedNode.x
  const v2y = node2.y - sharedNode.y

  const len1 = Math.sqrt(v1x * v1x + v1y * v1y)
  const len2 = Math.sqrt(v2x * v2x + v2y * v2y)

  if (len1 === 0 || len2 === 0) return Math.PI

  // Produit scalaire normalisé
  const dot = (v1x * v2x + v1y * v2y) / (len1 * len2)
  return Math.acos(Math.max(-1, Math.min(1, dot)))
}

/**
 * Applique résistance de l'eau pour une "nageoire" (2 segments groupés)
 *
 * PRINCIPE : Volume d'eau déplacé × vitesse d'expulsion = force de réaction
 */
function applyFinResistance(seg1, seg2, sharedNode) {
  // Vitesse moyenne de la nageoire (moyenne des 3 nœuds)
  const node1 = seg1.node1 === sharedNode ? seg1.node2 : seg1.node1
  const node2 = seg2.node1 === sharedNode ? seg2.node2 : seg2.node1

  const avgVx = (sharedNode.vx + node1.vx + node2.vx) / 3
  const avgVy = (sharedNode.vy + node1.vy + node2.vy) / 3
  const speed = Math.sqrt(avgVx * avgVx + avgVy * avgVy)

  if (speed < 0.01) return

  // VOLUME DÉPLACÉ : Approximation avec surface du triangle formé
  const area = calculateTriangleArea(sharedNode, node1, node2)

  // VITESSE D'EXPULSION : Vitesse de fermeture/ouverture de la nageoire
  const closingSpeed = calculateClosingSpeed(seg1, seg2, sharedNode)

  // FORCE DE RÉACTION : Volume × vitesse × densité eau
  const waterDensity = 0.05 // Plus élevé car effet nageoire
  const forceMagnitude = area * Math.abs(closingSpeed) * speed * waterDensity

  // Direction : OPPOSÉE au mouvement (3ème loi Newton)
  const forceX = -(avgVx / speed) * forceMagnitude
  const forceY = -(avgVy / speed) * forceMagnitude

  // Répartir force sur les 3 nœuds
  sharedNode.applyForce(forceX * 0.5, forceY * 0.5)
  node1.applyForce(forceX * 0.25, forceY * 0.25)
  node2.applyForce(forceX * 0.25, forceY * 0.25)
}

/**
 * Calcule l'aire du triangle formé par 3 nœuds
 */
function calculateTriangleArea(n1, n2, n3) {
  const v1x = n2.x - n1.x
  const v1y = n2.y - n1.y
  const v2x = n3.x - n1.x
  const v2y = n3.y - n1.y

  // Cross product / 2
  return Math.abs(v1x * v2y - v1y * v2x) * 0.5
}

/**
 * Calcule la vitesse de fermeture/ouverture de la nageoire
 */
function calculateClosingSpeed(seg1, seg2, sharedNode) {
  const node1 = seg1.node1 === sharedNode ? seg1.node2 : seg1.node1
  const node2 = seg2.node1 === sharedNode ? seg2.node2 : seg2.node1

  // Vitesse relative des deux extrémités l'une vers l'autre
  const relVx = node1.vx - node2.vx
  const relVy = node1.vy - node2.vy

  // Direction entre les deux extrémités
  const dx = node2.x - node1.x
  const dy = node2.y - node1.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist < 0.1) return 0

  // Projection de la vitesse relative sur la direction
  return (relVx * dx + relVy * dy) / dist
}
