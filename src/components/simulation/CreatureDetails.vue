<template>
  <q-dialog v-model="isOpen">
    <q-card class="creature-details-card" style="min-width: 650px; max-width: 850px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-aqua">📊 Détails de {{ creature?.firstName }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="creature" class="q-pa-none">
        <q-tabs
          v-model="activeTab"
          dense
          class="tabs-bg"
          active-color="cyan"
          indicator-color="cyan"
          align="justify"
        >
          <q-tab name="identity" label="👤 Identité" />
          <q-tab name="vital" label="💚 Vital" />
          <q-tab name="motor" label="🎯 Motricité" />
          <q-tab name="physical" label="🧬 Physique" />
          <q-tab name="genes" label="🧪 Gènes" />
          <q-tab name="reproduction" label="💕 Reproduction" />
          <q-tab name="performance" label="📈 Performance" />
          <q-tab name="debuffs" label="⚠️ Debuffs" v-if="creature.debuffs.slow > 0 || creature.debuffs.poison > 0" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated swipeable class="panels-bg">
          <!-- IDENTITÉ -->
          <q-tab-panel name="identity" class="scroll-panel">
            <q-list bordered separator class="rounded-borders">
              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Prénom</q-item-label>
                  <q-item-label class="label-value">{{ creature.firstName }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="creature.familyName">
                <q-item-section>
                  <q-item-label class="label-title">Famille</q-item-label>
                  <q-item-label class="label-value">{{ creature.familyName }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Génération</q-item-label>
                  <q-item-label class="label-value">{{ creature.generation }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Âge</q-item-label>
                  <q-item-label class="label-value">
                    {{ creature.age }} frames ({{ (creature.age / 60).toFixed(1) }}s)
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- VITAL -->
          <q-tab-panel name="vital" class="scroll-panel">
            <q-list bordered separator class="rounded-borders">
              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Énergie</q-item-label>
                  <q-item-label caption class="label-desc">
                    Carburant vital. La créature meurt si elle atteint 0.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ Math.floor(creature.energy) }} / {{ creature.maxEnergy }}
                  </q-item-label>
                  <q-linear-progress
                    :value="creature.energy / creature.maxEnergy"
                    color="positive"
                    class="q-mt-sm"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Masse</q-item-label>
                  <q-item-label caption class="label-desc">
                    Poids total. Plus lourd = plus lent mais peut manger les petits.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.mass.toFixed(2) }} ({{ creature.nodes.length }} nœuds)
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Rayon</q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.getRadius().toFixed(1) }}px
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Position</q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    X: {{ Math.floor(creature.getCenterX()) }}, Y: {{ Math.floor(creature.getCenterY()) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- MOTRICITÉ -->
          <q-tab-panel name="motor" class="scroll-panel">
            <!-- Visualiseur de poses -->
            <div class="pose-visualizer q-mb-md">
              <div class="visualizer-header row items-center justify-between q-mb-sm">
                <span class="text-cyan-4">🎬 Visualisation des Poses</span>
                <div class="row q-gutter-sm">
                  <q-btn 
                    dense 
                    size="sm" 
                    :icon="isPlaying ? 'pause' : 'play_arrow'" 
                    :color="isPlaying ? 'orange' : 'positive'"
                    @click="togglePlay"
                  />
                  <q-btn dense size="sm" icon="skip_previous" color="grey" @click="prevPose" :disable="isPlaying" />
                  <q-btn dense size="sm" icon="skip_next" color="grey" @click="nextPose" :disable="isPlaying" />
                  <q-btn dense size="sm" icon="refresh" color="grey" @click="resetPreview" />
                </div>
              </div>
              
              <div class="visualizer-container">
                <canvas ref="previewCanvas" width="300" height="200" class="preview-canvas"></canvas>
                <div class="pose-indicator">
                  Pose {{ currentPoseIndex + 1 }} / {{ creature.motorClock?.poses?.length || 0 }}
                </div>
              </div>

              <!-- Slider de vitesse -->
              <div class="row items-center q-mt-sm q-gutter-sm">
                <span class="text-grey-5" style="font-size: 11px">Vitesse:</span>
                <q-slider
                  v-model="previewSpeed"
                  :min="0.25"
                  :max="3"
                  :step="0.25"
                  dense
                  style="width: 120px"
                  color="cyan"
                />
                <span class="text-cyan-4" style="font-size: 11px">{{ previewSpeed }}x</span>
              </div>
            </div>

            <q-list bordered separator class="rounded-borders">
              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Articulations</q-item-label>
                  <q-item-label caption class="label-desc">
                    Points de flexion (nœuds avec 2+ liens). Contrôlent le mouvement.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.articulations ? creature.articulations.length : 0 }} articulation(s)
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="creature.motorClock">
                <q-item-section>
                  <q-item-label class="label-title">Horloge Motrice</q-item-label>
                  <q-item-label caption class="label-desc">
                    Cycle de contraction des articulations
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    Période: {{ creature.motorClock.period }} frames ({{ (creature.motorClock.period / 50).toFixed(1) }}s)
                  </q-item-label>
                  <q-item-label class="label-value">
                    Vitesse: {{ creature.motorClock.speed.toFixed(2) }}x
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="creature.motorClock && creature.motorClock.poses">
                <q-item-section>
                  <q-item-label class="label-title">Séquence de Poses</q-item-label>
                  <q-item-label caption class="label-desc q-mb-sm">
                    {{ creature.motorClock.poses.length }} pose(s) - Cliquez sur une pose pour la prévisualiser
                  </q-item-label>

                  <div class="poses-grid">
                    <div 
                      v-for="(pose, index) in creature.motorClock.poses" 
                      :key="index" 
                      class="pose-card"
                      :class="{ active: currentPoseIndex === index }"
                      @click="selectPose(index)"
                    >
                      <div class="pose-title">Pose {{ index + 1 }}</div>
                      <div class="pose-contractions">
                        <div 
                          v-for="(contraction, jointIdx) in pose" 
                          :key="jointIdx"
                          class="contraction-bar"
                          :style="{ 
                            width: (contraction * 100) + '%',
                            backgroundColor: getContractionColor(contraction)
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- PHYSIQUE -->
          <q-tab-panel name="physical" class="scroll-panel">
            <q-list bordered separator class="rounded-borders">
              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Nœuds</q-item-label>
                  <q-item-label caption class="label-desc">
                    Points de masse du squelette.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.nodes.length }} nœuds
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Liens</q-item-label>
                  <q-item-label caption class="label-desc">
                    Segments élastiques entre les nœuds.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.links.length }} liens
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Couleur</q-item-label>
                  <q-item-label class="row items-center q-mt-sm">
                    <q-badge
                      :style="{
                        backgroundColor: `rgb(${creature.color.r}, ${creature.color.g}, ${creature.color.b})`,
                        width: '20px',
                        height: '20px',
                        marginRight: '8px'
                      }"
                    />
                    <span class="label-value">
                      RGB({{ Math.floor(creature.color.r) }}, {{ Math.floor(creature.color.g) }}, {{ Math.floor(creature.color.b) }})
                    </span>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- GÈNES -->
          <q-tab-panel name="genes" class="scroll-panel">
            <q-list bordered separator class="rounded-borders">
              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Force Musculaire</q-item-label>
                  <q-item-label caption class="label-desc">
                    Puissance de contraction des articulations.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.genes.muscleStrength.toFixed(3) }}
                  </q-item-label>
                  <q-linear-progress
                    :value="creature.genes.muscleStrength / 0.8"
                    color="blue"
                    class="q-mt-sm"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Efficacité Métabolique</q-item-label>
                  <q-item-label caption class="label-desc">
                    Multiplicateur du coût énergétique. Plus bas = meilleur.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.genes.metabolicEfficiency.toFixed(3) }}
                  </q-item-label>
                  <q-linear-progress
                    :value="1 - (creature.genes.metabolicEfficiency - 0.5) / 0.5"
                    color="green"
                    class="q-mt-sm"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Bonus Énergie Max</q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    +{{ creature.genes.maxEnergyBonus }} (total: {{ creature.maxEnergy }})
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Fertilité</q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.genes.fertility.toFixed(3) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- REPRODUCTION -->
          <q-tab-panel name="reproduction" class="scroll-panel">
            <q-list bordered separator class="rounded-borders">
              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Peut se Reproduire</q-item-label>
                  <q-item-label class="q-mt-sm">
                    <q-chip
                      :color="creature.canReproduce() ? 'positive' : 'negative'"
                      text-color="white"
                      size="sm"
                    >
                      {{ creature.canReproduce() ? '✅ OUI' : '❌ NON' }}
                    </q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Cooldown</q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.reproductionCooldown }} frames ({{ (creature.reproductionCooldown / 60).toFixed(1) }}s)
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Fenêtre de Fertilité</q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.fertilityWindow }} frames
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- PERFORMANCE -->
          <q-tab-panel name="performance" class="scroll-panel">
            <q-list bordered separator class="rounded-borders">
              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Nourriture Mangée</q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.stats.foodEaten }} unités
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Distance Parcourue</q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.stats.distanceTraveled.toFixed(1) }} pixels
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Temps de Survie</q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ (creature.stats.survivalTime / 60).toFixed(1) }}s
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Reproductions</q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.stats.reproductions }} enfants
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Vitesse Moyenne</q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.stats.speedSamples > 0
                        ? (creature.stats.totalSpeed / creature.stats.speedSamples).toFixed(3)
                        : '0.000' }} px/frame
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Score Total</q-item-label>
                  <q-item-label class="q-mt-sm">
                    <q-chip color="amber" text-color="black" size="md">
                      {{ Math.floor(creature.calculateScore()) }} points
                    </q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- DEBUFFS -->
          <q-tab-panel name="debuffs" class="scroll-panel" v-if="creature.debuffs.slow > 0 || creature.debuffs.poison > 0">
            <q-list bordered separator class="rounded-borders">
              <q-item v-if="creature.debuffs.slow > 0">
                <q-item-section>
                  <q-item-label class="label-title">🐌 Ralentissement</q-item-label>
                  <q-item-label class="q-mt-sm">
                    <q-chip color="orange" text-color="white" size="sm">
                      {{ (creature.debuffs.slow / 60).toFixed(1) }}s restantes
                    </q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="creature.debuffs.poison > 0">
                <q-item-section>
                  <q-item-label class="label-title">☠️ Poison</q-item-label>
                  <q-item-label class="q-mt-sm">
                    <q-chip color="purple" text-color="white" size="sm">
                      {{ (creature.debuffs.poison / 60).toFixed(1) }}s restantes
                    </q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  creature: Object
})

const emit = defineEmits(['update:modelValue'])
const activeTab = ref('identity')
const isOpen = ref(props.modelValue)

// Preview state
const previewCanvas = ref(null)
const currentPoseIndex = ref(0)
const isPlaying = ref(false)
const previewSpeed = ref(1)
const animationFrame = ref(null)
const previewTime = ref(0)

// Structure de prévisualisation (copie simplifiée)
const previewNodes = ref([])
const previewLinks = ref([])

watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal
    if (newVal && props.creature) {
      nextTick(() => {
        initPreview()
      })
    } else {
      stopAnimation()
    }
  }
)

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)
  if (!newVal) {
    stopAnimation()
  }
})

watch(activeTab, (newVal) => {
  if (newVal === 'motor' && props.creature) {
    nextTick(() => {
      initPreview()
    })
  }
})

watch(currentPoseIndex, () => {
  if (!isPlaying.value) {
    drawPreview()
  }
})

function initPreview() {
  if (!props.creature || !previewCanvas.value) return
  
  // Créer une copie de la structure pour la prévisualisation
  const creature = props.creature
  const cx = creature.getCenterX()
  const cy = creature.getCenterY()
  
  // Copier les nodes avec positions relatives au centre
  previewNodes.value = creature.nodes.map(n => ({
    x: n.x - cx,
    y: n.y - cy,
    baseX: n.x - cx,
    baseY: n.y - cy
  }))
  
  // Copier les liens
  previewLinks.value = creature.links.map(l => ({
    a: creature.nodes.indexOf(l.nodeA),
    b: creature.nodes.indexOf(l.nodeB),
    length: l.targetLength
  }))
  
  currentPoseIndex.value = 0
  drawPreview()
}

function drawPreview() {
  const canvas = previewCanvas.value
  if (!canvas || !props.creature) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  const creature = props.creature
  
  // Clear
  ctx.fillStyle = '#0d3a52'
  ctx.fillRect(0, 0, width, height)
  
  // Calculer le centre et l'échelle
  const centerX = width / 2
  const centerY = height / 2
  
  // Calculer les positions avec la pose actuelle
  const poses = creature.motorClock?.poses || []
  const pose = poses[currentPoseIndex.value] || []
  const articulations = creature.articulations || []
  
  // Appliquer la pose aux nodes de preview
  applyPoseToPreview(pose, articulations)
  
  // Dessiner les liens
  ctx.strokeStyle = `rgba(${creature.color.r}, ${creature.color.g}, ${creature.color.b}, 0.9)`
  ctx.lineWidth = 3
  
  for (const link of previewLinks.value) {
    const nodeA = previewNodes.value[link.a]
    const nodeB = previewNodes.value[link.b]
    if (!nodeA || !nodeB) continue
    
    ctx.beginPath()
    ctx.moveTo(centerX + nodeA.x, centerY + nodeA.y)
    ctx.lineTo(centerX + nodeB.x, centerY + nodeB.y)
    ctx.stroke()
  }
  
  // Dessiner les nodes
  ctx.fillStyle = `rgb(${creature.color.r}, ${creature.color.g}, ${creature.color.b})`
  
  for (let i = 0; i < previewNodes.value.length; i++) {
    const node = previewNodes.value[i]
    
    // Vérifier si c'est une articulation
    const isArticulation = previewLinks.value.filter(l => l.a === i || l.b === i).length >= 2
    
    ctx.beginPath()
    ctx.arc(centerX + node.x, centerY + node.y, isArticulation ? 5 : 3, 0, Math.PI * 2)
    ctx.fill()
    
    // Halo pour les articulations
    if (isArticulation) {
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }
  
  // Indicateur de contraction pour chaque articulation
  let artIdx = 0
  for (let i = 0; i < previewNodes.value.length; i++) {
    const connectedLinks = previewLinks.value.filter(l => l.a === i || l.b === i)
    if (connectedLinks.length >= 2 && artIdx < pose.length) {
      const node = previewNodes.value[i]
      const contraction = pose[artIdx] || 0.5
      
      // Petit indicateur de contraction
      ctx.fillStyle = getContractionColor(contraction)
      ctx.font = '10px Arial'
      ctx.fillText(`${Math.floor(contraction * 100)}%`, centerX + node.x + 8, centerY + node.y - 5)
      
      artIdx++
    }
  }
}

function applyPoseToPreview(pose, articulations) {
  // Reset aux positions de base
  for (const node of previewNodes.value) {
    node.x = node.baseX
    node.y = node.baseY
  }
  
  // Appliquer les contractions (effet visuel simplifié)
  let artIdx = 0
  for (let i = 0; i < previewNodes.value.length; i++) {
    const connectedLinks = previewLinks.value.filter(l => l.a === i || l.b === i)
    
    if (connectedLinks.length >= 2 && artIdx < pose.length) {
      const contraction = pose[artIdx] || 0.5
      const contractionFactor = (contraction - 0.5) * 0.4
      
      // Pour chaque paire de liens connectés, ajuster l'angle
      for (let j = 0; j < connectedLinks.length; j++) {
        const link = connectedLinks[j]
        const otherNodeIdx = link.a === i ? link.b : link.a
        const otherNode = previewNodes.value[otherNodeIdx]
        const centerNode = previewNodes.value[i]
        
        if (!otherNode || !centerNode) continue
        
        // Direction du centre vers l'extrémité
        const dx = otherNode.x - centerNode.x
        const dy = otherNode.y - centerNode.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < 0.1) continue
        
        // Rotation selon la contraction
        const angle = Math.atan2(dy, dx)
        const sign = j % 2 === 0 ? 1 : -1
        const newAngle = angle + contractionFactor * sign * 0.5
        
        otherNode.x = centerNode.x + Math.cos(newAngle) * dist
        otherNode.y = centerNode.y + Math.sin(newAngle) * dist
      }
      
      artIdx++
    }
  }
}

function togglePlay() {
  if (isPlaying.value) {
    stopAnimation()
  } else {
    startAnimation()
  }
}

function startAnimation() {
  isPlaying.value = true
  previewTime.value = 0
  animate()
}

function stopAnimation() {
  isPlaying.value = false
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
    animationFrame.value = null
  }
}

function animate() {
  if (!isPlaying.value || !props.creature) return
  
  const poses = props.creature.motorClock?.poses || []
  if (poses.length === 0) return
  
  // Avancer le temps
  previewTime.value += previewSpeed.value * 2
  
  // Calculer la pose interpolée
  const period = props.creature.motorClock?.period || 100
  const cyclePos = (previewTime.value % period) / period
  const poseFloat = cyclePos * poses.length
  const poseIdx = Math.floor(poseFloat) % poses.length
  
  currentPoseIndex.value = poseIdx
  drawPreview()
  
  animationFrame.value = requestAnimationFrame(animate)
}

function prevPose() {
  const poses = props.creature?.motorClock?.poses || []
  if (poses.length === 0) return
  currentPoseIndex.value = (currentPoseIndex.value - 1 + poses.length) % poses.length
}

function nextPose() {
  const poses = props.creature?.motorClock?.poses || []
  if (poses.length === 0) return
  currentPoseIndex.value = (currentPoseIndex.value + 1) % poses.length
}

function selectPose(index) {
  currentPoseIndex.value = index
  if (isPlaying.value) {
    stopAnimation()
  }
}

function resetPreview() {
  stopAnimation()
  currentPoseIndex.value = 0
  previewTime.value = 0
  initPreview()
}

function getContractionColor(value) {
  // Rouge (contracté) → Bleu (relâché)
  const r = Math.floor(255 * value)
  const b = Math.floor(255 * (1 - value))
  return `rgb(${r}, 100, ${b})`
}

onUnmounted(() => {
  stopAnimation()
})
</script>

<style scoped lang="sass">
.creature-details-card
  background: rgba(15, 50, 75, 0.98)
  color: #ffffff

.text-aqua
  color: #90d5ff

.tabs-bg
  background: rgba(20, 60, 90, 0.6)
  color: #d0f0ff

.panels-bg
  background: transparent

.scroll-panel
  max-height: 60vh
  overflow-y: auto

.label-title
  color: #90d5ff
  font-weight: 600
  font-size: 0.95rem

.label-desc
  color: #b0d5ff
  font-size: 0.8rem
  margin-top: 4px

.label-value
  color: #ffffff
  font-size: 0.9rem

.q-list
  background: rgba(20, 60, 90, 0.4)
  border-color: rgba(100, 200, 255, 0.3)

.q-item
  color: #ffffff

  &:hover
    background: rgba(30, 70, 100, 0.5)

// Visualiseur de poses
.pose-visualizer
  background: rgba(10, 40, 60, 0.6)
  border: 1px solid rgba(0, 200, 255, 0.3)
  border-radius: 8px
  padding: 12px

.visualizer-header
  font-size: 12px
  font-weight: 600

.visualizer-container
  position: relative
  display: flex
  justify-content: center
  
.preview-canvas
  background: #0d3a52
  border: 1px solid rgba(0, 200, 255, 0.4)
  border-radius: 6px

.pose-indicator
  position: absolute
  bottom: 8px
  right: 8px
  background: rgba(0, 0, 0, 0.6)
  padding: 2px 8px
  border-radius: 4px
  font-size: 11px
  color: #90d5ff

// Grille des poses
.poses-grid
  display: flex
  flex-wrap: wrap
  gap: 8px
  margin-top: 8px

.pose-card
  background: rgba(20, 60, 90, 0.5)
  border: 1px solid rgba(100, 200, 255, 0.3)
  border-radius: 6px
  padding: 8px
  min-width: 80px
  cursor: pointer
  transition: all 0.2s
  
  &:hover
    background: rgba(30, 80, 120, 0.6)
    border-color: rgba(100, 200, 255, 0.6)
  
  &.active
    background: rgba(0, 150, 200, 0.3)
    border-color: rgba(0, 255, 255, 0.8)
    box-shadow: 0 0 8px rgba(0, 255, 255, 0.3)

.pose-title
  font-size: 10px
  color: #90d5ff
  margin-bottom: 4px
  text-align: center

.pose-contractions
  display: flex
  flex-direction: column
  gap: 2px

.contraction-bar
  height: 4px
  border-radius: 2px
  min-width: 5px
  transition: width 0.2s
</style>
