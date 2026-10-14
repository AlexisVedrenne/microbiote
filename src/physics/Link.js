/**
 * Link.js - Lien élastique entre deux points
 * 
 * Maintient une distance cible entre deux nodes.
 * Si la distance réelle ≠ distance cible → applique des forces correctives.
 * 
 * Principe : ressort (loi de Hooke) avec amortissement
 */

// Limites pour stabilité
const MAX_STRETCH = 1.2  // Le lien ne peut pas s'étirer à plus de 1.2x sa longueur
const MIN_LENGTH = 5     // Longueur minimum pour éviter division par zéro

export class Link {
  constructor(nodeA, nodeB, targetLength = null) {
    this.nodeA = nodeA
    this.nodeB = nodeB
    
    // Si pas de longueur cible, on prend la distance actuelle
    if (targetLength === null) {
      this.targetLength = Math.max(MIN_LENGTH, this.getLength())
    } else {
      this.targetLength = Math.max(MIN_LENGTH, targetLength)
    }
    
    // Constante de ressort (rigidité du lien) - haute pour éviter l'étirement
    this.stiffness = 0.8
    
    // Amortissement (damping) pour éviter les oscillations
    this.damping = 0.2
  }

  /**
   * Calcule la distance actuelle entre les deux nodes
   * @returns {number}
   */
  getLength() {
    const dx = this.nodeB.x - this.nodeA.x
    const dy = this.nodeB.y - this.nodeA.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Calcule et retourne le vecteur direction (A → B) normalisé
   * @returns {{x: number, y: number, length: number}}
   */
  getDirection() {
    const dx = this.nodeB.x - this.nodeA.x
    const dy = this.nodeB.y - this.nodeA.y
    const length = Math.sqrt(dx * dx + dy * dy)
    
    if (length < 0.001) {
      return { x: 1, y: 0, length: 0 }
    }
    
    return {
      x: dx / length,
      y: dy / length,
      length: length
    }
  }

  /**
   * Calcule le point milieu du lien
   * @returns {{x: number, y: number}}
   */
  getCenter() {
    return {
      x: (this.nodeA.x + this.nodeB.x) / 2,
      y: (this.nodeA.y + this.nodeB.y) / 2
    }
  }

  /**
   * Calcule la vitesse moyenne du lien (pour physique de l'eau)
   * @returns {{vx: number, vy: number}}
   */
  getAverageVelocity() {
    return {
      vx: (this.nodeA.vx + this.nodeB.vx) / 2,
      vy: (this.nodeA.vy + this.nodeB.vy) / 2
    }
  }

  /**
   * Applique les forces élastiques pour maintenir la distance cible
   * Inclut un amortissement pour la stabilité
   */
  applyElasticForce() {
    const dir = this.getDirection()
    let currentLength = dir.length
    
    if (currentLength < 0.001) return
    
    // Limiter l'étirement maximum
    const maxLength = this.targetLength * MAX_STRETCH
    if (currentLength > maxLength) {
      // Téléporter les points pour éviter l'explosion
      const excess = currentLength - maxLength
      const correction = excess / 2
      this.nodeA.x += dir.x * correction
      this.nodeA.y += dir.y * correction
      this.nodeB.x -= dir.x * correction
      this.nodeB.y -= dir.y * correction
      currentLength = maxLength
    }
    
    // Différence par rapport à la cible
    const delta = currentLength - this.targetLength
    
    // Force proportionnelle à la différence (loi de Hooke)
    const springForce = delta * this.stiffness
    
    // Amortissement basé sur la vitesse relative
    const relVelX = this.nodeB.vx - this.nodeA.vx
    const relVelY = this.nodeB.vy - this.nodeA.vy
    const relVelAlongLink = relVelX * dir.x + relVelY * dir.y
    const dampingForce = relVelAlongLink * this.damping
    
    // Force totale
    const totalForce = springForce + dampingForce
    
    // Appliquer les forces
    const forceX = dir.x * totalForce
    const forceY = dir.y * totalForce
    
    // Newton III : action = réaction
    this.nodeA.applyForce(forceX, forceY)
    this.nodeB.applyForce(-forceX, -forceY)
  }

  /**
   * Obtient l'angle du lien par rapport à l'horizontale (en radians)
   * @returns {number}
   */
  getAngle() {
    const dx = this.nodeB.x - this.nodeA.x
    const dy = this.nodeB.y - this.nodeA.y
    return Math.atan2(dy, dx)
  }
}
