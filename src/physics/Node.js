/**
 * Node.js - Point/Articulation
 * 
 * Un point dans l'espace avec :
 * - Position (x, y)
 * - Vitesse (vx, vy)
 * 
 * Les forces sont accumulées puis appliquées à la vitesse.
 * La vitesse est ensuite appliquée à la position.
 */

// Limites pour éviter l'explosion numérique
const MAX_FORCE = 3.0      // Force max par frame
const MAX_VELOCITY = 5.0   // Vitesse max

export class Node {
  constructor(x, y) {
    // Position
    this.x = x
    this.y = y
    
    // Vitesse
    this.vx = 0
    this.vy = 0
    
    // Accumulateur de forces (remis à zéro chaque frame)
    this.fx = 0
    this.fy = 0
  }

  /**
   * Ajoute une force au point (sera appliquée lors de l'update)
   * @param {number} fx - Force en X
   * @param {number} fy - Force en Y
   */
  applyForce(fx, fy) {
    // Ignorer les NaN
    if (isNaN(fx) || isNaN(fy)) return
    
    this.fx += fx
    this.fy += fy
  }

  /**
   * Met à jour la physique du point
   * Appelé une fois par pas de temps (50 fps)
   * 
   * 1. Limiter les forces
   * 2. Force → Vitesse
   * 3. Limiter la vitesse
   * 4. Vitesse → Position
   * 5. Reset des forces
   */
  update() {
    // Limiter la force totale
    const forceMag = Math.sqrt(this.fx * this.fx + this.fy * this.fy)
    if (forceMag > MAX_FORCE) {
      this.fx = (this.fx / forceMag) * MAX_FORCE
      this.fy = (this.fy / forceMag) * MAX_FORCE
    }
    
    // Appliquer les forces à la vitesse
    this.vx += this.fx
    this.vy += this.fy
    
    // Limiter la vitesse
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    if (speed > MAX_VELOCITY) {
      this.vx = (this.vx / speed) * MAX_VELOCITY
      this.vy = (this.vy / speed) * MAX_VELOCITY
    }
    
    // Appliquer la vitesse à la position
    this.x += this.vx
    this.y += this.vy
    
    // Reset des forces pour la prochaine frame
    this.fx = 0
    this.fy = 0
  }

  /**
   * Obtient la vitesse totale (magnitude)
   * @returns {number}
   */
  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy)
  }

  /**
   * Clone le node
   * @returns {Node}
   */
  clone() {
    const n = new Node(this.x, this.y)
    n.vx = this.vx
    n.vy = this.vy
    return n
  }
}
