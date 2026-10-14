# Simulation d'Évolution de Microbes Aquatiques

## Vue d'ensemble

Simulation interactive d'évolution de créatures microbiennes dans un environnement aquatique 2D. Les créatures ont des structures articulées évolutives, se reproduisent, mangent, évoluent et s'adaptent à leur environnement selon des patterns d'évolution intelligents basés sur l'analyse des morts passées.

**Fichier principal** : `evolution-microbienne.html` (fichier unique HTML/CSS/JavaScript)

---

## Architecture Technique

### Structure du Monde

- **Taille du monde** : 5000 × 5000 pixels
- **Type** : Monde fermé avec bordures solides (murs)
- **Caméra déplaçable** :
  - Drag souris (clic gauche + déplacement) pour déplacer la vue
  - Molette souris pour zoom/dézoom (0.3× à 2.0×)
  - Panels UI restent fixes à l'écran
- **Température verticale** :
  - Gradient de température du haut vers le bas
  - Haut (y=0) : 30°C (chaud) - Rouge
  - Bas (y=5000) : 5°C (froid) - Bleu
  - Affichage visuel : 50 bandes de gradient en arrière-plan

### Système de Rendu

- Canvas HTML5 2D
- Transformation caméra avec `ctx.save()` / `ctx.restore()`
- Coordonnées : écran → monde via `camera.x + screenX / camera.zoom`
- FPS cible : 60 fps
- Simulation peut être accélérée (1× à 5×)

---

## Classes Principales

### 1. Node (Nœud)

**Rôle** : Points de masse qui composent le squelette des créatures

**Propriétés** :
- `x, y` : Position dans le monde
- `vx, vy` : Vélocité
- **Vitesse maximum** : 8 pixels/frame (hard cap)

**Méthodes** :
- `applyForce(fx, fy)` : Ajoute une force, limite vitesse max
- `update(waterFriction)` :
  - Friction directionnelle (forward vs lateral)
  - Forward friction : `waterFriction` (normal)
  - Lateral friction : 0.75 (forte résistance latérale)
  - Collision avec bordures du monde (rebond × 0.3)

### 2. Segment (Bâton/Articulation)

**Rôle** : Relie deux nœuds, génère forces de propulsion

**Propriétés** :
- `node1, node2` : Nœuds connectés
- `restLength` : Longueur au repos
- `strength` : Force musculaire (0.2-0.5)
- `phase` : Phase de l'oscillation (0-2π)
- `frequency` : Fréquence d'oscillation (0.04-0.10)

**Méthodes** :
- `applyForces(time, muscleStrength)` :
  - Calcule contraction : `sin(time × frequency + phase) × strength × muscleStrength`
  - Force perpendiculaire pour propulsion : `contraction × 2.5`
  - **PAS d'extension/contraction** - segments rigides
  
- `enforceConstraint()` :
  - Contrainte de distance rigide (Verlet)
  - Force segments à garder leur longueur exacte
  - Correction géométrique directe des positions
  - 3 itérations par frame

- `applyDrag()` :
  - Traînée hydrodynamique
  - Résistance de surface basée sur alignement perpendiculaire
  - Propulsion quand segment bat perpendiculairement

### 3. Creature (Créature)

**Rôle** : Organisme vivant composé de nœuds et segments

#### Propriétés Physiques

- `nodes[]` : Liste de nœuds (minimum 3)
- `segments[]` : Liste de segments (minimum 2)
- `mass` : Calculée depuis nombre de nœuds × 2
- `energy` : Énergie actuelle (0-maxEnergy)
- `maxEnergy` : Capacité énergétique (100 + maxEnergyBonus)
- `age` : Âge en frames
- `color` : {r, g, b} - Couleur visuelle

#### Gènes Évolutifs

```javascript
genes: {
    muscleStrength: 0.2,           // Force de propulsion (0.2-0.6)
    metabolicEfficiency: 1.0,      // Coût métabolique (0.5-1.0, plus bas = mieux)
    maxEnergyBonus: 0,             // Bonus capacité énergétique
    fertility: 1.0,                // Fertilité (plus bas = plus fertile)
    preferredTemp: 15-25,          // Température préférée (°C)
    thermalTolerance: 5.0          // Tolérance thermique (±°C)
}
```

#### Identité

- `firstName` : Prénom généré (ex: "Aquaflux-42")
- `familyName` : Nom de famille combiné des parents (ex: "Aqua-Drift-Nano-Wave")
  - Max 4 parties pour éviter noms trop longs
  - `null` si créature sans parents

#### Stats de Performance

```javascript
stats: {
    foodEaten: 0,              // Nourriture mangée
    distanceTraveled: 0,       // Distance parcourue
    survivalTime: 0,           // Temps de survie (frames)
    reproductions: 0,          // Nombre de reproductions
    totalSpeed: 0,             // Vitesse cumulée
    speedSamples: 0,           // Échantillons de vitesse
    energyLost: 0              // Énergie perdue
}
```

#### Reproduction

- `reproductionCooldown` : Frames avant pouvoir se reproduire (200 + masse × 15) × fertility
- `fertilityWindow` : Compteur fenêtre de fertilité (30 secondes = 1800 frames)
  - Quand devient fertile → démarre à 1800
  - Reste fertile pendant 30s même si énergie baisse
  - Se réinitialise après reproduction

**Conditions pour être fertile** :
- Énergie > `(100 + masse × 8) × fertility` OU dans fenêtre de fertilité
- Cooldown = 0
- Âge > `100 / fertility`

#### Debuffs (Effets Négatifs)

```javascript
debuffs: {
    slow: 0,      // Frames restantes de ralentissement (-50% vitesse)
    poison: 0     // Frames restantes d'empoisonnement (-50% absorption)
}
```

#### Méthodes Principales

**`update()`** :
- Gère métabolisme, debuffs, température
- Coût énergétique : `(masse × 0.008) × metabolicEfficiency × tempPenalty`
- Applique forces segments (réduite × 0.5 si slow)
- Applique traînée hydrodynamique
- Met à jour nœuds avec friction eau : `0.92 - (masse × 0.005)`
- Applique contraintes rigides (3 passes)
- Tracker stats de performance

**`seekFood()`** :
- Vision range : `100 + masse × 10` pixels
- Détecte nourriture proche
- Mange si contact (radius + 10px)
- Applique force d'attraction vers nourriture la plus proche
- Force réduite × 0.5 si slow
- Gère types de nourriture et debuffs

**`seekMate()`** :
- Range détection : `150 / fertility` pixels
- Détecte partenaires fertiles
- **Préférence hors-famille** : 60% de chance de préférer partenaire hors-famille
- Reproduit si contact physique (radius + autre.radius + 5px)
- Force d'attraction : `0.2 / fertility`

**`reproduce(partner)`** :
- Combine noms de famille (max 4 parties)
- Fusionne gènes (moyenne des deux parents)
- Fusionne structures (50-80% segments des deux parents)
- Coût : `(50 + masse × 4) × fertility` pour chaque parent
- Cooldown : `(200 + masse × 15) × fertility`
- Log avec indication même famille / hors-famille

**`checkCannibalism()`** :
- Peut manger si `masse > 1.5 × autre.masse` OU `(énergie > autre.énergie ET autre.énergie < 30)`
- Gain : `masse_victime × 15` énergie
- Enregistre mort par cannibalisme

**`evolve()`** :
- Analyse faiblesses personnelles (vitesse, nourriture, efficacité, survie)
- **Consulte mémoire évolutive** (analyse des 100 dernières morts)
- **Évitement adaptatif** : 30% de chance d'éviter choix dangereux
- Choix d'évolution selon faiblesse :
  - **Speed** : ↑ muscleStrength (×1.3, max 0.6) + synchronisation phases
  - **Food** : +Segment OU ↑ muscleStrength
  - **Efficiency** : ↓ metabolicEfficiency (×0.85, min 0.5) OU -Segment
  - **Survival** : ↑ maxEnergyBonus (+30) OU ↑ fertility (×0.85, min 0.5)

**`draw()`** :
- Dessine segments avec gradient énergie
- Dessine nœuds avec aura cyan si fertile
- Affiche prénom en permanence (cyan si fertile, blanc sinon)
- Affiche nom de famille si existe
- Indicateurs debuff : 🐌 (slow) et ☠️ (poison)

**Structure Functions** :
- `addSegment()` : Ajoute segment attaché à nœud existant (min 15px)
- `removeSegment()` : Retire segment aléatoire, garde min 3 nœuds
- `ensureConnectivity()` : BFS pour vérifier graphe connexe, supprime nœuds orphelins
- `mergeStructures()` : Fusionne structures de deux parents pour enfant

### 4. Food (Nourriture)

**4 Types avec probabilités** :

#### 🟢 Normale (60%)
- Couleur : Vert (`#00ff88` → `#00aa55`)
- Énergie : +40
- Taille : 4px
- Type le plus commun

#### 🟡 Riche (20%)
- Couleur : Doré/Jaune (`#ffdd00` → `#ff8800`)
- Énergie : +80 (double!)
- Taille : 6px (plus grosse)
- **Spawn en amas** : 3-5 unités dans rayon 10-40px
- Effet visuel : Pulsation avec `sin(time × 0.1)`

#### 🟠 Affaiblissante (15%)
- Couleur : Orange (`#ff9944` → `#ff6622`)
- Énergie : +30
- Taille : 4px
- **Debuff** : Slow pendant 300 frames (5 secondes)
  - Réduit force musculaire × 0.5
  - Réduit force de recherche × 0.5

#### 🟣 Empoisonnée (5%)
- Couleur : Violet/Rouge (`#cc00ff` → `#880088`)
- Énergie : +20
- Taille : 4px
- **Debuff** : Poison pendant 600 frames (10 secondes)
  - Réduit absorption d'énergie × 0.5 pour TOUTE nourriture

**Méthode** :
- `draw()` : Gradient radial avec glow, effet pulsation si riche

---

## Système d'Évolution Intelligente

### Mémoire Évolutive

**Structure** :
- Garde les **100 dernières morts** en mémoire
- Chaque mort enregistre :
  - Cause : `STARVATION`, `CANNIBALISM`, `OLD_AGE` (âge > 1800 frames)
  - Gènes complets
  - Structure (nodeCount, segmentCount)
  - Stats de performance
  - Masse

**Analyse par Génération** :

```javascript
analyzeDeathPatterns() {
    // Patterns détectés (si assez de données) :
    
    // 5+ morts de faim :
    if (avgSegments > 6) → avoidManySegments = true
    if (avgSpeed < 0.25) → avoidLowSpeed = true
    
    // 3+ morts par cannibalisme :
    if (avgMass < 8) → avoidSmallSize = true
    
    // 3+ morts de vieillesse (bonne structure) :
    if (avgSegments < 4) → avoidManySegments = true
    else if (avgSegments > 6) → avoidFewSegments = true
}
```

**Application dans evolve()** :
- 30% de chance d'éviter choix dangereux
- Messages "Évolution PRUDENTE" dans logs
- Exemples :
  - Veut +segment MAIS pattern dit "éviter" → Améliore vitesse à la place
  - Veut -segment MAIS pattern dit "trop petit = cannibalisme" → Améliore métabolisme

### Système de Génération

**Durée** : 30 secondes (1800 frames)

**À chaque génération** :
1. **Survivants évoluent** :
   - Analysent leurs faiblesses
   - Consultent mémoire évolutive
   - Choisissent UNE amélioration
   - Reset stats
   - Boost énergie +50

2. **Nouvelles créatures ajoutées** :
   - 0 survivant → +30 nouvelles (extinction)
   - 1-9 survivants → +25 nouvelles
   - 10-19 survivants → +15 nouvelles
   - 20-29 survivants → +10 nouvelles
   - 30+ survivants → +5 nouvelles

3. **Nourriture fraîche** : +80 unités

### Génération de Noms

**Prénoms** :
- Format : `{PREFIX}{SUFFIX}-{NUMBER}`
- Prefixes : Aqua, Hydro, Nano, Micro, Proto, Neo, Cyto, Bio, Plankto, Vitro, Zygo, Mito
- Suffixes : belle, flux, wave, drift, glide, pulse, ion, zoa, cyte, morph, pod, blast
- Exemple : "Aquaflux-42", "Nanoglide-17"

**Noms de Famille** :
- Créés lors de reproduction
- Combine noms des parents : "Aqua-Drift" + "Nano-Wave" → "Aqua-Drift-Nano-Wave"
- Limité à 4 parties maximum
- Nouvelles créatures (sans parents) n'ont pas de famille

---

## Physique et Propulsion

### Friction de l'Eau

**Friction directionnelle** :
- Forward (dans direction mouvement) : `waterFriction = 0.92 - (masse × 0.005)`
- Lateral (perpendiculaire) : `0.75` (forte résistance)
- Décompose vélocité en composantes forward/lateral
- Applique frictions différentes

### Propulsion

**Mécanisme** :
1. **Contraction musculaire** : `sin(time × frequency + phase) × strength × muscleStrength`
2. **Force perpendiculaire** : Battement latéral (× 2.5)
3. **Traînée hydrodynamique** : Résistance proportionnelle à vitesse² et alignement perpendiculaire
4. **Contraintes rigides** : Segments gardent longueur exacte (3 passes Verlet)

**Pas d'extension/contraction** - Les segments ne s'étirent pas, seulement pivotent.

### Température

**Effet sur métabolisme** :
```javascript
currentTemp = 30 - (y / WORLD_HEIGHT) × 25  // 30°C en haut, 5°C en bas
tempDiff = |currentTemp - preferredTemp|
if (tempDiff > thermalTolerance) {
    overshoot = tempDiff - thermalTolerance
    tempPenalty = 1.0 + (overshoot × 0.05)  // +5% coût par degré
}
metabolismCost *= tempPenalty
```

---

## Interface Utilisateur

### Panels (Draggables)

**Controls** (gauche haut) :
- Boutons : Pause, Reset, Ajouter Nourriture
- Slider vitesse simulation (1× à 5×)
- Stats population :
  - Population actuelle
  - Génération actuelle
  - Naissances totales
  - Morts de faim
  - Cannibalismes
- Stats moyennes :
  - Énergie, Taille, Segments, Vitesse, Génération

**Info** (droite haut) :
- Instructions
- Légende couleurs

**Journal d'événements** (droite bas) :
- 10 derniers événements
- Format avec prénoms :
  - "💕 Aquaflux-12 + Nanodrift-5 (hors-famille) → Hydroglide-33"
  - "💀 Aquaflux-12 (faim)"
  - "🔪 Hydrowave-88 mange Microglide-3"
  - "Aquaflux-12: Évolution VITESSE"
  - "Nanodrift-5: Évolution PRUDENTE (évite + segments)"

**Classements** (gauche bas) :
- Top 10 Individus (par score)
  - Format : "1. Aquaflux-12 (Aqua-Drift) - 1250 pts"
- Top 10 Familles (par score moyen)
  - Format : "1. Aqua-Drift-Nano - 5 membres, 850 pts/membre"
- Mis à jour toutes les secondes

### Contrôles Caméra

- **Drag** : Clic gauche + déplacement
- **Zoom** : Molette souris (0.3× à 2.0×)
- **Clic** : Ajoute 8 unités de nourriture (converti en coordonnées monde)
- Curseur : `grab` → `grabbing` pendant drag

---

## Gameplay et Règles

### Cycle de Vie

1. **Naissance** :
   - Spawn aléatoire (nouvelles créatures)
   - Spawn entre parents (reproduction)
   - Minimum 3 nœuds garantis

2. **Vie** :
   - Cherche nourriture (force d'attraction)
   - Cherche partenaire si fertile (préférence hors-famille 60%)
   - Perd énergie par métabolisme
   - Peut être ralentie/empoisonnée
   - Peut manger ou être mangée (cannibalisme)

3. **Mort** :
   - Faim : énergie ≤ 0
   - Cannibalisme : mangée par plus grosse
   - Vieillesse : âge > 1800 frames (rare)

### Score de Performance

```javascript
score = (foodEaten × 100) + 
        (distanceTraveled × 0.5) + 
        (survivalTime × 2) + 
        (reproductions × 200)
```

### Trade-offs Évolutifs

**Gros** :
- ➕ Mange les petits
- ➕ Plus d'énergie max possible
- ➖ Lent (friction élevée)
- ➖ Coût métabolique élevé
- ➖ Reproduction coûteuse et lente

**Petit** :
- ➕ Rapide et agile
- ➕ Efficace énergétiquement
- ➕ Reproduction rapide
- ➖ Vulnérable cannibalisme
- ➖ Moins d'énergie max

**Nombreux segments** :
- ➕ Propulsion complexe possible
- ➕ Surface de nage élevée
- ➖ Coût métabolique élevé
- ➖ Lenteur structurelle

**Peu de segments** :
- ➕ Efficace énergétiquement
- ➕ Rapide
- ➖ Propulsion limitée
- ➖ Moins de possibilités évolutives

---

## Configuration Globale

### Constantes Monde

```javascript
WORLD_WIDTH = 5000
WORLD_HEIGHT = 5000
GENERATION_DURATION = 1800  // 30 secondes
MAX_DEATH_HISTORY = 100     // Mémoire évolutive
```

### Constantes Créatures

```javascript
MIN_NODES = 3
MIN_SEGMENTS = 2
MAX_SEGMENTS = 12
MAX_SPEED = 8.0  // pixels/frame

// Reproduction
REPRODUCTION_BASE_COST = 50
REPRODUCTION_MASS_MULTIPLIER = 4
REPRODUCTION_BASE_COOLDOWN = 200
REPRODUCTION_COOLDOWN_MULTIPLIER = 15
FERTILITY_WINDOW_DURATION = 1800  // 30 secondes
AGE_FOR_FERTILITY = 100  // frames

// Métabolisme
METABOLISM_RATE = 0.008
DEFAULT_METABOLIC_EFFICIENCY = 1.0
DEFAULT_MUSCLE_STRENGTH = 0.2

// Physique
WATER_FRICTION_BASE = 0.92
WATER_FRICTION_MASS_PENALTY = 0.005
LATERAL_FRICTION = 0.75
SEGMENT_SPRING_FORCE = 0.8
SEGMENT_BEAT_FORCE = 2.5
CONSTRAINT_ITERATIONS = 3
```

### Constantes Nourriture

```javascript
FOOD_TYPES = {
    NORMAL: { energy: 40, probability: 0.60 },
    RICH: { energy: 80, probability: 0.20, clusterSize: 3-5 },
    WEAKENING: { energy: 30, probability: 0.15, debuff: 300 frames },
    POISONED: { energy: 20, probability: 0.05, debuff: 600 frames }
}
```

---

## Optimisations Possibles (Future)

### Performance

1. **Spatial Hashing** :
   - Diviser monde en grille
   - Recherche nourriture/partenaires seulement dans cellules voisines
   - Réduire complexité O(n²) → O(n)

2. **Culling** :
   - Ne pas dessiner/calculer créatures hors caméra
   - Système de LOD (Level of Detail) selon zoom

3. **Web Workers** :
   - Calculs physique dans thread séparé
   - Permet simulation + rapide sans bloquer UI

### Fonctionnalités

1. **Sérialisation** :
   - Sauvegarder/charger simulation
   - Export génome des meilleures créatures
   - Replay des générations

2. **Graphiques Évolutifs** :
   - Graphes population vs temps
   - Évolution des traits moyens
   - Arbre généalogique des familles

3. **Obstacles Environnementaux** :
   - Murs, rochers
   - Courants d'eau
   - Zones toxiques

4. **Prédateurs/Proies** :
   - Espèces différentes
   - Chaînes alimentaires
   - Coévolution

---

## Architecture Fichier HTML

### Structure

```
<!DOCTYPE html>
<html>
<head>
    <style>
        /* CSS pour panels UI */
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <div id="controls">...</div>
    <div id="info">...</div>
    <div id="eventLog">...</div>
    <div id="rankings">...</div>
    
    <script>
        // 1. Configuration globale
        // 2. Générateurs (noms, température)
        // 3. Classe Node
        // 4. Classe Segment
        // 5. Classe Creature
        // 6. Classe Food
        // 7. Mémoire évolutive
        // 8. Fonctions simulation
        // 9. UI et contrôles
        // 10. Event listeners
        // 11. Game loop
    </script>
</body>
</html>
```

### Ordre d'Exécution

1. `init()` : Crée population initiale et nourriture
2. `gameLoop()` : Boucle principale à 60 FPS
   - `update()` : Met à jour simulation
     - Update créatures
     - Check morts
     - Check générations
   - `draw()` : Rendu avec caméra
   - `updateStats()` : Mise à jour UI

---

## Logs et Debugging

### Types d'Événements

- **birth** (💕) : Naissances
- **death** (💀) : Morts de faim/vieillesse
- **cannibalism** (🔪) : Cannibalisme
- **evolution** : Messages d'évolution

### Format Messages

```javascript
// Naissance
"💕 {prénom1} + {prénom2} ({même/hors}-famille) → {prénom_enfant}"

// Mort
"💀 {prénom} (faim|vieillesse)"

// Cannibalisme
"🔪 {prénom_prédateur} mange {prénom_victime}"

// Évolution
"{prénom}: Évolution {TYPE}"
"{prénom}: Évolution PRUDENTE (évite {raison})"
```

---

## Points d'Extension Future

### Traits Évolutifs Possibles

1. **Résistance Poison** : Réduit durée/effet debuffs
2. **Détection Type Nourriture** : Évite nourriture dangereuse
3. **Vision Améliorée** : Range de détection augmentée
4. **Armure** : Réduit dégâts cannibalisme
5. **Camouflage** : Réduit détection par prédateurs
6. **Régénération** : Récupère énergie passivement
7. **Adaptation Thermique** : Améliore tolérance température

### Mécaniques Additionnelles

1. **Maladies** : Transmissibles par contact
2. **Mutations Aléatoires** : 1% chance lors reproduction
3. **Symbiose** : Créatures peuvent former groupes coopératifs
4. **Territoire** : Zones défendues
5. **Saisonnalité** : Cycles de température/nourriture

---

## Conclusion

Système complet d'évolution avec :
- ✅ Physique réaliste (contraintes rigides, friction directionnelle)
- ✅ Évolution intelligente (mémoire des morts, évitement adaptatif)
- ✅ Écosystème riche (4 types nourriture, température, debuffs)
- ✅ Génétique complexe (6 traits, fusion structures)
- ✅ Noms/familles (prénoms générés, lignées)
- ✅ UI complète (caméra, zoom, classements, logs)
- ✅ Monde explorable (5000×5000, température verticale)

**Fichier unique** : `evolution-microbienne.html` (~2000 lignes)

**Prêt pour refactoring** avec séparation :
- `classes/` : Node, Segment, Creature, Food
- `systems/` : Physics, Evolution, Memory, Genetics
- `utils/` : Names, Temperature, Camera
- `ui/` : Panels, Rendering, Controls
- `config.js` : Toutes les constantes
- `main.js` : Initialisation et game loop
