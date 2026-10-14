/**
 * Creature.js - Créature aquatique (nouvelle physique)
 * 
 * Basé sur :
 * - Nodes (points avec position/vitesse)
 * - Links (liens élastiques)
 * - Articulations (contractions)
 * - MotorClock (horloge interne)
 * 
 * Compatible avec l'ancien système (aliases pour muscles, etc.)
 */

import { Node } from './Node'
import { Link } from './Link'
import { detectArticulations, MotorClock } from './Contraction'
import { applyWaterPhysics } from './WaterPhysics'
import { generateFirstName, createFamilyName } from 'src/utils/NameGenerator'

// Constantes
const WORLD_WIDTH = 5000
const WORLD_HEIGHT = 5000
const FRICTION = 0.985     // Friction réduite pour permettre le mouvement
const MAX_SPEED = 4.0      // Vitesse max augmentée

export class Creature {
  constructor(x, y, genes = null, parentNames = null, generation = 1) {
    // === STRUCTURE ===
    this.nodes = []
    this.links = []
    this.articulations = []
    this.motorClock = null
    
    // Alias pour compatibilité avec ancien code
    this.muscles = this.links
    
    // === IDENTITÉ ===
    this.firstName = generateFirstName()
    this.familyName = parentNames 
      ? createFamilyName(parentNames.parent1, parentNames.parent2)
      : null
    this.generation = generation
    
    // === ÉNERGIE ===
    this.energy = 100
    this.maxEnergy = 100
    this.age = 0
    
    // === GÈNES ===
    this.genes = genes ? { ...genes } : {
      muscleStrength: 0.3,
      metabolicEfficiency: 1.0,
      maxEnergyBonus: 0,
      fertility: 1.0
    }
    this.maxEnergy = 100 + (this.genes.maxEnergyBonus || 0)
    
    // === COULEUR ===
    this.color = genes?.color ? { ...genes.color } : {
      r: 100 + Math.random() * 155,
      g: 100 + Math.random() * 155,
      b: 100 + Math.random() * 155
    }
    
    // === REPRODUCTION ===
    this.reproductionCooldown = 0
    this.fertilityWindow = 0
    this.fertilityWindowDuration = 1800
    
    // === DEBUFFS ===
    this.debuffs = {
      slow: 0,
      poison: 0
    }
    
    // === STATS ===
    this.stats = {
      foodEaten: 0,
      distanceTraveled: 0,
      survivalTime: 0,
      reproductions: 0,
      totalSpeed: 0,
      speedSamples: 0,
      energyLost: 0
    }
    this.prevX = x
    this.prevY = y
    
    // === CRÉATION STRUCTURE ===
    if (genes?.structure) {
      this.createFromGenes(x, y, genes)
    } else {
      this.createRandom(x, y)
    }
    
    // Calculer masse
    this.calculateMass()
    
    // Détecter articulations
    this.articulations = detectArticulations(this.nodes, this.links)
    
    // Mettre à jour l'alias muscles
    this.muscles = this.links
    
    // Créer horloge motrice (système d'onde)
    this.motorClock = new MotorClock(this.articulations.length)
    if (genes?.motorClock) {
      // Copier les paramètres d'onde
      this.motorClock.frequency = genes.motorClock.frequency || 0.05
      this.motorClock.waveLength = genes.motorClock.waveLength || 0.8
      this.motorClock.amplitude = genes.motorClock.amplitude || 0.3
      this.motorClock.speed = genes.motorClock.speed || 1
      this.motorClock.period = genes.motorClock.period || Math.round(2 * Math.PI / this.motorClock.frequency)
      
      // Nouveaux paramètres v3
      this.motorClock.waveType = genes.motorClock.waveType || 'sine'
      this.motorClock.contractionBias = genes.motorClock.contractionBias || 0.6
      
      // Regénérer les poses pour la visualisation
      this.motorClock.poses = this.motorClock.generatePosesFromWave()
    } else {
      // Générer des paramètres aléatoires
      const creatureSize = this.nodes.length + this.links.length
      this.motorClock.randomize(creatureSize)
    }
    
    // Ancien système de mémoire motrice (pour compatibilité)
    this.motorMemory = {
      sequences: [],
      currentSequence: null
    }
  }

  // === CRÉATION ===
  
  createRandom(x, y) {
    // Nombre de nodes : 3 à 7 (minimum 3 pour avoir une articulation)
    const nodeCount = 3 + Math.floor(Math.random() * 5)
    const baseLength = 18 + Math.random() * 12
    
    // Créer le premier node au centre
    this.nodes.push(new Node(x, y))
    
    // Créer les autres nodes autour
    for (let i = 1; i < nodeCount; i++) {
      // Choisir un node parent existant au hasard
      const parentIdx = Math.floor(Math.random() * this.nodes.length)
      const parent = this.nodes[parentIdx]
      
      // Direction aléatoire
      const angle = Math.random() * Math.PI * 2
      const length = baseLength + (Math.random() - 0.5) * 10
      
      const newNode = new Node(
        parent.x + Math.cos(angle) * length,
        parent.y + Math.sin(angle) * length
      )
      this.nodes.push(newNode)
      
      // Créer le lien vers le parent
      this.links.push(new Link(parent, newNode, length))
    }
    
    // Ajouter quelques liens supplémentaires aléatoires (pour des formes plus complexes)
    // Mais pas trop pour éviter des structures trop rigides
    const extraLinks = Math.floor(Math.random() * 2)  // 0 à 1 liens en plus
    for (let i = 0; i < extraLinks; i++) {
      // Choisir 2 nodes non-connectés
      const idx1 = Math.floor(Math.random() * this.nodes.length)
      let idx2 = Math.floor(Math.random() * this.nodes.length)
      
      // S'assurer qu'ils sont différents
      if (idx1 === idx2) continue
      
      // Vérifier qu'ils ne sont pas déjà connectés
      const alreadyConnected = this.links.some(l => 
        (l.nodeA === this.nodes[idx1] && l.nodeB === this.nodes[idx2]) ||
        (l.nodeA === this.nodes[idx2] && l.nodeB === this.nodes[idx1])
      )
      
      if (!alreadyConnected) {
        const n1 = this.nodes[idx1]
        const n2 = this.nodes[idx2]
        const dist = Math.sqrt((n2.x - n1.x) ** 2 + (n2.y - n1.y) ** 2)
        this.links.push(new Link(n1, n2, dist))
      }
    }
  }

  createFromGenes(x, y, genes) {
    const structure = genes.structure
    
    for (const offset of structure.nodeOffsets) {
      this.nodes.push(new Node(x + offset.x, y + offset.y))
    }
    
    // Support ancien format (segments) et nouveau format (links)
    const linkData = structure.links || structure.segments || []
    
    for (const ld of linkData) {
      const idxA = ld.a !== undefined ? ld.a : ld.i1
      const idxB = ld.b !== undefined ? ld.b : ld.i2
      const length = ld.length || ld.restLength || 20
      
      if (idxA < this.nodes.length && idxB < this.nodes.length) {
        this.links.push(new Link(
          this.nodes[idxA],
          this.nodes[idxB],
          length
        ))
      }
    }
  }

  calculateMass() {
    this.mass = this.nodes.length + this.links.length * 0.5
  }

  // === GÉOMÉTRIE ===
  
  getCenterX() {
    if (this.nodes.length === 0) return 0
    return this.nodes.reduce((sum, n) => sum + n.x, 0) / this.nodes.length
  }

  getCenterY() {
    if (this.nodes.length === 0) return 0
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

  // === MISE À JOUR ===
  
  update() {
    this.age++
    this.stats.survivalTime++
    this.reproductionCooldown = Math.max(0, this.reproductionCooldown - 1)
    
    // Debuffs
    if (this.debuffs.slow > 0) this.debuffs.slow--
    if (this.debuffs.poison > 0) this.debuffs.poison--
    
    // Fenêtre de fertilité
    if (this.fertilityWindow > 0) this.fertilityWindow--
    
    // 1. HORLOGE MOTRICE → contractions
    const contractions = this.motorClock.update()
    
    // 2. APPLIQUER CONTRACTIONS
    let effectiveStrength = 0.2 + this.genes.muscleStrength * 0.3 // Base + bonus gène
    if (this.debuffs.slow > 0) effectiveStrength *= 0.5
    
    for (let i = 0; i < this.articulations.length; i++) {
      const target = contractions[i] || 0.5
      this.articulations[i].strength = effectiveStrength
      this.articulations[i].applyContraction(target)
    }
    
    // 3. FORCES ÉLASTIQUES
    for (const link of this.links) {
      link.applyElasticForce()
    }
    
    // 4. FORCES DE L'EAU
    applyWaterPhysics(this.nodes, this.links)
    
    // 5. MISE À JOUR NODES
    for (const node of this.nodes) {
      node.update()
      
      // Friction
      node.vx *= FRICTION
      node.vy *= FRICTION
      
      // Limite vitesse
      const speed = node.getSpeed()
      if (speed > MAX_SPEED) {
        node.vx = (node.vx / speed) * MAX_SPEED
        node.vy = (node.vy / speed) * MAX_SPEED
      }
      
      // Bordures
      if (node.x < 0) { node.x = 0; node.vx *= -0.3 }
      if (node.x > WORLD_WIDTH) { node.x = WORLD_WIDTH; node.vx *= -0.3 }
      if (node.y < 0) { node.y = 0; node.vy *= -0.3 }
      if (node.y > WORLD_HEIGHT) { node.y = WORLD_HEIGHT; node.vy *= -0.3 }
    }
    
    // 6. MÉTABOLISME
    let metabolismCost = this.mass * 0.005 * this.genes.metabolicEfficiency
    if (this.debuffs.poison > 0) metabolismCost *= 1.5
    this.energy -= metabolismCost
    this.stats.energyLost += metabolismCost
    
    // 7. STATS
    let totalVel = 0
    for (const node of this.nodes) {
      totalVel += node.getSpeed()
    }
    const avgVel = totalVel / this.nodes.length
    this.stats.totalSpeed += avgVel
    this.stats.speedSamples++
    
    const cx = this.getCenterX()
    const cy = this.getCenterY()
    const dist = Math.sqrt((cx - this.prevX) ** 2 + (cy - this.prevY) ** 2)
    this.stats.distanceTraveled += dist
    this.prevX = cx
    this.prevY = cy
  }

  // === REPRODUCTION ===
  
  canReproduce() {
    if (this.fertilityWindow > 0) return true
    
    const threshold = (80 + this.mass * 5) * this.genes.fertility
    const ageThreshold = 100 / this.genes.fertility
    
    const isFertile = this.energy > threshold && 
                      this.reproductionCooldown === 0 && 
                      this.age > ageThreshold
    
    if (isFertile && this.fertilityWindow === 0) {
      this.fertilityWindow = this.fertilityWindowDuration
    }
    
    return isFertile
  }

  isDead() {
    return this.energy <= 0
  }

  // === GÈNES ===
  
  getGenes() {
    const cx = this.getCenterX()
    const cy = this.getCenterY()
    
    return {
      muscleStrength: this.genes.muscleStrength,
      metabolicEfficiency: this.genes.metabolicEfficiency,
      maxEnergyBonus: this.genes.maxEnergyBonus,
      fertility: this.genes.fertility,
      color: { ...this.color },
      structure: {
        nodeOffsets: this.nodes.map(n => ({ x: n.x - cx, y: n.y - cy })),
        nodeCount: this.nodes.length,
        links: this.links.map(l => ({
          a: this.nodes.indexOf(l.nodeA),
          b: this.nodes.indexOf(l.nodeB),
          length: l.targetLength
        })),
        // Ancien format pour compatibilité
        segments: this.links.map(l => ({
          i1: this.nodes.indexOf(l.nodeA),
          i2: this.nodes.indexOf(l.nodeB),
          restLength: l.targetLength,
          strength: 0.3,
          frequency: 0.05,
          phase: 0
        }))
      },
      motorClock: {
        // Paramètres d'onde
        frequency: this.motorClock.frequency,
        waveLength: this.motorClock.waveLength,
        amplitude: this.motorClock.amplitude,
        speed: this.motorClock.speed,
        period: this.motorClock.period,
        // Nouveaux paramètres v3
        waveType: this.motorClock.waveType,
        contractionBias: this.motorClock.contractionBias,
        // Poses pour visualisation
        poses: this.motorClock.poses.map(p => [...p])
      }
    }
  }

  // === DESSIN ===
  
  draw(ctx) {
    const energyFactor = Math.min(1, this.energy / 100)
    const alpha = 0.6 + energyFactor * 0.4
    
    // Liens
    ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`
    ctx.lineWidth = 2 + this.mass * 0.15
    
    for (const link of this.links) {
      ctx.beginPath()
      ctx.moveTo(link.nodeA.x, link.nodeA.y)
      ctx.lineTo(link.nodeB.x, link.nodeB.y)
      ctx.stroke()
    }
    
    // Nodes
    ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`
    
    for (const node of this.nodes) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, 3, 0, Math.PI * 2)
      ctx.fill()
      
      if (this.canReproduce()) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
    
    // Nom
    const cx = this.getCenterX()
    const cy = this.getCenterY()
    
    ctx.textAlign = 'center'
    ctx.fillStyle = this.canReproduce() ? 'rgba(0, 255, 255, 1)' : 'rgba(255, 255, 255, 0.7)'
    ctx.font = this.canReproduce() ? 'bold 9px Arial' : '9px Arial'
    ctx.fillText(this.firstName, cx, cy - 20)
    
    if (this.familyName) {
      ctx.font = '7px Arial'
      ctx.fillStyle = 'rgba(180, 200, 255, 0.7)'
      ctx.fillText(this.familyName, cx, cy - 12)
    }
    
    // Debuffs
    let debuffY = cy - 30
    if (this.debuffs.slow > 0) {
      ctx.fillStyle = 'rgba(255, 153, 68, 0.9)'
      ctx.font = 'bold 10px Arial'
      ctx.fillText('🐌', cx - 10, debuffY)
    }
    if (this.debuffs.poison > 0) {
      ctx.fillStyle = 'rgba(204, 0, 255, 0.9)'
      ctx.font = 'bold 10px Arial'
      ctx.fillText('☠️', cx + 10, debuffY)
    }
  }

  // === SCORE ===
  
  calculateScore() {
    return (
      this.stats.foodEaten * 100 +
      this.stats.distanceTraveled * 0.5 +
      this.stats.survivalTime * 2 +
      this.stats.reproductions * 200
    )
  }
}
