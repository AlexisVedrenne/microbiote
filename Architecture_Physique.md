# Architecture Physique - Modèle Muscles & Articulations

## Vue d'ensemble

Refactorisation complète de la physique des créatures pour passer d'un modèle à **contraintes rigides** vers un modèle à **muscles contractiles** et **articulations actives**, inspiré des simulations physiques réalistes de créatures aquatiques.

---

## Changements Conceptuels Majeurs

### Ancien Modèle (À Remplacer)

**Segment Rigide** :
- Contraintes Verlet (enforceConstraint) : forçait longueur exacte
- Forces perpendiculaires arbitraires pour propulsion
- Pas de vraie contraction musculaire
- applyDrag basé sur alignement perpendiculaire

**Problèmes** :
- Pas réaliste physiquement
- Segments ne peuvent pas s'étirer/contracter naturellement
- Forces de propulsion "magiques" plutôt que basées sur interaction fluide

### Nouveau Modèle (À Implémenter)

**Muscle Contractile** :
- Ressorts avec longueur cible variable
- Contraction active qui modifie la longueur cible
- Forces fluides basées sur mouvement réel
- Articulations avec contraction angulaire

**Avantages** :
- Physiquement réaliste
- Permet mouvements complexes (nage ondulante, etc.)
- Interaction fluide basée sur Newton III
- Évolution peut optimiser patterns de contraction

---

## 1. Nouvelle Classe : Muscle

Remplace complètement l'ancienne classe `Segment`.

### Propriétés

```javascript
class Muscle {
    constructor(node1, node2, restLength, strength, contractionFrequency, contractionPhase) {
        this.node1 = node1;              // Nœud de départ
        this.node2 = node2;              // Nœud d'arrivée
        this.restLength = restLength;    // Longueur au repos naturel
        this.targetLength = restLength;  // Longueur cible actuelle (varie!)
        this.strength = strength;        // Force musculaire (0.2-0.5)
        this.contractionFrequency = 0.05; // Fréquence contraction (Hz)
        this.contractionPhase = phase;   // Phase oscillation (0-2π)
        this.springConstant = 0.5;       // Constante ressort (k)
    }
}
```

### Méthode 1 : contract(time, muscleStrength)

**But** : Contraction musculaire active qui modifie la longueur cible.

**Fonctionnement** :
```javascript
contract(time, muscleStrength) {
    // Oscillation de contraction/extension
    const contractionAmount = Math.sin(time * this.contractionFrequency + this.contractionPhase);
    
    // Range de contraction : ±20% de longueur repos
    const contractionRange = this.restLength * 0.2 * this.strength * muscleStrength;
    
    // Modifier longueur cible
    this.targetLength = this.restLength + (contractionAmount * contractionRange);
}
```

**Exemple** :
- restLength = 20px
- strength = 0.4
- muscleStrength = 0.5
- contractionRange = 20 × 0.2 × 0.4 × 0.5 = 0.8px
- targetLength oscille entre 19.2px et 20.8px

**Important** : La longueur cible change, pas directement la longueur ! C'est le ressort qui tire vers cette cible.

### Méthode 2 : applySpringForce()

**But** : Force de ressort pour maintenir la structure et atteindre longueur cible.

**Loi de Hooke** : F = k × (x - x₀)

```javascript
applySpringForce() {
    const currentLength = this.getLength();
    const displacement = currentLength - this.targetLength;
    
    // Force ressort proportionnelle au déplacement
    const forceMagnitude = this.springConstant * displacement;
    
    // Direction : normalisée le long du muscle
    const nx = (node2.x - node1.x) / currentLength;
    const ny = (node2.y - node1.y) / currentLength;
    
    const fx = nx * forceMagnitude;
    const fy = ny * forceMagnitude;
    
    // Newton III : action = réaction
    node1.applyForce(fx, fy);      // Tire node1
    node2.applyForce(-fx, -fy);    // Tire node2 dans direction opposée
}
```

**Comportement** :
- Si trop long → force compressive (rapproche les nœuds)
- Si trop court → force extensive (éloigne les nœuds)
- Atteint équilibre dynamique autour de targetLength

### Méthode 3 : applyFluidForce()

**But** : Interaction avec le fluide (eau) - résistance et propulsion.

**Principe** : Quand un segment se déplace dans l'eau :
1. L'eau résiste au mouvement (traînée)
2. Le segment pousse l'eau
3. L'eau pousse le segment en retour (Newton III)

**Calcul** :

```javascript
applyFluidForce() {
    // 1. Vélocité du segment
    const midVx = (node1.vx + node2.vx) / 2;
    const midVy = (node1.vy + node2.vy) / 2;
    const speed = sqrt(midVx² + midVy²);
    
    // 2. Alignement perpendiculaire (produit vectoriel)
    // Plus le segment bouge perpendiculairement à lui-même,
    // plus il crée de résistance (comme une rame)
    const perpAlignment = |segDir × velDir|;  // 0 = parallèle, 1 = perpendiculaire
    
    // 3. Force de traînée
    // Proportionnelle à : surface × vitesse × alignement
    const dragMagnitude = dragCoeff × segmentLength × speed × perpAlignment;
    const dragForce = -velocityDirection × dragMagnitude;  // Opposée au mouvement
    
    // 4. Force de propulsion (si alignement fort)
    if (perpAlignment > 0.5) {
        // Quand le segment "rame" perpendiculairement,
        // il pousse l'eau → l'eau le pousse en retour
        const propulsionDir = perpendicular(segmentDirection);
        const propulsionMag = propulsionCoeff × segmentLength × speed × perpAlignment;
        const propulsionForce = propulsionDir × propulsionMag;
    }
    
    // Appliquer aux deux nœuds
    node1.applyForce((drag + propulsion) / 2);
    node2.applyForce((drag + propulsion) / 2);
}
```

**Valeurs suggérées** :
- `dragCoeff` : 0.02 (résistance modérée)
- `propulsionCoeff` : 0.3 (propulsion significative)

**Résultat** :
- Segment qui glisse parallèlement → peu de résistance
- Segment qui bat perpendiculairement → forte résistance + propulsion
- Propulsion naturelle sans forces "magiques" !

### Méthode 4 : draw()

Visualisation avec couleur selon état de contraction :

```javascript
draw() {
    const ratio = currentLength / restLength;
    
    // Rouge si contracté (court), Bleu si étendu (long)
    const r = 255 × (1 - max(0, ratio - 1));  // Plus rouge si < restLength
    const g = 150;
    const b = 255 × min(1, ratio);            // Plus bleu si > restLength
    
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineWidth = 2;
    // Dessiner ligne entre node1 et node2
}
```

---

## 2. Nouvelle Classe : Joint (Articulation)

Représente un nœud avec 3+ muscles connectés. Permet contraction angulaire.

### Propriétés

```javascript
class Joint {
    constructor(centerNode, connectedNodes) {
        this.centerNode = centerNode;        // Nœud central de l'articulation
        this.connectedNodes = connectedNodes; // Liste des nœuds connectés
        this.contractionStrength = 0.1;      // Force de contraction angulaire
    }
}
```

### Identification des Joints

**Dans Creature.update()**, détecter les joints :

```javascript
identifyJoints() {
    this.joints = [];
    
    for (let node of this.nodes) {
        // Compter combien de muscles sont connectés à ce nœud
        const connectedMuscles = this.muscles.filter(m => 
            m.node1 === node || m.node2 === node
        );
        
        if (connectedMuscles.length >= 3) {
            // C'est une articulation !
            const connectedNodes = connectedMuscles.map(m => 
                m.node1 === node ? m.node2 : m.node1
            );
            
            this.joints.push(new Joint(node, connectedNodes));
        }
    }
}
```

### Méthode : applyJointContraction(time, muscleStrength)

**But** : Simuler contraction musculaire autour d'une articulation (rapproche les membres).

**Principe** : Comme un muscle qui rapproche deux os autour d'un coude.

```javascript
applyJointContraction(time, muscleStrength) {
    // Oscillation de contraction
    const contraction = Math.sin(time × 0.05) × this.contractionStrength × muscleStrength;
    
    // Pour chaque paire de membres connectés
    for (let i = 0; i < connectedNodes.length; i++) {
        for (let j = i + 1; j < connectedNodes.length; j++) {
            const node1 = connectedNodes[i];
            const node2 = connectedNodes[j];
            
            // Vecteurs depuis centre vers chaque nœud
            const vec1 = normalize(node1.position - center.position);
            const vec2 = normalize(node2.position - center.position);
            
            // Force pour rapprocher les deux membres
            // (chaque membre est attiré vers la direction de l'autre)
            node1.applyForce(vec2 × contraction);
            node2.applyForce(vec1 × contraction);
        }
    }
}
```

**Effet** : Les membres "se referment" autour de l'articulation, comme un poing qui se ferme.

**Exemple** :
- Articulation à 3 membres (comme une étoile)
- Contraction → les 3 branches se rapprochent
- Extension → les 3 branches s'écartent

---

## 3. Modifications de la Classe Node

### Ajout : Masse Explicite

```javascript
class Node {
    constructor(x, y, mass = 1.0) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.mass = mass;  // NOUVEAU : masse du point (pour F = ma)
    }
}
```

### Modification : applyForce()

Utiliser la deuxième loi de Newton : F = ma → a = F/m

```javascript
applyForce(fx, fy) {
    // Accélération = Force / Masse
    const ax = fx / this.mass;
    const ay = fy / this.mass;
    
    // Intégration Euler : v = v + a
    this.vx += ax;
    this.vy += ay;
    
    // Limiter vitesse max
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > MAX_SPEED) {
        this.vx = (this.vx / speed) * MAX_SPEED;
        this.vy = (this.vy / speed) * MAX_SPEED;
    }
}
```

### Modification : update()

Friction simplifiée (pas de friction directionnelle complexe) :

```javascript
update() {
    // Friction simple de l'eau
    const waterFriction = 0.95;  // Plus élevé = moins de friction
    this.vx *= waterFriction;
    this.vy *= waterFriction;
    
    // Intégration position : x = x + v
    this.x += this.vx;
    this.y += this.vy;
    
    // Bordures monde
    if (this.x < 0) { this.x = 0; this.vx *= -0.3; }
    if (this.x > WORLD_WIDTH) { this.x = WORLD_WIDTH; this.vx *= -0.3; }
    if (this.y < 0) { this.y = 0; this.vy *= -0.3; }
    if (this.y > WORLD_HEIGHT) { this.y = WORLD_HEIGHT; this.vy *= -0.3; }
}
```

---

## 4. Modifications de la Classe Creature

### Renommage : segments → muscles

```javascript
class Creature {
    constructor(x, y, genes = null, parentNames = null) {
        // ...
        this.muscles = [];  // Au lieu de this.segments
        this.joints = [];   // NOUVEAU
        // ...
    }
}
```

### Modification : update()

**Nouvelle séquence de simulation** :

```javascript
update() {
    // 1. Décrémenter compteurs (debuffs, cooldowns, etc.)
    this.age++;
    // ... autres compteurs
    
    // 2. Identifier articulations
    this.identifyJoints();
    
    // 3. CONTRACTION MUSCULAIRE ACTIVE
    let effectiveMuscleStrength = this.genes.muscleStrength;
    if (this.debuffs.slow > 0) effectiveMuscleStrength *= 0.5;
    
    for (let muscle of this.muscles) {
        muscle.contract(this.age, effectiveMuscleStrength);
    }
    
    // 4. FORCES DE RESSORT (maintien structure)
    for (let muscle of this.muscles) {
        muscle.applySpringForce();
    }
    
    // 5. FORCES FLUIDES (résistance + propulsion)
    for (let muscle of this.muscles) {
        muscle.applyFluidForce();
    }
    
    // 6. CONTRACTION DES ARTICULATIONS
    for (let joint of this.joints) {
        joint.applyJointContraction(this.age, effectiveMuscleStrength);
    }
    
    // 7. MISE À JOUR NŒUDS (intégration)
    for (let node of this.nodes) {
        node.update();
    }
    
    // 8. PLUS DE CONTRAINTES RIGIDES - Retirer enforceConstraint()
    
    // 9. Métabolisme, recherche nourriture, etc. (inchangé)
    // ...
}
```

**Changements clés** :
- ✅ Appeler `muscle.contract()` AVANT les forces
- ✅ Forces de ressort remplacent contraintes rigides
- ✅ Forces fluides basées sur mouvement réel
- ✅ Articulations contractent
- ❌ Retirer complètement `enforceConstraint()`

### Modification : createRandom()

```javascript
createRandom(x, y) {
    const muscleCount = 3 + Math.floor(Math.random() * 3);
    
    // Créer nœuds
    this.nodes.push(new Node(x, y, 1.0));
    
    for (let i = 0; i < muscleCount; i++) {
        const parentNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
        const angle = Math.random() * Math.PI * 2;
        const length = 15 + Math.random() * 25;
        
        const newNode = new Node(
            parentNode.x + Math.cos(angle) * length,
            parentNode.y + Math.sin(angle) * length,
            1.0  // masse
        );
        this.nodes.push(newNode);
        
        // Créer muscle
        this.muscles.push(new Muscle(
            parentNode,
            newNode,
            length,  // restLength
            0.2 + Math.random() * 0.3,  // strength
            0.04 + Math.random() * 0.06, // frequency
            Math.random() * Math.PI * 2  // phase
        ));
    }
    
    this.calculateMass();
}
```

### Modification : addMuscle() / removeMuscle()

Renommer `addSegment()` → `addMuscle()` et `removeSegment()` → `removeMuscle()`.

**Logique identique**, juste changer les références.

### Modification : draw()

```javascript
draw() {
    // Dessiner muscles
    for (let muscle of this.muscles) {
        muscle.draw();  // Utilise la nouvelle méthode draw() avec couleur contraction
    }
    
    // Dessiner nœuds
    for (let node of this.nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
        ctx.fill();
        
        // Aura si fertile
        if (this.canReproduce()) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    // Afficher noms (inchangé)
    // ...
    
    // Highlight articulations (optionnel - debug)
    for (let joint of this.joints) {
        ctx.beginPath();
        ctx.arc(joint.centerNode.x, joint.centerNode.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
```

---

## 5. Paramètres à Ajuster

### Constantes Physiques

```javascript
// Node
const MAX_SPEED = 8.0;           // Vitesse max (inchangé)
const WATER_FRICTION = 0.95;     // Friction eau (augmenté : 0.92 → 0.95)

// Muscle
const SPRING_CONSTANT = 0.5;     // Constante ressort (k)
const CONTRACTION_RANGE = 0.2;   // ±20% longueur repos
const DRAG_COEFFICIENT = 0.02;   // Coefficient traînée fluide
const PROPULSION_COEFFICIENT = 0.3; // Coefficient propulsion fluide

// Joint
const JOINT_CONTRACTION_STRENGTH = 0.1;  // Force contraction angulaire

// Métabolisme (inchangé)
const METABOLISM_RATE = 0.008;
```

### Gènes Évolutifs (Inchangés)

Les gènes restent les mêmes :
- `muscleStrength` : Affecte force de contraction
- `metabolicEfficiency` : Coût énergétique
- `maxEnergyBonus` : Capacité max
- `fertility` : Reproduction
- `preferredTemp` : Température
- `thermalTolerance` : Tolérance thermique

**Note** : `muscleStrength` affecte maintenant :
1. Range de contraction (`contractionRange`)
2. Force de contraction des articulations
3. Toujours le métabolisme (plus de muscles = plus d'énergie)

---

## 6. Migrations de Code

### Recherches/Remplacements Globaux

```
this.segments → this.muscles
Segment → Muscle (classes uniquement)
addSegment → addMuscle
removeSegment → removeMuscle
seg → muscle (variables)
```

### Suppressions Complètes

- Méthode `Segment.enforceConstraint()`
- Boucle d'itération contraintes dans `Creature.update()` :
  ```javascript
  // RETIRER CECI :
  for (let iteration = 0; iteration < 3; iteration++) {
      for (let seg of this.segments) {
          seg.enforceConstraint();
      }
  }
  ```

---

## 7. Checklist d'Implémentation

### Phase 1 : Classes de Base
- [ ] Créer classe `Muscle` complète
- [ ] Créer classe `Joint` complète
- [ ] Modifier classe `Node` (masse, F=ma)
- [ ] Tester muscles isolés

### Phase 2 : Intégration Creature
- [ ] Renommer `segments` → `muscles` partout
- [ ] Ajouter `identifyJoints()`
- [ ] Modifier `update()` avec nouvelle séquence
- [ ] Retirer `enforceConstraint()`
- [ ] Tester créatures simples

### Phase 3 : Ajustements
- [ ] Tweaker constantes physiques
- [ ] Vérifier propulsion fonctionnelle
- [ ] Vérifier structures stables
- [ ] Ajuster force articulations

### Phase 4 : Migration Features
- [ ] Adapter `createRandom()` / `addMuscle()` / `removeMuscle()`
- [ ] Adapter `getGenes()` / `mergeStructures()`
- [ ] Adapter logs d'évolution
- [ ] Adapter mémoire évolutive

### Phase 5 : Tests
- [ ] Contraction visible
- [ ] Propulsion fonctionnelle
- [ ] Articulations détectées
- [ ] Forces équilibrées
- [ ] Performance maintenue

---

## Conclusion

Cette refactorisation transforme le modèle physique vers un système **réaliste basé sur muscles contractiles** avec **interaction fluide Newton III**.

**Prêt pour implémentation par Claude Code !** 🚀
