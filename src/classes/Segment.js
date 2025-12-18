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

  // Traînée hydrodynamique (RÉSISTANCE au mouvement)
  applyDrag() {
    // Calculer la vélocité moyenne du segment
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

    // Direction du mouvement
    const velDirX = midVx / speed
    const velDirY = midVy / speed

    // Alignement perpendiculaire (cross product)
    const perpAlignment = Math.abs(segDirX * velDirY - segDirY * velDirX)

    // Traînée de surface (résistance proportionnelle à la surface exposée)
    const surfaceDrag = 0.15 * segLength * perpAlignment * speed

    // Force de traînée (OPPOSÉE au mouvement = ralentit)
    const dragX = -velDirX * surfaceDrag
    const dragY = -velDirY * surfaceDrag

    // Appliquer résistance aux nœuds
    this.node1.applyForce(dragX * 0.5, dragY * 0.5)
    this.node2.applyForce(dragX * 0.5, dragY * 0.5)

    // MAIS : Quand segment bouge perpendiculairement, créer propulsion
    // (comme une rame qui pousse l'eau)
    if (perpAlignment > 0.5) {
      // Direction perpendiculaire au segment
      const perpX = -segDirY
      const perpY = segDirX

      // Force de propulsion perpendiculaire au segment
      const propulsionX = perpX * perpAlignment * speed * 0.8
      const propulsionY = perpY * perpAlignment * speed * 0.8

      // Appliquer sur toute la créature (pas juste le segment)
      this.node1.applyForce(propulsionX, propulsionY)
      this.node2.applyForce(propulsionX, propulsionY)
    }
  }
}
