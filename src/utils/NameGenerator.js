const PREFIXES = [
  // Aquatique / Fluide
  'Aqua', 'Hydro', 'Maris', 'Pelago', 'Thalasso', 'Neréo', 'Abyss', 'Batho',
  'Fluvi', 'Limo', 'Brack', 'Salin', 'Cryo', 'Thermo',

  // Biologique / Cellulaire
  'Bio', 'Cyto', 'Mito', 'Zygo', 'Proto', 'Morpho', 'Plasma', 'Viro',
  'Gen', 'Nucleo', 'Chromo', 'Helixo', 'RNA', 'DNA',

  // Micro / Nano
  'Nano', 'Micro', 'Pico', 'Femto', 'Sub', 'Mini',

  // Évolution / Temps
  'Neo', 'Archa', 'Prime', 'Evo', 'Retro', 'Meta', 'Post', 'Pre',

  // Mouvement / Énergie
  'Flux', 'Kineti', 'Oscillo', 'Vecto', 'Pulse', 'Spira',

  // Abstrait / Expérimental
  'Xeno', 'Alpha', 'Beta', 'Delta', 'Omega'
]

const SUFFIXES = [
  // Organique / Cellulaire
  'cyte', 'zoa', 'morph', 'blast', 'pod', 'plex', 'tide', 'core',
  'mass', 'node', 'seed', 'spawn',

  // Mouvement / Fluide
  'wave', 'flow', 'drift', 'glide', 'slip', 'swarm', 'pulse',
  'ripple', 'eddy', 'stream',

  // Énergie / Physique
  'ion', 'flux', 'charge', 'field', 'spark', 'arc',

  // Vie / Comportement
  'belle', 'lurker', 'grazer', 'seeker', 'stalker',
  'feeder', 'hunter', 'leech',

  // Proto / Expérimental
  'form', 'phase', 'state', 'variant', 'echo',
  'trace', 'shift', 'loop'
]


export function generateFirstName() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)]
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]
  const number = Math.floor(Math.random() * 99)
  return `${prefix}${suffix}-${number}`
}

export function createFamilyName(parent1Name, parent2Name) {
  const extract = (name) => {
    if (!name) return PREFIXES[Math.floor(Math.random() * PREFIXES.length)]
    const parts = name.split('-')
    return parts[0]
  }

  const part1 = extract(parent1Name)
  const part2 = extract(parent2Name)

  return `${part1}-${part2}`
}
