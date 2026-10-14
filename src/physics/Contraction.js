/**
 * Contraction.js - Contrôle musculaire des articulations (v3)
 * 
 * Principe : créer une ONDE de contraction qui parcourt le corps
 * Comme une anguille ou un serpent qui nage
 * 
 * Nouveau : support de différentes formes d'onde
 * - sine : sinusoïdale classique
 * - asymmetric : contraction rapide, retour lent (privilégie la contraction)
 * - hold : maintient la contraction plus longtemps avant de relâcher
 * 
 * Les articulations sont DÉPHASÉES entre elles pour créer l'onde
 */

/**
 * Représente une articulation (point avec 2+ liens)
 */
export class Articulation {
  constructor(centerNode, connectedLinks) {
    this.centerNode = centerNode
    this.connectedLinks = connectedLinks
    this.contraction = 0.5
    this.strength = 0.15 // Force de contraction
  }

  getEndNodes() {
    return this.connectedLinks.map(link => {
      return link.nodeA === this.centerNode ? link.nodeB : link.nodeA
    })
  }

  /**
   * Applique la contraction
   * @param {number} targetContraction - 0 = relâché (ouvert), 1 = contracté (fermé)
   */
  applyContraction(targetContraction) {
    this.contraction = targetContraction
    
    // Force proportionnelle à l'écart par rapport au neutre
    // 0 = ouvert max, 0.5 = neutre, 1 = fermé max
    const forceFactor = (targetContraction - 0.5) * 2 * this.strength
    
    if (Math.abs(forceFactor) < 0.001) return
    
    const endNodes = this.getEndNodes()
    if (endNodes.length < 2) return
    
    // Pour chaque paire d'extrémités
    for (let i = 0; i < endNodes.length; i++) {
      for (let j = i + 1; j < endNodes.length; j++) {
        const nodeA = endNodes[i]
        const nodeB = endNodes[j]
        
        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < 1) continue
        
        const nx = dx / dist
        const ny = dy / dist
        
        // Force de contraction
        const maxForce = 0.25
        const fx = nx * Math.max(-maxForce, Math.min(maxForce, forceFactor))
        const fy = ny * Math.max(-maxForce, Math.min(maxForce, forceFactor))
        
        // Newton I : forces opposées
        nodeA.applyForce(fx, fy)
        nodeB.applyForce(-fx, -fy)
      }
    }
  }
}

/**
 * Détecte les articulations
 */
export function detectArticulations(nodes, links) {
  const articulations = []
  
  for (const node of nodes) {
    const connectedLinks = links.filter(l => l.nodeA === node || l.nodeB === node)
    if (connectedLinks.length >= 2) {
      articulations.push(new Articulation(node, connectedLinks))
    }
  }
  
  return articulations
}

/**
 * Types d'onde disponibles
 * - sine : sinusoïdale classique (symétrique)
 * - asymmetric : contraction rapide, retour lent
 * - hold : maintient la contraction avant de relâcher
 */
const WAVE_TYPES = ['sine', 'asymmetric', 'hold']

/**
 * Horloge motrice - Génère une ONDE de contraction
 * 
 * Supporte différentes formes d'onde pour des mouvements variés
 */
export class MotorClock {
  constructor(articulationCount) {
    this.articulationCount = articulationCount
    
    // Paramètres de l'onde
    this.frequency = 0.05 + Math.random() * 0.03  // Fréquence de l'onde (vitesse)
    this.waveLength = 0.5 + Math.random() * 1.0   // Longueur d'onde (décalage entre articulations)
    this.amplitude = 0.35 + Math.random() * 0.15  // Amplitude (force de contraction)
    
    // Type d'onde (nouveau)
    this.waveType = WAVE_TYPES[Math.floor(Math.random() * WAVE_TYPES.length)]
    
    // Biais vers la contraction (0.5 = neutre, >0.5 = privilégie contraction)
    this.contractionBias = 0.55 + Math.random() * 0.15
    
    // Phase actuelle
    this.phase = 0
    
    // Pour compatibilité avec l'ancien système (poses)
    this.poses = this.generatePosesFromWave()
    this.period = Math.round(2 * Math.PI / this.frequency)
    this.speed = 1
  }

  /**
   * Calcule la valeur de l'onde selon le type
   * @param {number} phase - Phase de l'onde (0 à 2π)
   * @returns {number} Valeur entre -1 et 1
   */
  getWaveValue(phase) {
    // Normaliser la phase entre 0 et 2π
    const normalizedPhase = phase % (Math.PI * 2)
    const t = normalizedPhase / (Math.PI * 2)
    
    switch (this.waveType) {
      case 'asymmetric': {
        // Contraction rapide (1/3 du cycle), retour lent (2/3 du cycle)
        if (t < 0.33) {
          return Math.sin(t * 3 * Math.PI / 2)
        } else {
          return Math.cos((t - 0.33) * 1.5 * Math.PI)
        }
      }
        
      case 'hold': {
        // Maintient la contraction pendant une partie du cycle
        if (t < 0.25) {
          return Math.sin(t * 2 * Math.PI)
        } else if (t < 0.5) {
          return 1
        } else if (t < 0.75) {
          return Math.cos((t - 0.5) * 2 * Math.PI)
        } else {
          return -0.3
        }
      }
        
      case 'sine':
      default:
        return Math.sin(phase)
    }
  }

  /**
   * Génère des poses à partir des paramètres d'onde
   * (pour la visualisation dans le modal)
   */
  generatePosesFromWave() {
    const poseCount = Math.max(3, Math.min(6, this.articulationCount + 2))
    const poses = []
    
    for (let p = 0; p < poseCount; p++) {
      const posePhase = (p / poseCount) * Math.PI * 2
      const pose = []
      
      for (let a = 0; a < this.articulationCount; a++) {
        // Onde avec déphasage par articulation
        const articulationPhase = a * this.waveLength
        const value = this.getWaveValue(posePhase + articulationPhase)
        // Convertir de [-1, 1] vers [bias - amp, bias + amp]
        pose.push(this.contractionBias + value * this.amplitude * 0.5)
      }
      
      poses.push(pose)
    }
    
    return poses
  }

  /**
   * Met à jour et retourne les contractions actuelles
   * Utilise une onde continue, pas des poses discrètes
   */
  update() {
    // Avancer la phase
    this.phase += this.frequency * this.speed
    
    // Calculer la contraction de chaque articulation
    const contractions = []
    
    for (let a = 0; a < this.articulationCount; a++) {
      // Déphasage basé sur la position de l'articulation
      const articulationPhase = a * this.waveLength
      
      // Obtenir la valeur de l'onde selon le type
      const waveValue = this.getWaveValue(this.phase + articulationPhase)
      
      // Convertir vers la plage de contraction avec biais
      // Le biais décale le centre vers la contraction
      const contraction = this.contractionBias + waveValue * this.amplitude * 0.5
      
      // Clamper entre 0 et 1
      contractions.push(Math.max(0, Math.min(1, contraction)))
    }
    
    return contractions
  }

  /**
   * Génère des paramètres d'onde aléatoires
   */
  randomize() {
    // Fréquence de l'onde
    this.frequency = 0.04 + Math.random() * 0.04
    
    // Longueur d'onde : détermine le type de mouvement
    // Court = ondulation serrée, Long = ondulation large
    this.waveLength = 0.3 + Math.random() * 1.2
    
    // Amplitude : force du mouvement (réduite)
    this.amplitude = 0.25 + Math.random() * 0.15
    
    // Type d'onde aléatoire
    this.waveType = WAVE_TYPES[Math.floor(Math.random() * WAVE_TYPES.length)]
    
    // Biais vers contraction (toujours >= 0.5)
    this.contractionBias = 0.55 + Math.random() * 0.15
    
    // Regénérer les poses pour la visualisation
    this.poses = this.generatePosesFromWave()
    this.period = Math.round(2 * Math.PI / this.frequency)
  }

  clone() {
    const clock = new MotorClock(this.articulationCount)
    clock.frequency = this.frequency
    clock.waveLength = this.waveLength
    clock.amplitude = this.amplitude
    clock.waveType = this.waveType
    clock.contractionBias = this.contractionBias
    clock.phase = 0
    clock.poses = this.generatePosesFromWave()
    clock.period = this.period
    clock.speed = this.speed
    return clock
  }

  mutate(mutationRate = 0.15) {
    if (Math.random() < mutationRate) {
      this.frequency = Math.max(0.02, Math.min(0.1, 
        this.frequency + (Math.random() - 0.5) * 0.02))
    }
    
    if (Math.random() < mutationRate) {
      this.waveLength = Math.max(0.2, Math.min(2.0, 
        this.waveLength + (Math.random() - 0.5) * 0.3))
    }
    
    if (Math.random() < mutationRate) {
      this.amplitude = Math.max(0.15, Math.min(0.4, 
        this.amplitude + (Math.random() - 0.5) * 0.1))
    }
    
    // Mutation du type d'onde (plus rare)
    if (Math.random() < mutationRate * 0.3) {
      this.waveType = WAVE_TYPES[Math.floor(Math.random() * WAVE_TYPES.length)]
    }
    
    // Mutation du biais
    if (Math.random() < mutationRate) {
      this.contractionBias = Math.max(0.5, Math.min(0.75, 
        this.contractionBias + (Math.random() - 0.5) * 0.1))
    }
    
    // Regénérer les poses
    this.poses = this.generatePosesFromWave()
    this.period = Math.round(2 * Math.PI / this.frequency)
  }

  /**
   * Pour la compatibilité avec l'ancien système
   */
  generateDefaultPoses() {
    return this.generatePosesFromWave()
  }
}
