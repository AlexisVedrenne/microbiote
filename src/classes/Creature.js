import { Node } from './Node'
import { Segment } from './Segment'
import {
  WATER_FRICTION_BASE,
  WATER_FRICTION_MASS_PENALTY,
  FERTILITY_WINDOW_DURATION,
  CONSTRAINT_ITERATIONS
} from 'src/utils/Constants'
import { generateFirstName, createFamilyName } from 'src/utils/NameGenerator'
import { getTemperatureAt } from 'src/systems/Temperature'

export class Creature {
  constructor(x, y, genes = null, parentNames = null, currentGeneration = 1) {
    this.nodes = []
    this.segments = []
    this.generation = currentGeneration
    this.energy = 100
    this.maxEnergy = 100
    this.age = 0
    this.color = {
      r: 100 + Math.random() * 155,
      g: 100 + Math.random() * 155,
      b: 100 + Math.random() * 155
    }

    // NOMS
    this.firstName = generateFirstName()
    if (parentNames) {
      this.familyName = createFamilyName(parentNames.parent1, parentNames.parent2)
    } else {
      this.familyName = null
    }

    // Gènes évolutifs
    this.genes = genes || {
      muscleStrength: 0.2,
      metabolicEfficiency: 1.0,
      maxEnergyBonus: 0,
      fertility: 1.0,
      preferredTemp: 15 + Math.random() * 10,
      thermalTolerance: 5.0
    }

    this.maxEnergy = 100 + this.genes.maxEnergyBonus

    // Fenêtre de fertilité
    this.fertilityWindow = 0
    this.fertilityWindowDuration = FERTILITY_WINDOW_DURATION

    // Debuffs
    this.debuffs = {
      slow: 0,
      poison: 0
    }

    // Stats de performance
    this.stats = {
      foodEaten: 0,
      distanceTraveled: 0,
      survivalTime: 0,
      reproductions: 0,
      totalSpeed: 0,
      speedSamples: 0,
      energyLost: 0
    }

    // Mémoire motrice pour l'apprentissage
    this.motorMemory = {
      patterns: genes?.motorPatterns || [], // Patterns appris (max 10)
      currentPattern: null, // Pattern en cours de test
      patternStartPos: { x: 0, y: 0 },
      patternStartTime: 0,
      patternDuration: 30, // Durée d'un pattern en frames
      patternTimer: 0,
      learningRate: 0.3, // Probabilité d'explorer vs exploiter
      inherited: genes?.motorPatterns ? true : false // Si patterns hérités
    }

    if (genes && genes.structure) {
      this.createFromStructure(x, y, genes.structure)
    } else {
      this.createRandom(x, y)
    }

    this.calculateMass()
    this.reproductionCooldown = 0
    this.prevX = this.getCenterX()
    this.prevY = this.getCenterY()
  }

  createRandom(x, y) {
    const segmentCount = 3 + Math.floor(Math.random() * 3)

    this.nodes.push(new Node(x, y))

    for (let i = 0; i < segmentCount; i++) {
      const parentNode = this.nodes[Math.floor(Math.random() * this.nodes.length)]
      const angle = Math.random() * Math.PI * 2
      const length = 15 + Math.random() * 25

      const newNode = new Node(
        parentNode.x + Math.cos(angle) * length,
        parentNode.y + Math.sin(angle) * length
      )
      this.nodes.push(newNode)

      this.segments.push(
        new Segment(
          parentNode,
          newNode,
          0.2 + Math.random() * 0.3,
          Math.random() * Math.PI * 2,
          0.04 + Math.random() * 0.06
        )
      )
    }

    // Garantir minimum 3 nœuds
    if (this.nodes.length < 3) {
      const lastNode = this.nodes[this.nodes.length - 1]
      const angle = Math.random() * Math.PI * 2
      const length = 15 + Math.random() * 25

      const newNode = new Node(
        lastNode.x + Math.cos(angle) * length,
        lastNode.y + Math.sin(angle) * length
      )
      this.nodes.push(newNode)

      this.segments.push(
        new Segment(lastNode, newNode, 0.2 + Math.random() * 0.3, Math.random() * Math.PI * 2, 0.04 + Math.random() * 0.06)
      )
    }
  }

  createFromStructure(x, y, structure) {
    this.color = { ...structure.color }

    for (let i = 0; i < structure.nodeCount; i++) {
      const offset = structure.nodeOffsets[i]
      const node = new Node(x + offset.x, y + offset.y)
      this.nodes.push(node)
    }

    for (const segData of structure.segments) {
      if (segData.i1 < this.nodes.length && segData.i2 < this.nodes.length) {
        this.segments.push(
          new Segment(this.nodes[segData.i1], this.nodes[segData.i2], segData.strength, segData.phase, segData.frequency)
        )
      }
    }
  }

  calculateMass() {
    this.mass = this.nodes.length + this.segments.length * 0.5
  }

  getCenterX() {
    return this.nodes.reduce((sum, n) => sum + n.x, 0) / this.nodes.length
  }

  getCenterY() {
    return this.nodes.reduce((sum, n) => sum + n.y, 0) / this.nodes.length
  }

  getRadius() {
    const cx = this.getCenterX()
    const cy = this.getCenterY()
    let maxDist = 0
    for (const node of this.nodes) {
      const dist = Math.sqrt((node.x - cx) ** 2 + (node.y - cy) ** 2)
      if (dist > maxDist) maxDist = dist
    }
    return maxDist
  }

  calculateScore() {
    return (
      this.stats.foodEaten * 100 +
      this.stats.distanceTraveled * 0.5 +
      this.stats.survivalTime * 2 +
      this.stats.reproductions * 200
    )
  }

  update() {
    this.age++
    this.stats.survivalTime++
    this.reproductionCooldown = Math.max(0, this.reproductionCooldown - 1)

    if (this.fertilityWindow > 0) {
      this.fertilityWindow--
    }

    if (this.debuffs.slow > 0) this.debuffs.slow--
    if (this.debuffs.poison > 0) this.debuffs.poison--

    // APPRENTISSAGE MOTEUR: sélectionner et appliquer un pattern
    this.applyMotorPattern()

    // EFFET DE LA TEMPÉRATURE
    const centerY = this.getCenterY()
    const currentTemp = getTemperatureAt(centerY)
    const tempDiff = Math.abs(currentTemp - this.genes.preferredTemp)
    const isComfortable = tempDiff <= this.genes.thermalTolerance

    let tempPenalty = 1.0
    if (!isComfortable) {
      const overshoot = tempDiff - this.genes.thermalTolerance
      tempPenalty = 1.0 + overshoot * 0.05
    }

    // Coût énergétique
    const metabolismCost = this.mass * 0.008 * this.genes.metabolicEfficiency * tempPenalty
    this.energy -= metabolismCost
    this.stats.energyLost += metabolismCost

    // Friction de l'eau
    const waterFriction = WATER_FRICTION_BASE - this.mass * WATER_FRICTION_MASS_PENALTY

    // Appliquer forces segments
    let effectiveMuscleStrength = this.genes.muscleStrength
    if (this.debuffs.slow > 0) {
      effectiveMuscleStrength *= 0.5
    }

    for (const seg of this.segments) {
      seg.applyForces(this.age, effectiveMuscleStrength)
    }

    // Traînée hydrodynamique
    for (const seg of this.segments) {
      seg.applyDrag()
    }

    // Mettre à jour nœuds
    for (const node of this.nodes) {
      node.update(waterFriction)
    }

    // Contraintes rigides
    for (let iteration = 0; iteration < CONSTRAINT_ITERATIONS; iteration++) {
      for (const seg of this.segments) {
        seg.enforceConstraint()
      }
    }

    // Tracker vitesse
    let totalVel = 0
    for (const node of this.nodes) {
      totalVel += Math.sqrt(node.vx ** 2 + node.vy ** 2)
    }
    const avgVel = totalVel / this.nodes.length
    this.stats.totalSpeed += avgVel
    this.stats.speedSamples++

    // Tracker distance
    const cx = this.getCenterX()
    const cy = this.getCenterY()
    const dist = Math.sqrt((cx - this.prevX) ** 2 + (cy - this.prevY) ** 2)
    this.stats.distanceTraveled += dist
    this.prevX = cx
    this.prevY = cy
  }

  canReproduce() {
    if (this.fertilityWindow > 0) {
      return true
    }

    const reproductionThreshold = (100 + this.mass * 8) * this.genes.fertility
    const ageThreshold = 100 / this.genes.fertility

    const isFertile =
      this.energy > reproductionThreshold && this.reproductionCooldown === 0 && this.age > ageThreshold

    if (isFertile && this.fertilityWindow === 0) {
      this.fertilityWindow = this.fertilityWindowDuration
    }

    return isFertile
  }

  isDead() {
    return this.energy <= 0
  }

  getGenes() {
    const cx = this.getCenterX()
    const cy = this.getCenterY()

    const nodeOffsets = this.nodes.map((n) => ({
      x: n.x - cx,
      y: n.y - cy
    }))

    const segments = this.segments.map((s) => ({
      i1: this.nodes.indexOf(s.node1),
      i2: this.nodes.indexOf(s.node2),
      strength: s.strength,
      phase: s.phase,
      frequency: s.frequency
    }))

    return {
      muscleStrength: this.genes.muscleStrength,
      metabolicEfficiency: this.genes.metabolicEfficiency,
      maxEnergyBonus: this.genes.maxEnergyBonus,
      fertility: this.genes.fertility,
      preferredTemp: this.genes.preferredTemp,
      thermalTolerance: this.genes.thermalTolerance,
      motorPatterns: this.getMotorPatterns(), // Patterns moteurs appris
      structure: {
        nodeCount: this.nodes.length,
        nodeOffsets: nodeOffsets,
        segments: segments,
        color: { ...this.color }
      }
    }
  }

  draw(ctx) {
    // Dessiner segments
    for (const seg of this.segments) {
      ctx.beginPath()
      ctx.moveTo(seg.node1.x, seg.node1.y)
      ctx.lineTo(seg.node2.x, seg.node2.y)

      const energyFactor = Math.min(1, this.energy / 100)
      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${0.6 + energyFactor * 0.4})`
      ctx.lineWidth = 2 + this.mass * 0.2
      ctx.stroke()
    }

    // Dessiner nœuds
    for (const node of this.nodes) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`
      ctx.fill()

      if (this.canReproduce()) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    // Noms
    const cx = this.getCenterX()
    const cy = this.getCenterY()
    const isFertile = this.canReproduce()

    ctx.textAlign = 'center'

    if (isFertile) {
      ctx.fillStyle = 'rgba(0, 255, 255, 1)'
      ctx.font = 'bold 9px Arial'
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = '9px Arial'
    }
    ctx.fillText(this.firstName, cx, cy - 20)

    if (this.familyName) {
      ctx.font = '7px Arial'
      if (isFertile) {
        ctx.fillStyle = 'rgba(100, 220, 255, 1)'
      } else {
        ctx.fillStyle = 'rgba(180, 200, 255, 0.7)'
      }
      ctx.fillText(this.familyName, cx, cy - 12)
    }

    // Indicateurs debuff
    let debuffY = cy - 30
    if (this.debuffs.slow > 0) {
      ctx.fillStyle = 'rgba(255, 153, 68, 0.9)'
      ctx.font = 'bold 10px Arial'
      ctx.fillText('🐌', cx - 10, debuffY)
      debuffY -= 8
    }
    if (this.debuffs.poison > 0) {
      ctx.fillStyle = 'rgba(204, 0, 255, 0.9)'
      ctx.font = 'bold 10px Arial'
      ctx.fillText('☠️', cx + 10, debuffY)
    }
  }

  // ========== SYSTÈME D'APPRENTISSAGE MOTEUR ==========

  /**
   * Sélectionne ou crée un nouveau pattern de mouvement
   */
  selectMotorPattern() {
    const memory = this.motorMemory

    // Si on a des patterns appris, décider entre exploration et exploitation
    if (memory.patterns.length > 0 && Math.random() > memory.learningRate) {
      // EXPLOITATION: choisir le meilleur pattern appris
      const bestPattern = memory.patterns.reduce((best, p) => (p.efficiency > best.efficiency ? p : best))
      memory.currentPattern = { ...bestPattern }
    } else {
      // EXPLORATION: créer un pattern aléatoire
      memory.currentPattern = {
        segmentPhases: this.segments.map(() => Math.random() * Math.PI * 2),
        efficiency: 0,
        timesUsed: 0
      }
    }

    // Reset du timer et position de départ
    memory.patternTimer = 0
    memory.patternStartPos = {
      x: this.getCenterX(),
      y: this.getCenterY()
    }
    memory.patternStartTime = this.age
  }

  /**
   * Applique le pattern moteur actuel
   */
  applyMotorPattern() {
    const memory = this.motorMemory

    if (!memory.currentPattern) {
      this.selectMotorPattern()
    }

    // Appliquer les phases du pattern aux segments
    for (let i = 0; i < this.segments.length; i++) {
      if (memory.currentPattern.segmentPhases[i] !== undefined) {
        this.segments[i].phase = memory.currentPattern.segmentPhases[i]
      }
    }

    memory.patternTimer++

    // Fin du pattern: évaluer et mémoriser
    if (memory.patternTimer >= memory.patternDuration) {
      this.evaluateMotorPattern()
      this.selectMotorPattern()
    }
  }

  /**
   * Évalue l'efficacité du pattern actuel
   */
  evaluateMotorPattern() {
    const memory = this.motorMemory
    if (!memory.currentPattern) return

    // Calculer le déplacement réel
    const endX = this.getCenterX()
    const endY = this.getCenterY()
    const distance = Math.sqrt(
      (endX - memory.patternStartPos.x) ** 2 + (endY - memory.patternStartPos.y) ** 2
    )

    // Calculer l'énergie dépensée pendant le pattern
    const energySpent = this.stats.energyLost

    // Efficacité = distance / (énergie dépensée + 1)
    // On favorise les patterns qui font beaucoup de distance avec peu d'énergie
    const efficiency = distance / (energySpent * 0.1 + 1)

    memory.currentPattern.efficiency = efficiency
    memory.currentPattern.timesUsed++

    // Ajouter ou mettre à jour le pattern dans la mémoire
    const existingIndex = memory.patterns.findIndex((p) => {
      // Comparer les patterns (similaires si phases proches)
      if (p.segmentPhases.length !== memory.currentPattern.segmentPhases.length) return false
      let diff = 0
      for (let i = 0; i < p.segmentPhases.length; i++) {
        diff += Math.abs(p.segmentPhases[i] - memory.currentPattern.segmentPhases[i])
      }
      return diff < 0.5 // Seuil de similarité
    })

    if (existingIndex >= 0) {
      // Pattern similaire existe: mise à jour de l'efficacité (moyenne pondérée)
      const existing = memory.patterns[existingIndex]
      existing.efficiency =
        (existing.efficiency * existing.timesUsed + efficiency) / (existing.timesUsed + 1)
      existing.timesUsed++
    } else if (efficiency > 0.5) {
      // Nouveau pattern intéressant: l'ajouter
      memory.patterns.push({ ...memory.currentPattern })

      // Garder seulement les 10 meilleurs patterns
      if (memory.patterns.length > 10) {
        memory.patterns.sort((a, b) => b.efficiency - a.efficiency)
        memory.patterns = memory.patterns.slice(0, 10)
      }
    }
  }

  /**
   * Récupère les patterns moteurs pour héritage
   */
  getMotorPatterns() {
    // Retourner les 5 meilleurs patterns
    const sorted = [...this.motorMemory.patterns].sort((a, b) => b.efficiency - a.efficiency)
    return sorted.slice(0, 5)
  }

  // Méthodes évolution et reproduction ajoutées dans les prochains fichiers
  // (pour réduire la complexité, ces méthodes seront dans des mixins ou helpers)
}
