import { ref } from 'vue'
import { WORLD_WIDTH, WORLD_HEIGHT, CAMERA_MIN_ZOOM, CAMERA_MAX_ZOOM, CAMERA_ZOOM_INTENSITY } from 'src/utils/Constants'

export function useCamera(canvasWidth, canvasHeight) {
  const camera = ref({
    x: WORLD_WIDTH / 2 - canvasWidth / 2,
    y: WORLD_HEIGHT / 2 - canvasHeight / 2,
    zoom: 1.0
  })

  const isDragging = ref(false)
  const lastMouseX = ref(0)
  const lastMouseY = ref(0)

  function startDrag(clientX, clientY) {
    isDragging.value = true
    lastMouseX.value = clientX
    lastMouseY.value = clientY
  }

  function moveDrag(clientX, clientY) {
    if (!isDragging.value) return

    const dx = clientX - lastMouseX.value
    const dy = clientY - lastMouseY.value

    camera.value.x -= dx / camera.value.zoom
    camera.value.y -= dy / camera.value.zoom

    // Limiter caméra dans le monde
    camera.value.x = Math.max(0, Math.min(WORLD_WIDTH - canvasWidth / camera.value.zoom, camera.value.x))
    camera.value.y = Math.max(0, Math.min(WORLD_HEIGHT - canvasHeight / camera.value.zoom, camera.value.y))

    lastMouseX.value = clientX
    lastMouseY.value = clientY
  }

  function endDrag() {
    isDragging.value = false
  }

  function zoom(deltaY, mouseX, mouseY) {
    const wheel = deltaY < 0 ? 1 : -1
    const zoomFactor = Math.exp(wheel * CAMERA_ZOOM_INTENSITY)

    // Position souris dans le monde avant zoom
    const mouseWorldX = camera.value.x + mouseX / camera.value.zoom
    const mouseWorldY = camera.value.y + mouseY / camera.value.zoom

    camera.value.zoom *= zoomFactor
    camera.value.zoom = Math.max(CAMERA_MIN_ZOOM, Math.min(CAMERA_MAX_ZOOM, camera.value.zoom))

    // Ajuster caméra pour garder la souris au même endroit
    camera.value.x = mouseWorldX - mouseX / camera.value.zoom
    camera.value.y = mouseWorldY - mouseY / camera.value.zoom

    // Limiter caméra
    camera.value.x = Math.max(0, Math.min(WORLD_WIDTH - canvasWidth / camera.value.zoom, camera.value.x))
    camera.value.y = Math.max(0, Math.min(WORLD_HEIGHT - canvasHeight / camera.value.zoom, camera.value.y))
  }

  function screenToWorld(screenX, screenY) {
    return {
      x: camera.value.x + screenX / camera.value.zoom,
      y: camera.value.y + screenY / camera.value.zoom
    }
  }

  function focusOn(worldX, worldY) {
    // Centrer la caméra sur la position donnée
    camera.value.x = worldX - canvasWidth / (2 * camera.value.zoom)
    camera.value.y = worldY - canvasHeight / (2 * camera.value.zoom)

    // Limiter caméra dans le monde
    camera.value.x = Math.max(0, Math.min(WORLD_WIDTH - canvasWidth / camera.value.zoom, camera.value.x))
    camera.value.y = Math.max(0, Math.min(WORLD_HEIGHT - canvasHeight / camera.value.zoom, camera.value.y))
  }

  return {
    camera,
    isDragging,
    startDrag,
    moveDrag,
    endDrag,
    zoom,
    screenToWorld,
    focusOn
  }
}
