import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '../constants'

export function getMuscleLabel(value: string) {
  return MUSCLE_LABELS[value] ?? value
}

export function getEquipmentLabel(value: string) {
  return EQUIPMENT_LABELS[value] ?? value
}

export function formatRoutineDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}
