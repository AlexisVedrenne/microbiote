import { WORLD_HEIGHT, MIN_TEMP, MAX_TEMP } from 'src/utils/Constants'

export function getTemperatureAt(y) {
  const ratio = y / WORLD_HEIGHT
  return MAX_TEMP - ratio * (MAX_TEMP - MIN_TEMP)
}

export function getTemperatureColor(y) {
  const temp = getTemperatureAt(y)
  const ratio = (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)

  const r = Math.floor(ratio * 200 + 20)
  const g = Math.floor(50)
  const b = Math.floor((1 - ratio) * 200 + 20)

  return `rgb(${r}, ${g}, ${b})`
}
