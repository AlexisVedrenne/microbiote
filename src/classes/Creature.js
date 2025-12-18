import { Node } from './Node'
import { Segment, applyGroupedWaterResistance } from './Segment'
import { detectJoints } from './Joint'
import {
  WATER_FRICTION_BASE,
  WATER_FRICTION_MASS_PENALTY,
  FERTILITY_WINDOW_DURATION,
  CONSTRAINT_ITERATIONS,
  PROPULSION_TYPES
} from 'src/utils/Constants'
import { generateFirstName, createFamilyName } from 'src/utils/NameGenerator'
import { getTemperatureAt } from 'src/systems/Temperature'
import {
  getPropulsionColor,
  getEnergyCostMultiplier
} from 'src/systems/PropulsionSystem'
import {
  generateRandomSequence
  // MotorSequence, mutateSequence, fuseSequences - TODO: utiliser pour reproduction
} from 'src/systems/MotorSequenceSystem'
import { analyzeCreatureBehavior } from 'src/systems/BehaviorAnalysisSystem'

export class Creature {
  constructor(x, y, genes = null, parentNames = null, currentGeneration = 1) {
    this.nodes = []
    this.segments = []
    this.joints = [] // NOUVEAU : Articulations détectées
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
      thermalTolerance: 5.0,
      propulsionType: null // NOUVEAU : Pas de type au départ, sera déterminé par comportement
    }

    // Couleur : grise au départ, changera quand type sera détecté
    if (!genes || !this.genes.propulsionType) {
      this.color = {
        r: 150,
        g: 150,
        b: 150
      }
    } else {
      this.color = getPropulsionColor(this.genes.propulsionType)
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

    // NOUVEAU SYSTÈME : Mémoire motrice avec séquences
    this.motorMemory = {
      sequences: genes?.motorSequences || [], // Séquences apprises (max 10)
      currentSequence: null, // Séquence en cours de test
      sequenceStartPos: { x: 0, y: 0 },
      sequenceStartTime: 0,
      sequenceTimer: 0,
      sequenceEvaluationDuration: 90, // Évaluer sur 90 frames (1.5 secondes)
      learningRate: 0.3, // Probabilité d'explorer vs exploiter
      inherited: genes?.motorSequences ? true : false, // Si séquences héritées
      typeDetectionAttempted: false // Si on a déjà tenté de détecter le type
    }

    if (genes && genes.structure) {
      this.createFromStructure(x, y, genes.structure)
    } else {
      this.createRandom(x, y)
    }

    this.calculateMass()

    // NOUVEAU : Détecter les articulations après création de la structure
    this.joints = detectJoints(this.nodes, this.segments)

    this.reproductionCooldown = 0
    this.prevX = this.getCenterX()
    this.prevY = this.getCenterY()
  }

  createRandom(x, y) {
    // NOUVEAU : Forme aléatoire simple au départ (pas de type prédéfini)
    // La forme sera adaptée plus tard selon le type découvert
    const segmentCount = 3 + Math.floor(Math.random() * 4) // 3-6 segments
    const angle = Math.random() * Math.PI * 2
    const baseLength = 18 + Math.random() * 10

    // Créer une chaîne linéaire simple
    this.nodes.push(new Node(x, y))

    for (let i = 0; i < segmentCount; i++) {
      const prevNode = this.nodes[this.nodes.length - 1]
      const length = baseLength + (Math.random() - 0.5) * 8
      const angleVariation = (Math.random() - 0.5) * 0.3

      const newNode = new Node(
        prevNode.x + Math.cos(angle + angleVariation) * length,
        prevNode.y + Math.sin(angle + angleVariation) * length
      )
      this.nodes.push(newNode)

      this.segments.push(
        new Segment(
          prevNode,
          newNode,
          0.2 + Math.random() * 0.3,
          Math.random() * Math.PI * 2,
          0.07 // Fréquence par défaut
        )
      )
    }

    // Garantir minimum 3 nœuds
    if (this.nodes.length < 3) {
      const lastNode = this.nodes[this.nodes.length - 1]
      const newAngle = Math.random() * Math.PI * 2
      const length = 15 + Math.random() * 25

      const newNode = new Node(
        lastNode.x + Math.cos(newAngle) * length,
        lastNode.y + Math.sin(newAngle) * length
      )
      this.nodes.push(newNode)

      this.segments.push(
        new Segment(lastNode, newNode, 0.2 + Math.random() * 0.3, Math.random() * Math.PI * 2, 0.07)
      )
    }
  }

  /* ANCIENNE VERSION avec types prédéfinis - TEMPORAIREMENT DÉSACTIVÉE
  createRandomWithType(x, y) {
    const propulsionType = this.genes.propulsionType

    // FORMES DIFFÉRENTES SELON LE TYPE DE PROPULSION
    switch (propulsionType) {
      case PROPULSION_TYPES.UNDULATION: {
        // ONDULATION : Corps long et linéaire (comme une anguille)
        const segmentCount = 5 + Math.floor(Math.random() * 3) // 5-7 segments
        const angle = Math.random() * Math.PI * 2
        const segmentLength = 18 + Math.random() * 8

        this.nodes.push(new Node(x, y))

        for (let i = 0; i < segmentCount; i++) {
          const prevNode = this.nodes[this.nodes.length - 1]
          const newNode = new Node(
            prevNode.x + Math.cos(angle) * segmentLength,
            prevNode.y + Math.sin(angle) * segmentLength
          )
          this.nodes.push(newNode)
          this.segments.push(
            new Segment(prevNode, newNode, 0.3 + Math.random() * 0.2, (i / segmentCount) * Math.PI * 2, getSegmentFrequency(propulsionType))
          )
        }
        break
      }

      case PROPULSION_TYPES.OSCILLATION: {
        // OSCILLATION : Corps streamline avec queue large (comme requin)
        const bodySegments = 3
        const tailSegments = 2
        const angle = Math.random() * Math.PI * 2

        // Corps principal (petits segments)
        this.nodes.push(new Node(x, y))
        for (let i = 0; i < bodySegments; i++) {
          const prevNode = this.nodes[this.nodes.length - 1]
          const newNode = new Node(
            prevNode.x + Math.cos(angle) * 15,
            prevNode.y + Math.sin(angle) * 15
          )
          this.nodes.push(newNode)
          this.segments.push(
            new Segment(prevNode, newNode, 0.2, 0, getSegmentFrequency(propulsionType))
          )
        }

        // Queue (segments plus longs et puissants)
        for (let i = 0; i < tailSegments; i++) {
          const prevNode = this.nodes[this.nodes.length - 1]
          const newNode = new Node(
            prevNode.x + Math.cos(angle) * 25,
            prevNode.y + Math.sin(angle) * 25
          )
          this.nodes.push(newNode)
          this.segments.push(
            new Segment(prevNode, newNode, 0.5, Math.PI, getSegmentFrequency(propulsionType))
          )
        }
        break
      }

      case PROPULSION_TYPES.JET: {
        // JET : Corps compact et rond (comme méduse)
        const radialSegments = 5 + Math.floor(Math.random() * 2) // 5-6 segments radiaux

        this.nodes.push(new Node(x, y)) // Centre

        for (let i = 0; i < radialSegments; i++) {
          const angle = (i / radialSegments) * Math.PI * 2
          const length = 20 + Math.random() * 10
          const newNode = new Node(
            x + Math.cos(angle) * length,
            y + Math.sin(angle) * length
          )
          this.nodes.push(newNode)
          this.segments.push(
            new Segment(this.nodes[0], newNode, 0.4 + Math.random() * 0.1, 0, getSegmentFrequency(propulsionType))
          )
        }
        break
      }

      case PROPULSION_TYPES.ROWING: {
        // RAMES : Corps central avec appendices latéraux (comme tortue)
        const spineSegments = 3
        const appendagesPerSide = 2
        const angle = Math.random() * Math.PI * 2

        // Colonne vertébrale
        this.nodes.push(new Node(x, y))
        for (let i = 0; i < spineSegments; i++) {
          const prevNode = this.nodes[this.nodes.length - 1]
          const newNode = new Node(
            prevNode.x + Math.cos(angle) * 18,
            prevNode.y + Math.sin(angle) * 18
          )
          this.nodes.push(newNode)
          this.segments.push(
            new Segment(prevNode, newNode, 0.25, 0, getSegmentFrequency(propulsionType))
          )
        }

        // Appendices latéraux (rames)
        for (let i = 1; i <= appendagesPerSide; i++) {
          const spineNode = this.nodes[i]
          // Gauche
          const leftNode = new Node(
            spineNode.x + Math.cos(angle + Math.PI / 2) * 22,
            spineNode.y + Math.sin(angle + Math.PI / 2) * 22
          )
          this.nodes.push(leftNode)
          this.segments.push(
            new Segment(spineNode, leftNode, 0.3, 0, getSegmentFrequency(propulsionType))
          )
          // Droite
          const rightNode = new Node(
            spineNode.x + Math.cos(angle - Math.PI / 2) * 22,
            spineNode.y + Math.sin(angle - Math.PI / 2) * 22
          )
          this.nodes.push(rightNode)
          this.segments.push(
            new Segment(spineNode, rightNode, 0.3, Math.PI, getSegmentFrequency(propulsionType))
          )
        }
        break
      }

      case PROPULSION_TYPES.VIBRATION: {
        // VIBRATION : Corps petit et compact (comme hippocampe)
        const segmentCount = 3 + Math.floor(Math.random() * 2) // 3-4 segments courts
        const angle = Math.random() * Math.PI * 2

        this.nodes.push(new Node(x, y))
        for (let i = 0; i < segmentCount; i++) {
          const prevNode = this.nodes[this.nodes.length - 1]
          const newNode = new Node(
            prevNode.x + Math.cos(angle) * 12,
            prevNode.y + Math.sin(angle) * 12
          )
          this.nodes.push(newNode)
          this.segments.push(
            new Segment(prevNode, newNode, 0.2, Math.random() * 0.5, getSegmentFrequency(propulsionType))
          )
        }
        break
      }

      default: {
        // Fallback : forme aléatoire
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
              getSegmentFrequency(propulsionType)
            )
          )
        }
      }
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
        new Segment(lastNode, newNode, 0.2 + Math.random() * 0.3, Math.random() * Math.PI * 2, 0.07)
      )
    }
  }
  */

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

    // NOUVEAU : APPRENTISSAGE MOTEUR avec séquences (applique aussi les forces)
    this.applyMotorSequence()

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

    // Coût énergétique (ajusté par type de propulsion si détecté)
    const propulsionCostMultiplier = this.genes.propulsionType
      ? getEnergyCostMultiplier(this.genes.propulsionType)
      : 1.0 // Par défaut si pas encore détecté

    const metabolismCost = this.mass * 0.008 * this.genes.metabolicEfficiency * tempPenalty * propulsionCostMultiplier
    this.energy -= metabolismCost
    this.stats.energyLost += metabolismCost

    // Friction de l'eau
    const waterFriction = WATER_FRICTION_BASE - this.mass * WATER_FRICTION_MASS_PENALTY

    // Résistance de l'eau (nouveau système avec volume déplacé)
    applyGroupedWaterResistance(this.segments, this.nodes)

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
      propulsionType: this.genes.propulsionType, // Type de nage (peut être null)
      motorSequences: this.getMotorSequences(), // NOUVEAU : Séquences motrices apprises
      structure: {
        nodeCount: this.nodes.length,
        nodeOffsets: nodeOffsets,
        segments: segments,
        color: { ...this.color }
      }
    }
  }

  draw(ctx) {
    const propulsionType = this.genes.propulsionType
    const energyFactor = Math.min(1, this.energy / 100)

    // Effets visuels spécifiques par type de propulsion
    switch (propulsionType) {
      case PROPULSION_TYPES.UNDULATION:
        this.drawUndulation(ctx, energyFactor)
        break
      case PROPULSION_TYPES.OSCILLATION:
        this.drawOscillation(ctx, energyFactor)
        break
      case PROPULSION_TYPES.JET:
        this.drawJet(ctx, energyFactor)
        break
      case PROPULSION_TYPES.ROWING:
        this.drawRowing(ctx, energyFactor)
        break
      case PROPULSION_TYPES.VIBRATION:
        this.drawVibration(ctx, energyFactor)
        break
      default:
        this.drawDefault(ctx, energyFactor)
    }

    // Dessiner nœuds (commun à tous)
    this.drawNodes(ctx)
  }

  // Style ONDULATION: segments avec gradient ondulant
  drawUndulation(ctx, energyFactor) {
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i]
      ctx.beginPath()
      ctx.moveTo(seg.node1.x, seg.node1.y)
      ctx.lineTo(seg.node2.x, seg.node2.y)

      // Variation d'épaisseur le long du corps (ondulation)
      const wave = Math.sin((i / this.segments.length) * Math.PI * 2 + this.age * 0.1)
      const width = (2 + this.mass * 0.2) * (1 + wave * 0.3)

      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${0.6 + energyFactor * 0.4})`
      ctx.lineWidth = width
      ctx.stroke()

      // Lueur douce
      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${0.2})`
      ctx.lineWidth = width + 4
      ctx.stroke()
    }
  }

  // Style OSCILLATION: segments épais à l'arrière, traînée de mouvement
  drawOscillation(ctx, energyFactor) {
    const frontCount = Math.floor(this.segments.length * 0.7)

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i]
      ctx.beginPath()
      ctx.moveTo(seg.node1.x, seg.node1.y)
      ctx.lineTo(seg.node2.x, seg.node2.y)

      // Plus épais à l'arrière (queue puissante)
      const isTail = i >= frontCount
      const width = isTail ? (3 + this.mass * 0.3) : (1.5 + this.mass * 0.15)

      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${0.7 + energyFactor * 0.3})`
      ctx.lineWidth = width
      ctx.stroke()

      // Traînée de mouvement sur la queue
      if (isTail) {
        const vx = (seg.node1.vx + seg.node2.vx) / 2
        const vy = (seg.node1.vy + seg.node2.vy) / 2
        const speed = Math.sqrt(vx * vx + vy * vy)

        if (speed > 0.5) {
          ctx.save()
          ctx.globalAlpha = 0.3
          ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.5)`
          ctx.lineWidth = width * 1.5
          ctx.beginPath()
          const midX = (seg.node1.x + seg.node2.x) / 2
          const midY = (seg.node1.y + seg.node2.y) / 2
          ctx.moveTo(midX, midY)
          ctx.lineTo(midX - vx * 5, midY - vy * 5)
          ctx.stroke()
          ctx.restore()
        }
      }
    }
  }

  // Style JET: impulsions visuelles, effet de contraction
  drawJet(ctx, energyFactor) {
    // Effet de pulsation synchronisée
    const pulse = Math.sin(this.age * 0.05) * 0.5 + 0.5

    for (const seg of this.segments) {
      ctx.beginPath()
      ctx.moveTo(seg.node1.x, seg.node1.y)
      ctx.lineTo(seg.node2.x, seg.node2.y)

      // Épaisseur pulsante
      const width = (2 + this.mass * 0.2) * (0.7 + pulse * 0.6)

      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${0.5 + energyFactor * 0.5})`
      ctx.lineWidth = width
      ctx.stroke()

      // Halo pulsant
      ctx.save()
      ctx.globalAlpha = pulse * 0.4
      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`
      ctx.lineWidth = width + 6
      ctx.stroke()
      ctx.restore()
    }

    // Effet de jet (particules derrière)
    if (pulse > 0.7) {
      const cx = this.getCenterX()
      const cy = this.getCenterY()
      const avgVx = this.nodes.reduce((sum, n) => sum + n.vx, 0) / this.nodes.length
      const avgVy = this.nodes.reduce((sum, n) => sum + n.vy, 0) / this.nodes.length

      ctx.save()
      ctx.globalAlpha = 0.3
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.6)`
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(cx - avgVx * (i + 1) * 3, cy - avgVy * (i + 1) * 3, 2 - i * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
  }

  // Style ROWING: segments avec effet de rames battantes
  drawRowing(ctx, energyFactor) {
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i]
      const isLeftSide = i % 2 === 0

      ctx.beginPath()
      ctx.moveTo(seg.node1.x, seg.node1.y)
      ctx.lineTo(seg.node2.x, seg.node2.y)

      // Alternance visuelle gauche/droite
      const beatPhase = Math.sin(this.age * 0.08 + (isLeftSide ? 0 : Math.PI))
      const width = (2 + this.mass * 0.2) * (1 + Math.abs(beatPhase) * 0.4)

      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${0.6 + energyFactor * 0.4})`
      ctx.lineWidth = width
      ctx.stroke()

      // Effet de rame étendue
      if (Math.abs(beatPhase) > 0.7) {
        ctx.save()
        ctx.globalAlpha = 0.2
        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.5)`
        ctx.lineWidth = width + 3
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  // Style VIBRATION: segments fins avec effet de flou
  drawVibration(ctx, energyFactor) {
    // Effet de vibration rapide
    const vibration = Math.sin(this.age * 0.3) * 0.3

    for (const seg of this.segments) {
      // Dessiner plusieurs fois avec léger décalage pour effet de flou
      for (let offset = -1; offset <= 1; offset++) {
        ctx.save()
        ctx.globalAlpha = offset === 0 ? (0.6 + energyFactor * 0.4) : 0.15
        ctx.translate(vibration * offset, vibration * offset * 0.5)

        ctx.beginPath()
        ctx.moveTo(seg.node1.x, seg.node1.y)
        ctx.lineTo(seg.node2.x, seg.node2.y)

        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 1)`
        ctx.lineWidth = 1.5 + this.mass * 0.15
        ctx.stroke()

        ctx.restore()
      }
    }
  }

  // Style par défaut (fallback)
  drawDefault(ctx, energyFactor) {
    for (const seg of this.segments) {
      ctx.beginPath()
      ctx.moveTo(seg.node1.x, seg.node1.y)
      ctx.lineTo(seg.node2.x, seg.node2.y)

      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${0.6 + energyFactor * 0.4})`
      ctx.lineWidth = 2 + this.mass * 0.2
      ctx.stroke()
    }
  }

  // Dessiner les nœuds (commun à tous les types)
  drawNodes(ctx) {
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

  // ========== NOUVEAU SYSTÈME D'APPRENTISSAGE MOTEUR (SÉQUENCES) ==========

  /**
   * Sélectionne ou crée une nouvelle séquence motrice
   */
  selectMotorSequence() {
    const memory = this.motorMemory

    // Si on a des séquences apprises, décider entre exploration et exploitation
    if (memory.sequences.length > 0 && Math.random() > memory.learningRate) {
      // EXPLOITATION: choisir la meilleure séquence apprise
      const bestSequence = memory.sequences.reduce((best, s) => (s.efficiency > best.efficiency ? s : best))
      memory.currentSequence = bestSequence.clone()
    } else {
      // EXPLORATION: créer une séquence aléatoire basée sur le nombre d'articulations
      memory.currentSequence = generateRandomSequence(this.joints.length)
    }

    // Reset du timer et position de départ
    memory.sequenceTimer = 0
    memory.sequenceStartPos = {
      x: this.getCenterX(),
      y: this.getCenterY()
    }
    memory.sequenceStartTime = this.age
  }

  /**
   * Applique la séquence motrice actuelle (NOUVELLE PHYSIQUE NEWTONIENNE)
   */
  applyMotorSequence() {
    const memory = this.motorMemory

    if (!memory.currentSequence) {
      this.selectMotorSequence()
    }

    // Obtenir la pose actuelle de la séquence (avec interpolation)
    const poseData = memory.currentSequence.getPoseAt(memory.sequenceTimer)

    if (poseData && this.joints.length > 0) {
      // NOUVELLE APPROCHE : Contracter les articulations pour atteindre la pose cible
      let effectiveMuscleStrength = this.genes.muscleStrength
      if (this.debuffs.slow > 0) {
        effectiveMuscleStrength *= 0.5
      }

      // Appliquer les contractions à chaque articulation
      for (let i = 0; i < this.joints.length && i < poseData.jointContractions.length; i++) {
        const joint = this.joints[i]
        const targetContraction = poseData.jointContractions[i]

        // Contraction avec force proportionnelle à la masse (comme demandé)
        joint.applyContraction(targetContraction, effectiveMuscleStrength, this.mass)
      }
    }

    memory.sequenceTimer++

    // Fin de l'évaluation: mémoriser et sélectionner nouvelle séquence
    if (memory.sequenceTimer >= memory.sequenceEvaluationDuration) {
      this.evaluateMotorSequence()
      this.selectMotorSequence()

      // Tentative de détection du type (après suffisamment de données)
      if (!this.genes.propulsionType && !memory.typeDetectionAttempted) {
        this.attemptTypeDetection()
      }
    }
  }

  /**
   * Évalue l'efficacité de la séquence actuelle
   */
  evaluateMotorSequence() {
    const memory = this.motorMemory
    if (!memory.currentSequence) return

    // Calculer le déplacement réel
    const endX = this.getCenterX()
    const endY = this.getCenterY()
    const distance = Math.sqrt(
      (endX - memory.sequenceStartPos.x) ** 2 + (endY - memory.sequenceStartPos.y) ** 2
    )

    // Calculer l'énergie dépensée pendant la séquence
    const energySpentDuringSequence = this.stats.energyLost - (memory.energyAtSequenceStart || 0)

    // Efficacité = distance / (énergie dépensée + 1)
    const efficiency = distance / (energySpentDuringSequence * 0.1 + 1)

    memory.currentSequence.efficiency = efficiency
    memory.currentSequence.timesUsed++

    // Sauvegarder énergie pour prochaine évaluation
    memory.energyAtSequenceStart = this.stats.energyLost

    // Ajouter la séquence à la mémoire (garder les 10 meilleures)
    if (efficiency > 0.5) {
      memory.sequences.push(memory.currentSequence.clone())

      // Garder seulement les 10 meilleures séquences
      if (memory.sequences.length > 10) {
        memory.sequences.sort((a, b) => b.efficiency - a.efficiency)
        memory.sequences = memory.sequences.slice(0, 10)
      }
    }
  }

  /**
   * Tente de détecter automatiquement le type de propulsion
   * basé sur le comportement observé
   */
  attemptTypeDetection() {
    const memory = this.motorMemory

    const detectedType = analyzeCreatureBehavior(memory)

    if (detectedType) {
      // Type détecté !
      this.genes.propulsionType = detectedType
      this.color = getPropulsionColor(detectedType)
      memory.typeDetectionAttempted = true

      console.log(`🔍 ${this.firstName} a découvert son type: ${detectedType}`)
    } else if (memory.sequences.length >= 8) {
      // Essayé mais pas assez confiant, réessayer plus tard
      memory.typeDetectionAttempted = false
    }
  }

  /**
   * Récupère les séquences motrices pour héritage
   */
  getMotorSequences() {
    // Retourner les 5 meilleures séquences
    const sorted = [...this.motorMemory.sequences].sort((a, b) => b.efficiency - a.efficiency)
    return sorted.slice(0, 5)
  }

  // Méthodes évolution et reproduction ajoutées dans les prochains fichiers
  // (pour réduire la complexité, ces méthodes seront dans des mixins ou helpers)
}
