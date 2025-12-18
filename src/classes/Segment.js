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

  applyForces(time, muscleStrength = 1) {
    // Contraction musculaire (oscillation)
    const contraction = Math.sin(time * this.frequency + this.phase) * this.strength * muscleStrength

    // Direction du segment
    const dx = this.node2.x - this.node1.x
    const dy = this.node2.y - this.node1.y
    const currentLength = Math.sqrt(dx * dx + dy * dy)

    if (currentLength === 0) return

    const ny = dy / currentLength
    const nx = dx / currentLength

    // PROPULSION : Mouvement perpendiculaire UNIQUEMENT (comme battre des nageoires)
    const perpX = -ny
    const perpY = nx

    // Force de battement
    const beatForce = contraction * 2.5
    this.node1.applyForce(perpX * beatForce, perpY * beatForce)
    this.node2.applyForce(-perpX * beatForce, -perpY * beatForce)
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
