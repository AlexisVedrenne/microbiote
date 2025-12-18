<template>
  <DraggablePanel :initial-x="windowWidth - 320" :initial-y="20" max-width="280px">
    <div class="info-title">💡 Règles</div>
    <div class="info-content">
      • Microbes avec structure libre évolutive<br />
      • Segments qui s'étirent/contractent pour nager<br />
      • Reproduction par contact + énergie<br />
      • Enfants héritent des 2 parents<br />
      • <span class="highlight-green">Vert = nourriture</span><br />
      • <span class="highlight-magenta">Cannibales = plus gros mangent plus petits</span><br />
      • Gros = lent, petit = rapide<br />
      • Clic = ajouter nourriture
    </div>
  </DraggablePanel>
</template>

<script setup>
import { ref } from 'vue'
import DraggablePanel from 'src/components/ui/DraggablePanel.vue'

const windowWidth = ref(window.innerWidth)
</script>

<style scoped lang="sass">
.info-title
  color: #00ffff
  font-weight: bold
  margin-bottom: 8px
  font-size: 14px

.info-content
  color: #99e6ff
  line-height: 1.6
  font-size: 11px

.highlight-green
  color: #00ff88

.highlight-magenta
  color: #ff00ff
</style>
