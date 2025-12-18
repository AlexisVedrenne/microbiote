<template>
  <q-dialog v-model="isOpen">
    <q-card class="creature-details-card" style="min-width: 600px; max-width: 800px">
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
          <q-tab name="propulsion" label="🏊 Propulsion" />
          <q-tab name="physical" label="🧬 Physique" />
          <q-tab name="genes" label="🧪 Gènes" />
          <q-tab name="reproduction" label="💕 Reproduction" />
          <q-tab name="performance" label="📈 Performance" />
          <q-tab name="debuffs" label="⚠️ Debuffs" v-if="creature.debuffs.slow > 0 || creature.debuffs.poison > 0" />
          <q-tab name="memory" label="🧠 Apprentissage" />
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
                    Carburant vital. Diminue avec le métabolisme et les mouvements. La créature meurt si elle atteint 0.
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
                    Poids total (nœuds × 2). Masse élevée = plus lent mais peut manger les petits.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.mass.toFixed(2) }} ({{ creature.nodes.length }} nœuds)
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Rayon</q-item-label>
                  <q-item-label caption class="label-desc">
                    Taille physique. Détermine la zone de collision.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.getRadius().toFixed(1) }}px
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Position</q-item-label>
                  <q-item-label caption class="label-desc">
                    Coordonnées dans le monde. Y détermine la température (haut=chaud, bas=froid).
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    X: {{ Math.floor(creature.getCenterX()) }}, Y: {{ Math.floor(creature.getCenterY()) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- PROPULSION -->
          <q-tab-panel name="propulsion" class="scroll-panel">
            <q-list bordered separator class="rounded-borders">
              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Type de Nage</q-item-label>
                  <q-item-label caption class="label-desc">
                    Stratégie de propulsion. Détermine le style de mouvement, la vitesse et l'efficacité énergétique.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ getPropulsionEmoji(creature.genes.propulsionType) }} {{ getPropulsionName(creature.genes.propulsionType) }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Description</q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ getPropulsionConfig(creature.genes.propulsionType).description }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Caractéristiques</q-item-label>
                  <q-item-label caption class="label-desc q-mt-sm">
                    Multiplicateur de force: ×{{ getPropulsionConfig(creature.genes.propulsionType).forceMultiplier.toFixed(1) }}
                  </q-item-label>
                  <q-item-label caption class="label-desc">
                    Coût énergétique: ×{{ getPropulsionConfig(creature.genes.propulsionType).energyCost.toFixed(1) }}
                  </q-item-label>
                  <q-item-label caption class="label-desc">
                    Potentiel de vitesse: {{ (getPropulsionConfig(creature.genes.propulsionType).speedPotential * 100).toFixed(0) }}%
                  </q-item-label>
                  <q-item-label caption class="label-desc">
                    Maniabilité: {{ (getPropulsionConfig(creature.genes.propulsionType).maneuverability * 100).toFixed(0) }}%
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Fréquence d'Oscillation</q-item-label>
                  <q-item-label caption class="label-desc">
                    Vitesse des battements. Varie selon le type de propulsion.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ getPropulsionConfig(creature.genes.propulsionType).baseFrequency.toFixed(3) }} ± {{ getPropulsionConfig(creature.genes.propulsionType).frequencyVariance.toFixed(3) }}
                  </q-item-label>
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
                    Points de masse du squelette. Plus de nœuds = plus lourd.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.nodes.length }} nœuds
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Segments</q-item-label>
                  <q-item-label caption class="label-desc">
                    Articulations qui génèrent la propulsion. Plus de segments = mouvement complexe mais coût élevé.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.segments.length }} segments
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
                    Puissance de nage. Valeur élevée = nage rapide mais plus de consommation.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.genes.muscleStrength.toFixed(3) }} (min: 0.2, max: 0.6)
                  </q-item-label>
                  <q-linear-progress
                    :value="creature.genes.muscleStrength / 0.6"
                    color="blue"
                    class="q-mt-sm"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Efficacité Métabolique</q-item-label>
                  <q-item-label caption class="label-desc">
                    Multiplicateur du coût énergétique. Plus bas = meilleur (0.5 = deux fois plus efficace que 1.0).
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.genes.metabolicEfficiency.toFixed(3) }} (min: 0.5, max: 1.0)
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
                  <q-item-label class="label-title">Bonus Capacité Énergétique</q-item-label>
                  <q-item-label caption class="label-desc">
                    Augmente l'énergie max (base 100). Permet de survivre plus longtemps.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    +{{ creature.genes.maxEnergyBonus }} (total: {{ creature.maxEnergy }})
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Fertilité</q-item-label>
                  <q-item-label caption class="label-desc">
                    Multiplicateur de reproduction. Plus bas = reproduction plus facile (0.5 = deux fois plus fertile).
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.genes.fertility.toFixed(3) }} (min: 0.5, max: 1.0)
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Température Préférée</q-item-label>
                  <q-item-label caption class="label-desc">
                    Température optimale (haut=30°C, bas=5°C). S'éloigner augmente le coût métabolique.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.genes.preferredTemp.toFixed(1) }}°C
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Tolérance Thermique</q-item-label>
                  <q-item-label caption class="label-desc">
                    Écart de température toléré sans pénalité. Au-delà: +5% coût/°C.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    ±{{ creature.genes.thermalTolerance.toFixed(1) }}°C
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
                  <q-item-label caption class="label-desc">
                    Conditions: énergie suffisante, cooldown=0, âge>100 frames, OU fenêtre de fertilité active.
                  </q-item-label>
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
                  <q-item-label class="label-title">Cooldown de Reproduction</q-item-label>
                  <q-item-label caption class="label-desc">
                    Temps d'attente après reproduction. Formule: (200 + masse×15) × fertilité.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.reproductionCooldown }} frames ({{ (creature.reproductionCooldown / 60).toFixed(1) }}s)
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Fenêtre de Fertilité</q-item-label>
                  <q-item-label caption class="label-desc">
                    Période de grâce de 30s après avoir atteint le seuil d'énergie fertile.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.fertilityWindow }} frames ({{ (creature.fertilityWindow / 60).toFixed(1) }}s restantes)
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
                  <q-item-label caption class="label-desc">
                    Unités consommées. Chaque unité: +40 à +80 énergie selon le type.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.stats.foodEaten }} unités
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Distance Parcourue</q-item-label>
                  <q-item-label caption class="label-desc">
                    Distance totale depuis le début de la génération. Indique la mobilité.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.stats.distanceTraveled.toFixed(1) }} pixels
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Temps de Survie</q-item-label>
                  <q-item-label caption class="label-desc">
                    Durée de vie dans la génération actuelle (réinit toutes les 30s).
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.stats.survivalTime }} frames ({{ (creature.stats.survivalTime / 60).toFixed(1) }}s)
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Reproductions</q-item-label>
                  <q-item-label caption class="label-desc">
                    Nombre d'enfants créés. Meilleur indicateur du succès évolutif.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.stats.reproductions }} enfants
                    (coût: ~{{ Math.floor((50 + creature.mass * 4) * creature.genes.fertility) }} énergie/enfant)
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Vitesse Moyenne</q-item-label>
                  <q-item-label caption class="label-desc">
                    Moyenne des vitesses instantanées. Max absolu: 8 px/frame.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{
                      creature.stats.speedSamples > 0
                        ? (creature.stats.totalSpeed / creature.stats.speedSamples).toFixed(2)
                        : '0.00'
                    }} px/frame
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Énergie Perdue</q-item-label>
                  <q-item-label caption class="label-desc">
                    Énergie totale dépensée (métabolisme + nage + température).
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.stats.energyLost.toFixed(1) }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Score Total</q-item-label>
                  <q-item-label caption class="label-desc">
                    Formule: (nourriture×100) + (distance×0.5) + (survie×2) + (repro×200)
                  </q-item-label>
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
                  <q-item-label caption class="label-desc">
                    Effet de la nourriture orange. -50% vitesse pendant 5 secondes.
                  </q-item-label>
                  <q-item-label class="q-mt-sm">
                    <q-chip color="orange" text-color="white" size="sm">
                      {{ creature.debuffs.slow }} frames ({{ (creature.debuffs.slow / 60).toFixed(1) }}s)
                    </q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="creature.debuffs.poison > 0">
                <q-item-section>
                  <q-item-label class="label-title">☠️ Poison</q-item-label>
                  <q-item-label caption class="label-desc">
                    Effet de la nourriture violette. -50% absorption pendant 10 secondes.
                  </q-item-label>
                  <q-item-label class="q-mt-sm">
                    <q-chip color="purple" text-color="white" size="sm">
                      {{ creature.debuffs.poison }} frames ({{ (creature.debuffs.poison / 60).toFixed(1) }}s)
                    </q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- APPRENTISSAGE MOTEUR -->
          <q-tab-panel name="memory" class="scroll-panel">
            <q-list bordered separator class="rounded-borders">
              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Patterns Mémorisés</q-item-label>
                  <q-item-label caption class="label-desc">
                    Patterns de mouvement efficaces découverts. Max: 10. Transmis aux enfants.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.motorMemory.patterns.length }} / 10 patterns
                  </q-item-label>
                  <q-linear-progress
                    :value="creature.motorMemory.patterns.length / 10"
                    color="cyan"
                    class="q-mt-sm"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Test du Pattern Actuel</q-item-label>
                  <q-item-label caption class="label-desc">
                    Progression de l'évaluation (30 frames). Ratio distance/énergie calculé à la fin.
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ creature.motorMemory.patternTimer }} / {{ creature.motorMemory.patternDuration }} frames
                  </q-item-label>
                  <q-linear-progress
                    :value="creature.motorMemory.patternTimer / creature.motorMemory.patternDuration"
                    color="indigo"
                    class="q-mt-sm"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Taux d'Exploration</q-item-label>
                  <q-item-label caption class="label-desc">
                    Chance de tester un nouveau pattern (30%) vs réutiliser le meilleur (70%).
                  </q-item-label>
                  <q-item-label class="label-value q-mt-sm">
                    {{ (creature.motorMemory.learningRate * 100).toFixed(0) }}%
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="creature.motorMemory.patterns.length > 0">
                <q-item-section>
                  <q-item-label class="label-title">Meilleure Efficacité</q-item-label>
                  <q-item-label caption class="label-desc">
                    Ratio distance/énergie le plus élevé parmi tous les patterns.
                  </q-item-label>
                  <q-item-label class="q-mt-sm">
                    <q-chip color="teal" text-color="white" size="sm">
                      {{ Math.max(...creature.motorMemory.patterns.map((p) => p.efficiency)).toFixed(2) }}
                    </q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label class="label-title">Patterns Hérités</q-item-label>
                  <q-item-label caption class="label-desc">
                    Patterns reçus des parents (top 5 de chaque). Avantage de départ.
                  </q-item-label>
                  <q-item-label class="q-mt-sm">
                    <q-chip
                      :color="creature.motorMemory.inherited ? 'positive' : 'grey'"
                      text-color="white"
                      size="sm"
                    >
                      {{ creature.motorMemory.inherited ? 'OUI' : 'NON' }}
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
import { ref, watch } from 'vue'
import { getPropulsionConfig, getPropulsionEmoji, getPropulsionName } from 'src/systems/PropulsionSystem'

const props = defineProps({
  modelValue: Boolean,
  creature: Object
})

const emit = defineEmits(['update:modelValue'])
const activeTab = ref('identity')
const isOpen = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal
  }
)

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)
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
</style>
