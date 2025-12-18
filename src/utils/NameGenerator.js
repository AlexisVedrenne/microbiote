const PREFIXES = ['Aqua', 'Hydro', 'Nano', 'Micro', 'Proto', 'Neo', 'Cyto', 'Bio', 'Plankto', 'Vitro', 'Zygo', 'Mito']
const SUFFIXES = ['belle', 'flux', 'wave', 'drift', 'glide', 'pulse', 'ion', 'zoa', 'cyte', 'morph', 'pod', 'blast']

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
