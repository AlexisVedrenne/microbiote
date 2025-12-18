import { MAX_SPEED, WORLD_WIDTH, WORLD_HEIGHT } from 'src/utils/Constants'

export class Node {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
  }

  applyForce(fx, fy) {
    this.vx += fx
    this.vy += fy

    // LIMITER LA VITESSE MAX (éviter vitesse lumière)
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)

    if (speed > MAX_SPEED) {
      this.vx = (this.vx / speed) * MAX_SPEED
      this.vy = (this.vy / speed) * MAX_SPEED
    }
  }

  update(waterFriction) {
    // FRICTION DIRECTIONNELLE
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)

    if (speed > 0.001) {
      const dirX = this.vx / speed
      const dirY = this.vy / speed

      const forwardFriction = waterFriction
      const lateralFriction = 0.75

      const forwardVel = this.vx * dirX + this.vy * dirY
      const forwardVx = dirX * forwardVel
      const forwardVy = dirY * forwardVel

      const lateralVx = this.vx - forwardVx
      const lateralVy = this.vy - forwardVy

      this.vx = forwardVx * forwardFriction + lateralVx * lateralFriction
      this.vy = forwardVy * forwardFriction + lateralVy * lateralFriction
    } else {
      this.vx *= waterFriction
      this.vy *= waterFriction
    }

    // Mouvement
    this.x += this.vx
    this.y += this.vy

    // Bordures du MONDE (murs solides)
    if (this.x < 0) {
      this.x = 0
      this.vx *= -0.3
    }
    if (this.x > WORLD_WIDTH) {
      this.x = WORLD_WIDTH
      this.vx *= -0.3
    }
    if (this.y < 0) {
      this.y = 0
      this.vy *= -0.3
    }
    if (this.y > WORLD_HEIGHT) {
      this.y = WORLD_HEIGHT
      this.vy *= -0.3
    }
  }
}
