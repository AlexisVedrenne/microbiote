import { FOOD_TYPES } from 'src/utils/Constants'

function getRandomFoodType() {
  const rand = Math.random()
  let cumul = 0

  for (const key in FOOD_TYPES) {
    cumul += FOOD_TYPES[key].probability
    if (rand < cumul) {
      return FOOD_TYPES[key]
    }
  }
  return FOOD_TYPES.NORMAL
}

export class Food {
  constructor(x, y, forcedType = null) {
    this.x = x
    this.y = y
    this.type = forcedType || getRandomFoodType()
    this.size = this.type.size
  }

  draw(ctx, time) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size)
    gradient.addColorStop(0, this.type.color1)
    gradient.addColorStop(1, this.type.color2)
    ctx.fillStyle = gradient
    ctx.fill()

    // Glow
    ctx.strokeStyle = this.type.color1 + '80' // 50% alpha
    ctx.lineWidth = 2
    ctx.stroke()

    // Effet spécial pour nourriture riche (pulsation)
    if (this.type.name === 'rich') {
      const pulse = Math.sin(time * 0.1) * 0.5 + 0.5
      ctx.strokeStyle = this.type.color1 + Math.floor(pulse * 255).toString(16).padStart(2, '0')
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }
}
