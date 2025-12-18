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
