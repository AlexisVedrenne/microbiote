/**
 * WaterPhysics.js - Simulation de l'eau (v2)
 * 
 * Principe de propulsion d'un poisson/anguille :
 * 1. Le corps ondule en créant une vague
 * 2. Chaque segment pousse l'eau latéralement
 * 3. L'eau réagit en poussant le segment (Newton III)
 * 4. L'orientation du segment fait que cette force a une composante "avant"
 * 
 * La clé : un segment qui se déplace de côté ET qui est incliné
 * va créer une poussée vers l'avant (comme une rame inclinée)
 */

// Coefficients (augmentés pour propulsion effective)
const DRAG_COEFFICIENT = 0.025       // Résistance au mouvement
const THRUST_COEFFICIENT = 0.15      // Force de propulsion (doublé)
const ANGLE_THRUST_BONUS = 0.25      // Bonus pour angle faible (effet nageoire) (doublé)

/**
 * Calcule la force de propulsion pour un segment
 * 
 * Principe : quand un segment se déplace perpendiculairement à lui-même,
 * il pousse l'eau. L'eau réagit et pousse le segment.
 * 
 * Si le segment est incliné par rapport à son mouvement global,
 * cette force a une composante utile (propulsion).
 */
export function applyWaterForceOnLink(link) {
  const nodeA = link.nodeA
  const nodeB = link.nodeB
  
  // Vitesse de chaque noeud
  const vA = { x: nodeA.vx, y: nodeA.vy }
  const vB = { x: nodeB.vx, y: nodeB.vy }
  
  // Centre et vitesse moyenne du segment
  const centerVel = {
    x: (vA.x + vB.x) / 2,
    y: (vA.y + vB.y) / 2
  }
  
  const speed = Math.sqrt(centerVel.x * centerVel.x + centerVel.y * centerVel.y)
  if (speed < 0.005) return
  
  // Direction du segment (A → B)
  const dx = nodeB.x - nodeA.x
  const dy = nodeB.y - nodeA.y
  const length = Math.sqrt(dx * dx + dy * dy)
  if (length < 1) return
  
  const segDir = { x: dx / length, y: dy / length }
  
  // Perpendiculaire au segment (normale)
  const segNormal = { x: -segDir.y, y: segDir.x }
  
  // Composante de vitesse perpendiculaire au segment
  // C'est cette composante qui "pousse" l'eau
  const perpSpeed = centerVel.x * segNormal.x + centerVel.y * segNormal.y
  
  // Surface effective
  const surface = length / 30 // Normalisé
  
  // === DRAG (résistance) ===
  // Opposé au mouvement, proportionnel à la vitesse perpendiculaire
  const dragMag = Math.abs(perpSpeed) * DRAG_COEFFICIENT * surface
  const dragX = -centerVel.x * dragMag
  const dragY = -centerVel.y * dragMag
  
  // === THRUST (propulsion) ===
  // Quand le segment bouge perpendiculairement, il crée une réaction
  // Cette réaction pousse le segment dans la direction opposée au mouvement perp.
  const thrustMag = perpSpeed * THRUST_COEFFICIENT * surface
  
  // La force de thrust est perpendiculaire au segment
  const thrustX = -segNormal.x * thrustMag
  const thrustY = -segNormal.y * thrustMag
  
  // Appliquer aux deux noeuds (divisé par 2)
  const totalX = (dragX + thrustX) / 2
  const totalY = (dragY + thrustY) / 2
  
  nodeA.applyForce(totalX, totalY)
  nodeB.applyForce(totalX, totalY)
}

/**
 * Effet nageoire : quand deux segments forment un angle et se referment,
 * ils expulsent l'eau et créent une forte poussée
 */
export function applyAngleThrust(link1, link2, sharedNode) {
  // Trouver les extrémités
  const end1 = link1.nodeA === sharedNode ? link1.nodeB : link1.nodeA
  const end2 = link2.nodeA === sharedNode ? link2.nodeB : link2.nodeA
  
  // Vecteurs depuis le centre vers les extrémités
  const v1 = { x: end1.x - sharedNode.x, y: end1.y - sharedNode.y }
  const v2 = { x: end2.x - sharedNode.x, y: end2.y - sharedNode.y }
  
  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
  
  if (len1 < 1 || len2 < 1) return
  
  // Normaliser
  v1.x /= len1; v1.y /= len1
  v2.x /= len2; v2.y /= len2
  
  // Angle entre les deux segments
  const dot = v1.x * v2.x + v1.y * v2.y
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)))
  
  // Vitesses angulaires (mouvement de rotation des extrémités)
  const relVel1 = { x: end1.vx - sharedNode.vx, y: end1.vy - sharedNode.vy }
  const relVel2 = { x: end2.vx - sharedNode.vx, y: end2.vy - sharedNode.vy }
  
  // Perpendiculaires (pour calculer rotation)
  const perp1 = { x: -v1.y, y: v1.x }
  const perp2 = { x: -v2.y, y: v2.x }
  
  // Vitesse angulaire de chaque bras
  const angVel1 = relVel1.x * perp1.x + relVel1.y * perp1.y
  const angVel2 = relVel2.x * perp2.x + relVel2.y * perp2.y
  
  // Vitesse de fermeture (quand les deux bras se rapprochent)
  const closingSpeed = angVel1 - angVel2
  
  if (Math.abs(closingSpeed) < 0.01) return
  
  // Plus l'angle est petit, plus l'effet nageoire est fort
  // (comme une palme qui se ferme)
  const angleEffect = Math.max(0, 1 - angle / Math.PI) // 1 quand fermé, 0 quand ouvert
  
  // Direction de poussée : bissectrice, pointant "vers l'extérieur" du V
  const bissect = { x: v1.x + v2.x, y: v1.y + v2.y }
  const bissLen = Math.sqrt(bissect.x * bissect.x + bissect.y * bissect.y)
  
  if (bissLen < 0.01) return
  
  bissect.x /= bissLen
  bissect.y /= bissLen
  
  // Force de propulsion
  // Fermeture (closingSpeed > 0) → pousse vers l'extérieur du V
  // Ouverture (closingSpeed < 0) → pousse vers l'intérieur (moins fort)
  const thrustMag = closingSpeed * angleEffect * ANGLE_THRUST_BONUS * (len1 + len2) / 2
  
  // Appliquer la force au noeud central (dans la direction de la bissectrice)
  // Si on ferme → on pousse vers l'extérieur → créature avance
  sharedNode.applyForce(bissect.x * thrustMag, bissect.y * thrustMag)
  
  // Réaction sur les extrémités (Newton III) - doit sommer à 100%
  // Chaque extrémité reçoit 50% de la réaction
  end1.applyForce(-bissect.x * thrustMag * 0.5, -bissect.y * thrustMag * 0.5)
  end2.applyForce(-bissect.x * thrustMag * 0.5, -bissect.y * thrustMag * 0.5)
}

/**
 * Applique toute la physique de l'eau
 */
export function applyWaterPhysics(nodes, links) {
  // Loi 1 : force sur chaque segment
  for (const link of links) {
    applyWaterForceOnLink(link)
  }
  
  // Loi 2 : effet nageoire pour les articulations
  for (const node of nodes) {
    const connectedLinks = links.filter(l => l.nodeA === node || l.nodeB === node)
    
    // Pour chaque paire de segments connectés
    if (connectedLinks.length >= 2) {
      for (let i = 0; i < connectedLinks.length; i++) {
        for (let j = i + 1; j < connectedLinks.length; j++) {
          applyAngleThrust(connectedLinks[i], connectedLinks[j], node)
        }
      }
    }
  }
}

export const WATER_CONSTANTS = {
  DRAG_COEFFICIENT,
  THRUST_COEFFICIENT,
  ANGLE_THRUST_BONUS
}
