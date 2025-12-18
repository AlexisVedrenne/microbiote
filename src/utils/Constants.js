// ============================================
// CONSTANTES GLOBALES - SIMULATION MICROBIOTE
// ============================================

// Monde et caméra
export const WORLD_WIDTH = 5000
export const WORLD_HEIGHT = 5000
export const GENERATION_DURATION = 1800 // 30 secondes à 60fps
export const MAX_DEATH_HISTORY = 100

// Constantes créatures
export const MIN_NODES = 3
export const MIN_SEGMENTS = 2
export const MAX_SEGMENTS = 12
export const MAX_SPEED = 8.0 // pixels/frame

// Reproduction
export const REPRODUCTION_BASE_COST = 50
export const REPRODUCTION_MASS_MULTIPLIER = 4
export const REPRODUCTION_BASE_COOLDOWN = 200
export const REPRODUCTION_COOLDOWN_MULTIPLIER = 15
export const FERTILITY_WINDOW_DURATION = 1800 // 30 secondes
export const AGE_FOR_FERTILITY = 100 // frames

// Métabolisme
export const METABOLISM_RATE = 0.008
export const DEFAULT_METABOLIC_EFFICIENCY = 1.0
export const DEFAULT_MUSCLE_STRENGTH = 0.2

// Physique
export const WATER_FRICTION_BASE = 0.92
export const WATER_FRICTION_MASS_PENALTY = 0.005
export const LATERAL_FRICTION = 0.75
export const SEGMENT_SPRING_FORCE = 0.8
export const SEGMENT_BEAT_FORCE = 2.5
export const CONSTRAINT_ITERATIONS = 3

// Température
export const MIN_TEMP = 5 // Température minimale (bas du monde)
export const MAX_TEMP = 30 // Température maximale (haut du monde)

// Types de nourriture
export const FOOD_TYPES = {
  NORMAL: {
    name: 'normal',
    energy: 40,
    color1: '#00ff88',
    color2: '#00aa55',
    size: 4,
    probability: 0.60 // 60%
  },
  RICH: {
    name: 'rich',
    energy: 80,
    color1: '#ffdd00',
    color2: '#ff8800',
    size: 6,
    probability: 0.20 // 20%
  },
  WEAKENING: {
    name: 'weakening',
    energy: 30,
    color1: '#ff9944',
    color2: '#ff6622',
    size: 4,
    debuff: 'slow',
    debuffDuration: 300, // 5 secondes
    probability: 0.15 // 15%
  },
  POISONED: {
    name: 'poisoned',
    energy: 20,
    color1: '#cc00ff',
    color2: '#880088',
    size: 4,
    debuff: 'poison',
    debuffDuration: 600, // 10 secondes
    probability: 0.05 // 5%
  }
}

// Causes de mort
export const DEATH_CAUSES = {
  STARVATION: 'starvation',
  CANNIBALISM: 'cannibalism',
  OLD_AGE: 'old_age'
}

// Caméra
export const CAMERA_MIN_ZOOM = 0.3
export const CAMERA_MAX_ZOOM = 2.0
export const CAMERA_ZOOM_INTENSITY = 0.1

// UI
export const MAX_EVENTS = 10

// Types de propulsion
export const PROPULSION_TYPES = {
  UNDULATION: 'UNDULATION',     // Ondulation (anguille)
  OSCILLATION: 'OSCILLATION',   // Battement caudale (requin)
  JET: 'JET',                   // Jet propulsion (méduse)
  ROWING: 'ROWING',             // Rames (tortue)
  VIBRATION: 'VIBRATION'        // Vibration rapide (hippocampe)
}

// Configuration de chaque type de propulsion
export const PROPULSION_CONFIGS = {
  UNDULATION: {
    name: 'Ondulation',
    emoji: '🐍',
    color: { r: 100, g: 200, b: 255 },      // Bleu clair
    baseFrequency: 0.07,                     // Fréquence moyenne
    frequencyVariance: 0.03,                 // Variance ±
    forceMultiplier: 2.5,                    // Force de battement
    energyCost: 1.0,                         // Coût énergétique normal
    speedPotential: 1.0,                     // Vitesse potentielle
    maneuverability: 1.0,                    // Maniabilité
    description: 'Vague qui parcourt le corps - Équilibré'
  },
  OSCILLATION: {
    name: 'Oscillation',
    emoji: '🦈',
    color: { r: 50, g: 150, b: 255 },       // Bleu foncé
    baseFrequency: 0.05,                     // Plus lent
    frequencyVariance: 0.02,
    forceMultiplier: 4.0,                    // Très puissant
    energyCost: 1.3,                         // Coûteux
    speedPotential: 1.5,                     // Très rapide
    maneuverability: 0.6,                    // Peu maniable
    description: 'Battement puissant - Rapide mais rigide'
  },
  JET: {
    name: 'Jet',
    emoji: '🪼',
    color: { r: 200, g: 100, b: 255 },      // Violet
    baseFrequency: 0.03,                     // Très lent (impulsions)
    frequencyVariance: 0.01,
    forceMultiplier: 6.0,                    // Impulsions fortes
    energyCost: 1.4,                         // Très coûteux
    speedPotential: 0.8,                     // Moyen par à-coups
    maneuverability: 1.5,                    // Très maniable
    description: 'Impulsions synchronisées - Agile mais coûteux'
  },
  ROWING: {
    name: 'Rame',
    emoji: '🐢',
    color: { r: 150, g: 200, b: 150 },      // Vert
    baseFrequency: 0.06,
    frequencyVariance: 0.02,
    forceMultiplier: 1.8,                    // Force modérée
    energyCost: 0.7,                         // Très efficace
    speedPotential: 0.7,                     // Lent
    maneuverability: 0.9,                    // Stable
    description: 'Rames latérales - Lent mais très efficace'
  },
  VIBRATION: {
    name: 'Vibration',
    emoji: '🐠',
    color: { r: 255, g: 200, b: 100 },      // Orange
    baseFrequency: 0.15,                     // Très rapide
    frequencyVariance: 0.05,
    forceMultiplier: 1.2,                    // Force faible
    energyCost: 0.9,                         // Assez efficace
    speedPotential: 0.5,                     // Très lent
    maneuverability: 1.3,                    // Très précis
    description: 'Vibrations rapides - Précis et stable'
  }
}

// Probabilité de mutation du type de propulsion
export const PROPULSION_MUTATION_RATE = 0.05 // 5%
